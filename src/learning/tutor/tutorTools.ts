import type { TutorActivityContext, TutorWorkspaceContext } from './tutorContext';
import { truncateTutorText, type TutorMode } from './tutorPrompt';

export type TutorToolName = 'read_lesson' | 'read_workspace' | 'read_diagnostics' | 'run_checks' | 'write_file' | 'save_reinforcement';
export type TutorToolStatus = 'completed' | 'denied' | 'unavailable' | 'failed';

export interface TutorToolCall { tool: TutorToolName; args: Record<string, unknown>; }
export interface TutorToolActivity { tool: TutorToolName; label: string; status: TutorToolStatus; detail: string; }
export interface TutorReinforcementDraft { skillId: string; note: string; evidence: string; }
export interface TutorToolExecution { activity: TutorToolActivity; observation: string; changedFile?: string; reinforcement?: TutorReinforcementDraft; }

const TOOL_NAMES = new Set<TutorToolName>(['read_lesson', 'read_workspace', 'read_diagnostics', 'run_checks', 'write_file', 'save_reinforcement']);
const WRITE_INTENT = /\b(corrige|corregir|arregla|arreglar|modifica|modificar|cambia|cambiar|implementa|implementar|completa|completar|escribe|escribir|crea|crear|genera|generar|a[nñ]ade|a[nñ]adir|agrega|agregar|inserta|insertar|reemplaza|reemplazar|pon|apl[ií]calo|hazlo)\b/i;

export function parseTutorToolCall(value: unknown): TutorToolCall | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.tool !== 'string' || !TOOL_NAMES.has(candidate.tool as TutorToolName)) return null;
  if (!candidate.args || typeof candidate.args !== 'object' || Array.isArray(candidate.args)) return null;
  return { tool: candidate.tool as TutorToolName, args: candidate.args as Record<string, unknown> };
}

export function allowsTutorWrite(mode: TutorMode, question: string): boolean {
  return mode === 'collaborate' || (mode === 'auto' && WRITE_INTENT.test(question));
}

function strings(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : null;
}

function activity(tool: TutorToolName, label: string, status: TutorToolStatus, detail: string): TutorToolActivity {
  return { tool, label, status, detail };
}

export async function executeTutorTool(call: TutorToolCall, input: { mode: TutorMode; question: string; attemptCount: number; activity: TutorActivityContext }, workspace: TutorWorkspaceContext | null): Promise<TutorToolExecution> {
  if (call.tool === 'read_lesson') {
    const lesson = input.activity;
    const observation = `Objetivo: ${lesson.description || 'No especificado.'}\nModelo mental: ${lesson.mentalModel || 'No especificado.'}\nConceptos: ${(lesson.skillsIntroduced ?? []).join(', ') || 'No declarados.'}\nErrores frecuentes: ${(lesson.commonMistakes ?? []).join(' | ') || 'No declarados.'}`;
    return { activity: activity(call.tool, 'Leyó la lección', 'completed', lesson.itemTitle), observation };
  }
  if (!workspace) return { activity: activity(call.tool, 'Buscó el ejercicio', 'unavailable', 'No hay un editor activo.'), observation: 'La herramienta no está disponible porque no hay un editor activo.' };
  if (call.tool === 'read_workspace') {
    const requested = call.args.paths === undefined ? Object.keys(workspace.snapshot.files) : strings(call.args.paths);
    if (!requested) return { activity: activity(call.tool, 'Revisó los archivos', 'failed', 'La lista de rutas no es válida.'), observation: 'read_workspace recibió rutas inválidas.' };
    const existing = requested.filter((path) => path in workspace.snapshot.files);
    const observation = existing.map((path) => `--- ${path}\n${workspace.snapshot.files[path]}`).join('\n');
    return { activity: activity(call.tool, 'Revisó los archivos', 'completed', `${existing.length} ${existing.length === 1 ? 'archivo' : 'archivos'}`), observation: truncateTutorText(observation || 'Ninguna ruta solicitada existe en el ejercicio.', 12_000) };
  }
  if (call.tool === 'read_diagnostics') {
    const detail = `${workspace.snapshot.diagnostics || 'Sin diagnóstico disponible'}. ${workspace.snapshot.recentResult || 'Sin comprobación reciente.'}`;
    return { activity: activity(call.tool, 'Consultó los diagnósticos', 'completed', detail), observation: detail };
  }
  if (call.tool === 'run_checks') {
    if (!workspace.actions.runChecks) return { activity: activity(call.tool, 'Intentó comprobar el ejercicio', 'unavailable', 'Esta actividad no publica comprobaciones.'), observation: 'No hay una comprobación ejecutable en esta actividad.' };
    try {
      const result = await workspace.actions.runChecks();
      workspace.snapshot.recentResult = result;
      return { activity: activity(call.tool, 'Ejecutó las comprobaciones', 'completed', result), observation: `Resultado de comprobaciones: ${result}` };
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : 'La comprobación falló.';
      return { activity: activity(call.tool, 'Ejecutó las comprobaciones', 'failed', detail), observation: `La comprobación produjo un error: ${detail}` };
    }
  }
  if (call.tool === 'write_file') {
    if (!allowsTutorWrite(input.mode, input.question)) return { activity: activity(call.tool, 'Solicitó modificar el ejercicio', 'denied', 'La pregunta no autorizó cambios.'), observation: 'La escritura fue rechazada porque la persona pidió explicación o feedback, no una modificación.' };
    const path = typeof call.args.path === 'string' ? call.args.path : '';
    const content = typeof call.args.content === 'string' ? call.args.content : null;
    if (!path || content === null || !(path in workspace.snapshot.files)) return { activity: activity(call.tool, 'Intentó modificar un archivo', 'failed', 'La ruta debe ser un archivo existente.'), observation: 'La escritura no se aplicó: ruta o contenido inválidos.' };
    workspace.actions.replaceFile(path, content);
    workspace.snapshot.files[path] = content;
    return { activity: activity(call.tool, `Modificó ${path}`, 'completed', 'Puedes deshacer este cambio.'), observation: `Se sustituyó el contenido completo de ${path}.`, changedFile: path };
  }
  const skillId = typeof call.args.skillId === 'string' ? call.args.skillId.trim() : '';
  const note = typeof call.args.note === 'string' ? call.args.note.trim() : '';
  const evidence = typeof call.args.evidence === 'string' ? call.args.evidence.trim() : '';
  const knownSkill = input.activity.skillsIntroduced?.includes(skillId) || input.activity.skillsRequired?.includes(skillId);
  const repeated = input.attemptCount >= 2 || /(?:0 de|fall|error)/i.test(workspace.snapshot.recentResult ?? '');
  if (!skillId || !note || !evidence || !knownSkill || !repeated) return { activity: activity(call.tool, 'Evaluó un concepto para reforzar', 'denied', 'Falta evidencia reiterada o el concepto no pertenece a la lección.'), observation: 'No se guardó refuerzo: se requiere un concepto curricular y evidencia reiterada.' };
  const reinforcement = { skillId, note: truncateTutorText(note, 240), evidence: truncateTutorText(evidence, 320) };
  return { activity: activity(call.tool, 'Guardó un concepto para reforzar', 'completed', skillId.replace(/-/g, ' ')), observation: `Refuerzo registrado para ${skillId}: ${reinforcement.note}`, reinforcement };
}
