import type { LocalChatMessage } from '../../engine/ai/localGenerationProtocol';
import type { LocalGenerationOptions, LocalGenerationService } from '../../engine/ai/localGenerationService';
import { assessSpanishGeneration } from '../../engine/ai/localOutputQuality';
import { parseTutorHint } from './tutorHint';
import type { TutorActivityContext, TutorWorkspaceContext } from './tutorContext';
import { buildTutorFileEditRequest, buildTutorPlanRepairRequest, buildTutorPlannerRequest, buildTutorResponseRequest, tutorHintFilePaths, type TutorMode } from './tutorPrompt';
import { allowsTutorWrite, executeTutorTool, parseTutorToolCall, type TutorReinforcementDraft, type TutorToolActivity, type TutorToolCall, type TutorToolExecution } from './tutorTools';

export interface TutorTurnInput {
  mode: TutorMode;
  question: string;
  attemptCount: number;
  activity: TutorActivityContext;
  conversation: Array<Pick<LocalChatMessage, 'role' | 'content'>>;
  generationOptions?: Pick<LocalGenerationOptions, 'model' | 'signal' | 'onChunk'>;
  /** Host ownership can change before an async generation resolves. */
  isCurrent?: () => boolean;
  getCurrentWorkspace?: () => TutorWorkspaceContext | null;
}
export interface TutorTurnResult { response: string; activities: TutorToolActivity[]; changedFiles: string[]; reinforcement?: TutorReinforcementDraft; }
interface TutorPlan { calls: TutorToolCall[]; }

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
  if (!Array.isArray(candidate.calls) || candidate.calls.length > 3) throw new Error('El modelo no produjo un plan de herramientas válido.');
  const calls = candidate.calls.map(parseTutorToolCall);
  if (calls.some((call) => call === null)) throw new Error('El modelo no produjo un plan de herramientas válido.');
  return { calls: calls as TutorToolCall[] };
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

export function isTutorResponseUsable(text: string): boolean {
  const trimmed = text.trim();
  const meaningfulCharacters = trimmed.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  return meaningfulCharacters >= 4
    && !/(.)\1{15}/u.test(trimmed)
    && assessSpanishGeneration(trimmed)?.severity !== 'unsafe';
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
  if (options.signal?.aborted || input.isCurrent?.() === false) throw new DOMException('Se canceló la ayuda.', 'AbortError');
  let validationError = 'El plan se cortó antes de completarse.';
  if (planning.finishReason !== 'length') {
    try { return parsePlan(planning.text); } catch (reason) {
      validationError = reason instanceof Error ? reason.message : 'El plan no cumple el contrato.';
    }
  }
  const repaired = await service.generate(buildTutorPlanRepairRequest(promptInput, planning.text, validationError), options);
  if (options.signal?.aborted || input.isCurrent?.() === false) throw new DOMException('Se canceló la ayuda.', 'AbortError');
  try {
    if (repaired.finishReason === 'length') throw new Error('El plan reparado también quedó incompleto.');
    return parsePlan(repaired.text);
  } catch {
    throw new Error('El modelo local no pudo reparar el plan de herramientas. No se modificó ningún archivo; prueba otra vez o selecciona un modelo más capaz.');
  }
}

