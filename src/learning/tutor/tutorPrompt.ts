import type { LocalChatMessage, LocalGenerationRequest } from '../../engine/ai/localGenerationProtocol';
import type { TutorActivityContext, TutorWorkspaceSnapshot } from './tutorContext';

export type TutorMode = 'auto' | 'explain' | 'hint' | 'review' | 'collaborate';

export interface TutorPromptInput {
  mode: TutorMode;
  question: string;
  attemptCount: number;
  activity: TutorActivityContext;
  workspace: TutorWorkspaceSnapshot | null;
  conversation: Array<Pick<LocalChatMessage, 'role' | 'content'>>;
}

const MODE_GUIDANCE: Record<TutorMode, string> = {
  auto: 'Decide el tipo de apoyo según la petición. No escribas si la persona solo busca comprender.',
  explain: 'Explica el concepto con el material de la lección y el código como ejemplo. No modifiques archivos.',
  hint: 'Da una pista graduada sobre dónde mirar. No modifiques archivos ni entregues la solución.',
  review: 'Lee requisitos, archivos y resultados antes de dar feedback concreto. No modifiques archivos.',
  collaborate: 'Puedes proponer y aplicar cambios pedidos, explicando cada decisión y comprobando el resultado.',
};

function cleanList(values?: string[]): string {
  return values?.filter(Boolean).join(', ') || 'No se declararon.';
}

export function truncateTutorText(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}\n… [contenido recortado para el modelo local]`;
}

export function activityContextText(activity: TutorActivityContext, attemptCount: number): string {
  return `Actividad: ${activity.itemTitle} (${activity.itemType})
Curso: ${activity.courseTitle}
Propósito: ${activity.description || 'No especificado.'}
Modelo mental: ${activity.mentalModel || 'No especificado.'}
Conocimientos previos: ${cleanList(activity.skillsRequired)}
Conceptos nuevos: ${cleanList(activity.skillsIntroduced)}
Errores frecuentes: ${cleanList(activity.commonMistakes)}
${activity.recentResult ? `Resultado reciente: ${activity.recentResult}\n` : ''}Intentos observados: ${attemptCount}`;
}

export function buildTutorPlannerRequest(input: TutorPromptInput, options: { observations?: string; requireWrite?: boolean; remainingTools?: number } = {}): LocalGenerationRequest {
  const workspaceSummary = input.workspace
    ? `Archivo activo: ${input.workspace.activeFilePath}. Archivos: ${Object.keys(input.workspace.files).join(', ')}. Diagnóstico: ${input.workspace.diagnostics || 'no disponible'}. Comprobación: ${input.workspace.recentResult || 'no ejecutada'}.`
    : 'No hay un editor activo.';
  const tools = `Herramientas permitidas:
- read_lesson args {}
- read_workspace args {"paths":["ruta"]}; omite paths para leer todos
- read_diagnostics args {}
- run_checks args {}
- write_file args {"path":"ruta existente","content":"contenido completo"}
- save_reinforcement args {"skillId":"concepto curricular","note":"nota breve","evidence":"evidencia observada"}`;
  const continuation = options.observations
    ? `\nResultados de herramientas anteriores:\n${truncateTutorText(options.observations, 10_000)}`
    : '';
  const writeInstruction = options.requireWrite
    ? 'La persona pidió modificar el ejercicio y ya autorizó la escritura. Usa write_file con el contenido completo de un archivo existente; si todavía necesitas conocerlo, usa read_workspace. No termines con calls vacío antes de aplicar el cambio solicitado.'
    : 'Cuando la petición sea una edición, consulta primero el workspace. Después de recibir ese resultado podrás elegir write_file en el siguiente paso.';
  return {
    messages: [
      { role: 'system', content: `Eres el planificador de herramientas de un tutor local para principiantes. Elige solo las llamadas que se pueden ejecutar con la evidencia disponible. No inventes herramientas ni argumentos. El modo y la pregunta limitan tu actuación. ${MODE_GUIDANCE[input.mode]} ${writeInstruction} Puedes usar como máximo ${options.remainingTools ?? 3} herramientas en este paso. Devuelve únicamente JSON con las claves calls y replyStrategy. calls es un array de objetos {tool,args}; replyStrategy es una instrucción breve para el tutor final.` },
      { role: 'user', content: truncateTutorText(`${activityContextText(input.activity, input.attemptCount)}\n${workspaceSummary}\nModo: ${input.mode}\n${tools}\nPregunta: ${input.question.trim()}${continuation}`, 13_000) },
    ],
    temperature: 0.05,
    topP: 0.8,
    maxNewTokens: 220,
    expectedFormat: 'json_object',
    expectedJsonKeys: ['calls', 'replyStrategy'],
  };
}

export function buildTutorResponseRequest(input: TutorPromptInput, replyStrategy: string, observations: string): LocalGenerationRequest {
  const previous = input.conversation.slice(-6).map((message) => ({ ...message, content: truncateTutorText(message.content, 800) }));
  return {
    messages: [
      { role: 'system', content: `Eres el tutor socrático local de una plataforma para aprender programación desde cero. Responde en español claro y natural. Usa solo las observaciones de herramientas. No inventes resultados. Explica cualquier cambio aplicado y termina con una pregunta breve que compruebe comprensión. No entregues una solución completa en modo pista. Estrategia: ${truncateTutorText(replyStrategy, 600)}` },
      ...previous,
      { role: 'user', content: truncateTutorText(`${activityContextText(input.activity, input.attemptCount)}\nModo: ${input.mode}\nPregunta: ${input.question.trim()}\n\nObservaciones verificadas:\n${observations || 'El agente no necesitó consultar herramientas.'}`, 7_500) },
    ],
    temperature: 0.25,
    topP: 0.9,
    maxNewTokens: 240,
  };
}

/** Compatibilidad con consumidores anteriores que no ejecutan herramientas. */
export function buildSocraticTutorRequest(input: Omit<TutorPromptInput, 'workspace'> & { code?: TutorWorkspaceSnapshot | null; workspace?: TutorWorkspaceSnapshot | null }): LocalGenerationRequest {
  return buildTutorResponseRequest({ ...input, workspace: input.workspace ?? input.code ?? null }, MODE_GUIDANCE[input.mode], 'No se ejecutaron herramientas en este turno.');
}
