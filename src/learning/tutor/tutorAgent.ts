import type { LocalChatMessage } from '../../engine/ai/localGenerationProtocol';
import type { LocalGenerationOptions, LocalGenerationService } from '../../engine/ai/localGenerationService';
import type { TutorActivityContext, TutorWorkspaceContext } from './tutorContext';
import { buildTutorFileEditRequest, buildTutorPlanRepairRequest, buildTutorPlannerRequest, buildTutorResponseRequest, type TutorMode } from './tutorPrompt';
import { allowsTutorWrite, executeTutorTool, parseTutorToolCall, type TutorReinforcementDraft, type TutorToolActivity, type TutorToolCall, type TutorToolExecution } from './tutorTools';

export interface TutorTurnInput {
  mode: TutorMode;
  question: string;
  attemptCount: number;
  activity: TutorActivityContext;
  conversation: Array<Pick<LocalChatMessage, 'role' | 'content'>>;
  generationOptions?: Pick<LocalGenerationOptions, 'model' | 'signal' | 'onChunk'>;
}
export interface TutorTurnResult { response: string; activities: TutorToolActivity[]; changedFiles: string[]; reinforcement?: TutorReinforcementDraft; }
interface TutorPlan { calls: TutorToolCall[]; replyStrategy: string; }

function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('No se encontró un objeto JSON.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  throw new Error('El objeto JSON quedó incompleto.');
}

function parsePlan(text: string): TutorPlan {
  let value: unknown;
  try { value = JSON.parse(extractJsonObject(text)); } catch (reason) { throw new Error(reason instanceof Error ? reason.message : 'El JSON del plan no es válido.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('El modelo no produjo un plan de herramientas válido.');
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.calls) || candidate.calls.length > 3 || typeof candidate.replyStrategy !== 'string') throw new Error('El modelo no produjo un plan de herramientas válido.');
  const calls = candidate.calls.map(parseTutorToolCall);
  if (calls.some((call) => call === null)) throw new Error('El modelo no produjo un plan de herramientas válido.');
  return { calls: calls as TutorToolCall[], replyStrategy: candidate.replyStrategy.trim() };
}

function stripOuterCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  return (match?.[1] ?? trimmed).trim();
}

function editValidationError(question: string, content: string): string | null {
  const requested = question.match(/\bfunci[oó]n\s+(?:llamada\s+)?([A-Za-z_$][\w$]*)/i)?.[1]?.toLowerCase();
  if (!requested || ['en', 'que', 'para', 'con', 'del', 'una'].includes(requested)) return null;
  const identifiers = content.match(/[A-Za-z_$][\w$]*/g)?.map((value) => value.toLowerCase()) ?? [];
  const withinOneEdit = (candidate: string) => {
    if (candidate === requested) return true;
    if (Math.abs(candidate.length - requested.length) > 1) return false;
    let row = Array.from({ length: candidate.length + 1 }, (_, index) => index);
    for (let left = 1; left <= requested.length; left += 1) {
      const next = [left];
      for (let right = 1; right <= candidate.length; right += 1) {
        next[right] = Math.min(next[right - 1] + 1, row[right] + 1, row[right - 1] + (requested[left - 1] === candidate[right - 1] ? 0 : 1));
      }
      row = next;
    }
    const tolerance = requested.length >= 7 ? 2 : 1;
    return row[candidate.length] <= tolerance;
  };
  return identifiers.some(withinOneEdit) ? null : `La petición exige una función llamada ${requested}, pero el archivo generado no contiene ese identificador.`;
}

function usableTutorResponse(text: string): boolean {
  const trimmed = text.trim();
  const meaningfulCharacters = trimmed.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  return meaningfulCharacters >= 4 && !/(.)\1{15}/u.test(trimmed);
}

function verifiedFallbackResponse(executions: TutorToolExecution[]): string {
  const changedFiles = [...new Set(executions.flatMap((entry) => entry.changedFile ? [entry.changedFile] : []))];
  if (changedFiles.length > 0) {
    return `Actualicé ${changedFiles.join(', ')} con la edición que pediste. El cambio queda visible en el editor y puedes deshacerlo desde este panel. ¿Quieres que comprobemos juntos cómo funciona?`;
  }
  return 'Terminé de revisar la actividad, pero el modelo local no produjo una explicación legible. No modifiqué tu código; puedes reformular la pregunta o probar un modelo más capaz.';
}

async function generatePlan(
  input: TutorTurnInput,
  promptInput: Parameters<typeof buildTutorPlannerRequest>[0],
  service: LocalGenerationService,
  request: ReturnType<typeof buildTutorPlannerRequest>,
): Promise<TutorPlan> {
  const options = { model: input.generationOptions?.model, signal: input.generationOptions?.signal };
  const planning = await service.generate(request, options);
  try {
    return parsePlan(planning.text);
  } catch (reason) {
    const validationError = reason instanceof Error ? reason.message : 'El plan no cumple el contrato.';
    const repaired = await service.generate(buildTutorPlanRepairRequest(promptInput, planning.text, validationError), options);
    try {
      return parsePlan(repaired.text);
    } catch {
      throw new Error('El modelo local no pudo reparar el plan de herramientas. No se modificó ningún archivo; prueba otra vez o selecciona un modelo más capaz.');
    }
  }
}