export async function runTutorTurn(input: TutorTurnInput, service: LocalGenerationService, workspace: TutorWorkspaceContext | null): Promise<TutorTurnResult> {
  // Keep the generation's input stable; tool bookkeeping must not mutate the
  // editor's published snapshot while React is preparing a new one.
  workspace = workspace ? { ...workspace, snapshot: { ...workspace.snapshot, files: { ...workspace.snapshot.files } } } : null;
  const assertActive = () => {
    if (input.generationOptions?.signal?.aborted || input.isCurrent?.() === false) throw new DOMException('Se canceló la ayuda.', 'AbortError');
  };
  assertActive();
  const promptInput = { ...input, workspace: workspace?.snapshot ?? null };
  const writeWasRequested = allowsTutorWrite(input.mode, input.question);
  const activePath = workspace?.snapshot.activeFilePath;
  const writeRecoveryPlan = (): TutorPlan | null => {
    if (!writeWasRequested || !activePath || !workspace || !(activePath in workspace.snapshot.files)) return null;
    return {
      calls: [{ tool: 'write_file', args: { path: activePath } }],
    };
  };
  const generatePlanWithRecovery = async (request: ReturnType<typeof buildTutorPlannerRequest>): Promise<TutorPlan> => {
    try {
      return await generatePlan(input, promptInput, service, request);
    } catch (reason) {
      assertActive();
      const recoveryPlan = writeRecoveryPlan();
      if (recoveryPlan) return recoveryPlan;
      throw reason;
    }
  };
  // A hint only needs the current evidence; it must not plan edits or execute
  // the student's program merely to decide where to direct their attention.
  let plan: TutorPlan = input.mode === 'hint'
    ? { calls: workspace ? [{ tool: 'read_workspace', args: { paths: tutorHintFilePaths(workspace.snapshot) } }, { tool: 'read_diagnostics', args: {} }] : [{ tool: 'read_lesson', args: {} }] }
    : await generatePlanWithRecovery(buildTutorPlannerRequest(promptInput));
  assertActive();
  const executions: TutorToolExecution[] = [];
  const execute = async (call: TutorToolCall) => {
    assertActive();
    let executable = call;
    if (call.tool === 'write_file' && workspace) {
      if (!writeWasRequested) {
        executions.push(await executeTutorTool(call, input, workspace));
        return;
      }
      const path = typeof call.args.path === 'string' ? call.args.path : '';
      const currentContent = workspace.snapshot.files[path];
      if (!path || currentContent === undefined) {
        executions.push(await executeTutorTool(call, input, workspace));
        return;
      }
      const priorObservations = executions.map((entry) => `[${entry.activity.status}] ${entry.activity.label}: ${entry.observation}`).join('\n\n');
      const generationOptions = { model: input.generationOptions?.model, signal: input.generationOptions?.signal };
      let generated = await service.generate(buildTutorFileEditRequest(promptInput, path, currentContent, priorObservations), generationOptions);
      assertActive();
      if (generated.finishReason === 'length') throw new Error(`El archivo generado para ${path} se cortó por el límite de salida. No se modificó el archivo; concreta el cambio o usa un modelo más capaz.`);
      let content = stripOuterCodeFence(generated.text);
      const validationError = editValidationError(input.question, content);
      if (validationError) {
        generated = await service.generate(buildTutorFileEditRequest(promptInput, path, currentContent, priorObservations, validationError), generationOptions);
        assertActive();
        if (generated.finishReason === 'length') throw new Error(`El archivo corregido para ${path} se cortó por el límite de salida. No se modificó el archivo; concreta el cambio o usa un modelo más capaz.`);
        content = stripOuterCodeFence(generated.text);
        const repeatedError = editValidationError(input.question, content);
        if (repeatedError) throw new Error(`${repeatedError} No se modificó el archivo.`);
      }
      if (!content) throw new Error(`El modelo no produjo contenido aplicable para ${path}. No se modificó el archivo.`);
      if (content === currentContent.trim()) throw new Error(`El modelo no cambió ${path}. No se aplicó una escritura vacía.`);
      if (input.getCurrentWorkspace) {
        const live = input.getCurrentWorkspace();
        if (!live || live.snapshot.lessonId !== workspace.snapshot.lessonId
          || Object.keys(live.snapshot.files).length !== Object.keys(workspace.snapshot.files).length
          || Object.entries(workspace.snapshot.files).some(([file, text]) => live.snapshot.files[file] !== text)) {
          throw new Error('El editor cambió mientras preparaba la ayuda. Conservé tu versión nueva; vuelve a pedir el cambio desde ese código.');
        }
      }
      executable = { ...call, args: { path, content } };
    }
    assertActive();
    executions.push(await executeTutorTool(executable, input, workspace));
    assertActive();
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
  let responseText: string;
  try {
    const responseOptions = { model: input.generationOptions?.model, signal: input.generationOptions?.signal };
    // File excerpts already have their own bounded section in a hint prompt.
    // Keep diagnostics separate so duplicated HTML cannot hide the test result.
    const responseObservations = executions
      .filter(entry => entry.activity.tool !== 'read_workspace')
      .map(entry => entry.observation).join('\n\n');
    const responseEvidencePaths = executions.flatMap(entry => entry.readFiles ?? []);
    let response = await service.generate(buildTutorResponseRequest(promptInput, responseObservations, '', responseEvidencePaths), responseOptions);
    assertActive();
    if (input.mode !== 'hint' && response.finishReason === 'length') {
      response = await service.generate(buildTutorResponseRequest(promptInput, responseObservations,
        'La respuesta anterior se cortó por el límite de tokens. Redáctala de nuevo en un máximo de 70 palabras; no continúes el fragmento anterior.', responseEvidencePaths), responseOptions);
      assertActive();
      if (response.finishReason === 'length') throw new Error('No pude preparar una explicación completa. Prueba con una pregunta más concreta.');
    }
    responseText = response.text;
    if (input.mode === 'hint') {
      assertActive();
      const knownMarkupReferences = new Set(workspace ? tutorHintFilePaths(workspace.snapshot)
        .flatMap(path => workspace.snapshot.files[path].slice(0, 12_000).match(/<[a-z][a-z\d-]*>/g) ?? []) : []);
      try { responseText = parseTutorHint(responseText, knownMarkupReferences, input.question); } catch (reason) {
        const feedback = reason instanceof Error ? reason.message : 'La pista no cumple el formato.';
        const repaired = await service.generate(buildTutorResponseRequest(promptInput, responseObservations, feedback, responseEvidencePaths), responseOptions);
        assertActive();
        try { responseText = parseTutorHint(repaired.text, knownMarkupReferences, input.question); } catch (reason) {
          throw new Error('No pude preparar una pista fiable. No modifiqué tu código; puedes usar las pistas de la actividad o volver a intentarlo.');
        }
      }
    }
  } catch (reason) {
    assertActive();
    if (!changed()) throw reason;
    responseText = verifiedFallbackResponse(executions);
  }
  assertActive();
  const finalResponse = isTutorResponseUsable(responseText) ? responseText : verifiedFallbackResponse(executions);
  if (input.mode !== 'hint') input.generationOptions?.onChunk?.(finalResponse);
  return {
    response: finalResponse,
    activities: executions.map((entry) => entry.activity),
    changedFiles: [...new Set(executions.flatMap((entry) => entry.changedFile ? [entry.changedFile] : []))],
    reinforcement: executions.find((entry) => entry.reinforcement)?.reinforcement,
  };
}
