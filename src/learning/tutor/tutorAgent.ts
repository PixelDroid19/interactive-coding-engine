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
  let plan = await generatePlan(input, promptInput, service, buildTutorPlannerRequest(promptInput));
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
      const generated = await service.generate(
        buildTutorFileEditRequest(promptInput, path, currentContent, priorObservations),
        { model: input.generationOptions?.model, signal: input.generationOptions?.signal },
      );
      const content = stripOuterCodeFence(generated.text);
      if (!content) throw new Error(`El modelo no produjo contenido aplicable para ${path}. No se modificó el archivo.`);
      if (content === currentContent.trim()) throw new Error(`El modelo no cambió ${path}. No se aplicó una escritura vacía.`);
      executable = { ...call, args: { path, content } };
    }
    executions.push(await executeTutorTool(executable, input, workspace));
  };
  for (const call of plan.calls.slice(0, 3)) await execute(call);
  let observations = executions.map((entry) => `[${entry.activity.status}] ${entry.activity.label}: ${entry.observation}`).join('\n\n');
  const writeWasRequested = allowsTutorWrite(input.mode, input.question);
  const changed = () => executions.some((entry) => Boolean(entry.changedFile));
  if (writeWasRequested && !changed() && executions.length < 3) {
    plan = await generatePlan(input, promptInput, service, buildTutorPlannerRequest(promptInput, {
      observations,
      requireWrite: true,
      remainingTools: 3 - executions.length,
    }));
    for (const call of plan.calls.slice(0, 3 - executions.length)) await execute(call);
    observations = executions.map((entry) => `[${entry.activity.status}] ${entry.activity.label}: ${entry.observation}`).join('\n\n');
    if (!changed()) throw new Error('El modelo entendió la petición, pero no produjo una edición aplicable. Prueba el modelo recomendado o concreta qué archivo debe modificar.');
  }
  const response = await service.generate(buildTutorResponseRequest(promptInput, plan.replyStrategy, observations), input.generationOptions);
  return {
    response: response.text,
    activities: executions.map((entry) => entry.activity),
    changedFiles: [...new Set(executions.flatMap((entry) => entry.changedFile ? [entry.changedFile] : []))],
    reinforcement: executions.find((entry) => entry.reinforcement)?.reinforcement,
  };
}
