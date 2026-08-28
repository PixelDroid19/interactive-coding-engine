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
- write_file args {"path":"ruta existente"}; el contenido se genera después, fuera del JSON
- save_reinforcement args {"skillId":"concepto curricular","note":"nota breve","evidence":"evidencia observada"}`;
  const continuation = options.observations
    ? `\nResultados de herramientas anteriores:\n${truncateTutorText(options.observations, 10_000)}`
    : '';
  const writeInstruction = options.requireWrite
    ? 'La persona pidió modificar el ejercicio y ya autorizó la escritura. Usa write_file indicando solo la ruta de un archivo existente; el sistema generará el contenido en un paso separado. Si todavía necesitas conocerlo, usa read_workspace. No termines con calls vacío antes de aplicar el cambio solicitado.'
    : 'Cuando la petición sea una edición, consulta primero el workspace. Después de recibir ese resultado podrás elegir write_file en el siguiente paso.';
  const workspacePaths = Object.keys(input.workspace?.files ?? {});
  const pathSchema = workspacePaths.length > 0 ? { type: 'string', enum: workspacePaths } : { type: 'string', minLength: 1, maxLength: 240 };
  const planSchema = {
    type: 'object',
    properties: {
      calls: {
        type: 'array',
        maxItems: Math.min(3, options.remainingTools ?? 3),
        items: {
          type: 'object',
          properties: {
            tool: { type: 'string', enum: ['read_lesson', 'read_workspace', 'read_diagnostics', 'run_checks', 'write_file', 'save_reinforcement'] },
            args: {
              type: 'object',
              properties: {
                paths: { type: 'array', maxItems: 12, items: pathSchema },
                path: pathSchema,
                skillId: { type: 'string', maxLength: 120 },
                note: { type: 'string', maxLength: 240 },
                evidence: { type: 'string', maxLength: 320 },
              },
              additionalProperties: false,
            },
          },
          required: ['tool', 'args'],
          additionalProperties: false,
        },
      },
      replyStrategy: { type: 'string', maxLength: 240 },
    },
    required: ['calls', 'replyStrategy'],
    additionalProperties: false,
  };
  return {
    messages: [
      { role: 'system', content: `Eres el planificador de herramientas de una ayuda local para principiantes. Elige solo las llamadas que se pueden ejecutar con la evidencia disponible. No inventes herramientas ni argumentos. El modo y la pregunta limitan tu actuación. ${MODE_GUIDANCE[input.mode]} ${writeInstruction} Puedes usar como máximo ${options.remainingTools ?? 3} herramientas en este paso. Devuelve únicamente JSON con las claves calls y replyStrategy. calls es un array de objetos {tool,args}; replyStrategy es una instrucción breve para la respuesta final.` },
      { role: 'user', content: truncateTutorText(`${activityContextText(input.activity, input.attemptCount)}\n${workspaceSummary}\nModo: ${input.mode}\n${tools}\nPregunta: ${input.question.trim()}${continuation}`, 13_000) },
    ],
    temperature: 0.05,
    topP: 0.8,
    maxNewTokens: 220,
    expectedFormat: 'json_object',
    expectedJsonKeys: ['calls', 'replyStrategy'],
    expectedJsonSchema: planSchema,
    allowInvalidStructuredOutput: true,
  };
}

export function buildTutorPlanRepairRequest(input: TutorPromptInput, invalidOutput: string, validationError: string): LocalGenerationRequest {
  const contract = buildTutorPlannerRequest(input);
  return {
    messages: [
      { role: 'system', content: 'Repara un plan de herramientas mal formado. Devuelve solo un objeto JSON válido con exactamente las claves calls y replyStrategy. calls contiene como máximo 3 objetos {"tool":"nombre","args":{...}}. Para write_file, args contiene únicamente path. No añadas Markdown, comentarios ni texto fuera del JSON.' },
      { role: 'user', content: truncateTutorText(`${activityContextText(input.activity, input.attemptCount)}\nPregunta: ${input.question.trim()}\nError de validación: ${validationError}\nSalida inválida:\n${invalidOutput}`, 7_000) },
    ],
    temperature: 0,
    topP: 0.7,
    maxNewTokens: 220,
    expectedFormat: 'json_object',
    expectedJsonKeys: ['calls', 'replyStrategy'],
    expectedJsonSchema: contract.expectedJsonSchema,
    allowInvalidStructuredOutput: true,
  };
}

export function buildTutorFileEditRequest(input: TutorPromptInput, path: string, currentContent: string, observations: string, validationFeedback = ''): LocalGenerationRequest {
  const correction = validationFeedback
    ? `\nLa propuesta anterior fue rechazada: ${validationFeedback}\nCorrígela; no repitas una salida que ignore la petición.`
    : '';
  return {
    messages: [
      { role: 'system', content: `Eres el editor de código, no el instructor de la lección. Edita ${path} obedeciendo literalmente el REQUISITO PRINCIPAL del último renglón. El contexto pedagógico solo sirve para comprender el nivel; nunca sustituye la petición. Devuelve solo el contenido completo actualizado del archivo, sin cercas Markdown, sin explicación y sin JSON. Conserva lo que ya funciona cuando sea compatible. No inventes otros archivos ni dependencias.` },
      { role: 'user', content: truncateTutorText(`${activityContextText(input.activity, input.attemptCount)}\nObservaciones verificadas:\n${observations || 'Sin observaciones previas.'}\n\nContenido actual de ${path}:\n${currentContent}${correction}\n\nREQUISITO PRINCIPAL: ${input.question.trim()}`, 13_000) },
    ],
    temperature: 0.08,
    topP: 0.8,
    maxNewTokens: 1_200,
  };
}

export function buildTutorResponseRequest(input: TutorPromptInput, replyStrategy: string, observations: string): LocalGenerationRequest {
  const previous = input.conversation.slice(-6).map((message) => ({ ...message, content: truncateTutorText(message.content, 800) }));
  return {
    messages: [
      { role: 'system', content: `Eres la ayuda local de una plataforma para aprender programación desde cero. Responde en español claro y natural. Usa solo las observaciones de herramientas. No inventes resultados. Explica cualquier cambio aplicado y termina con una pregunta breve que compruebe comprensión. No entregues una solución completa en modo pista. Estrategia: ${truncateTutorText(replyStrategy, 600)}` },
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
