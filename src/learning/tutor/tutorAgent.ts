import type { LocalChatMessage } from '../../engine/ai/localGenerationProtocol';
import type { LocalGenerationOptions, LocalGenerationService } from '../../engine/ai/localGenerationService';
import type { TutorActivityContext, TutorWorkspaceContext } from './tutorContext';
import { buildTutorPlannerRequest, buildTutorResponseRequest, type TutorMode } from './tutorPrompt';
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

function parsePlan(text: string): TutorPlan {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('El modelo no produjo un plan de herramientas válido. Inténtalo de nuevo o cambia de modelo local.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('El modelo no produjo un plan de herramientas válido.');
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.calls) || candidate.calls.length > 3 || typeof candidate.replyStrategy !== 'string') throw new Error('El modelo no produjo un plan de herramientas válido.');
  const calls = candidate.calls.map(parseTutorToolCall);
  if (calls.some((call) => call === null)) throw new Error('El modelo no produjo un plan de herramientas válido.');
  return { calls: calls as TutorToolCall[], replyStrategy: candidate.replyStrategy.trim() };
}

export async function runTutorTurn(input: TutorTurnInput, service: LocalGenerationService, workspace: TutorWorkspaceContext | null): Promise<TutorTurnResult> {
  const promptInput = { ...input, workspace: workspace?.snapshot ?? null };
  const planning = await service.generate(buildTutorPlannerRequest(promptInput), { model: input.generationOptions?.model, signal: input.generationOptions?.signal });
  let plan = parsePlan(planning.text);
  const executions: TutorToolExecution[] = [];
  for (const call of plan.calls.slice(0, 3)) executions.push(await executeTutorTool(call, input, workspace));
  let observations = executions.map((entry) => `[${entry.activity.status}] ${entry.activity.label}: ${entry.observation}`).join('\n\n');
  const writeWasRequested = allowsTutorWrite(input.mode, input.question);
  const changed = () => executions.some((entry) => Boolean(entry.changedFile));
  if (writeWasRequested && !changed() && executions.length < 3) {
    const continuation = await service.generate(buildTutorPlannerRequest(promptInput, {
      observations,
      requireWrite: true,
      remainingTools: 3 - executions.length,
    }), { model: input.generationOptions?.model, signal: input.generationOptions?.signal });
    plan = parsePlan(continuation.text);
    for (const call of plan.calls.slice(0, 3 - executions.length)) executions.push(await executeTutorTool(call, input, workspace));
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