export async function runTutorTurn(input: TutorTurnInput, service: LocalGenerationService, workspace: TutorWorkspaceContext | null): Promise<TutorTurnResult> {
  const promptInput = { ...input, workspace: workspace?.snapshot ?? null };
  const writeWasRequested = allowsTutorWrite(input.mode, input.question);
  const activePath = workspace?.snapshot.activeFilePath;
  const writeRecoveryPlan = (): TutorPlan | null => {
    if (!writeWasRequested || !activePath || !workspace || !(activePath in workspace.snapshot.files)) return null;
    return {
      calls: [{ tool: 'write_file', args: { path: activePath } }],
      replyStrategy: 'Explica brevemente la edición aplicada al archivo activo y qué debe comprobar la persona.',
    };
  };
  const generatePlanWithRecovery = async (request: ReturnType<typeof buildTutorPlannerRequest>): Promise<TutorPlan> => {
    try {
      return await generatePlan(input, promptInput, service, request);
    } catch (reason) {
      const recoveryPlan = writeRecoveryPlan();
      if (recoveryPlan) return recoveryPlan;
      throw reason;
    }
  };
  let plan = await generatePlanWithRecovery(buildTutorPlannerRequest(promptInput));
  const executions: TutorToolExecution[] = [];
  const execute = async (call: TutorToolCall) => {
    let executable = call;
    if (call.tool === 'write_file' && workspace) {
      const path = typeof call.args.path === 'string' ? call.args.path : '';
      const currentContent = workspace.snapshot.files[path];
      if (!path || currentContent === undefined) {
        executions.push(await executeTutorTool(call, input, workspace));
        return;
      }
      const priorObservations = executions.map((entry) => `[${entry.activity.status}] ${entry.activity.label}: ${entry.observation}`).join('\n\n');
      const generationOptions = { model: input.generationOptions?.model, signal: input.generationOptions?.signal };
      let generated = await service.generate(buildTutorFileEditRequest(promptInput, path, currentContent, priorObservations), generationOptions);
      let content = stripOuterCodeFence(generated.text);
      const validationError = editValidationError(input.question, content);
      if (validationError) {
        generated = await service.generate(buildTutorFileEditRequest(promptInput, path, currentContent, priorObservations, validationError), generationOptions);
        content = stripOuterCodeFence(generated.text);
        const repeatedError = editValidationError(input.question, content);
        if (repeatedError) throw new Error(`${repeatedError} No se modificó el archivo.`);
      }
      if (!content) throw new Error(`El modelo no produjo contenido aplicable para ${path}. No se modificó el archivo.`);
      if (content === currentContent.trim()) throw new Error(`El modelo no cambió ${path}. No se aplicó una escritura vacía.`);
      executable = { ...call, args: { path, content } };
    }
    executions.push(await executeTutorTool(executable, input, workspace));
  };
  for (const call of plan.calls.slice(0, 3)) await execute(call);
  let observations = executions.map((entry) => `[${entry.activity.status}] ${entry.activity.label}: ${entry.observation}`).join('\n\n');
  const changed = () => executions.some((entry) => Boolean(entry.changedFile));
  if (writeWasRequested && !changed()) {
    const remainingTools = Math.max(1, 4 - executions.length);
    plan = await generatePlanWithRecovery(buildTutorPlannerRequest(promptInput, {
      observations,
      requireWrite: true,
      remainingTools,
    }));
    if (!plan.calls.some((call) => call.tool === 'write_file')) {
      const recoveryPlan = writeRecoveryPlan();
      if (recoveryPlan) plan = recoveryPlan;
    }
    for (const call of plan.calls.slice(0, remainingTools)) await execute(call);
    observations = executions.map((entry) => `[${entry.activity.status}] ${entry.activity.label}: ${entry.observation}`).join('\n\n');
    if (!changed()) throw new Error('El modelo entendió la petición, pero no produjo una edición aplicable. Prueba el modelo recomendado o concreta qué archivo debe modificar.');
  }
  const response = await service.generate(buildTutorResponseRequest(promptInput, plan.replyStrategy, observations), input.generationOptions);
  return {
    response: usableTutorResponse(response.text) ? response.text : verifiedFallbackResponse(executions),
    activities: executions.map((entry) => entry.activity),
    changedFiles: [...new Set(executions.flatMap((entry) => entry.changedFile ? [entry.changedFile] : []))],
    reinforcement: executions.find((entry) => entry.reinforcement)?.reinforcement,
  };
}
