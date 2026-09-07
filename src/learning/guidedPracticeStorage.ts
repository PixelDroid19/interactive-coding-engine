import { GUIDED_TOPICS, createGuidedDraft, type GuidedDraft } from './guidedPractice';

export function guidedStorageKey(scope: string, courseSlug: string): string {
  return `aula_guided_v1:${encodeURIComponent(scope)}:${encodeURIComponent(courseSlug)}`;
}

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;
const count = (value: unknown, max = Number.MAX_SAFE_INTEGER) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
const topic = (value: unknown) => GUIDED_TOPICS.some(entry => entry.id === value);

function parse(value: unknown): GuidedDraft | null {
  if (!record(value) || value.version !== 1 || !topic(value.topicId) || !count(value.round)
    || !['predict', 'modify', 'explain', 'done'].includes(String(value.stage))
    || !text(value.code, 6000) || !text(value.prediction, 160) || !text(value.explanation, 2000)
    || !count(value.codeAttempts) || !count(value.hintCount, 2)
    || typeof value.traceIndex !== 'number' || !Number.isInteger(value.traceIndex) || value.traceIndex < -1 || value.traceIndex > 6
    || typeof value.usedHelp !== 'boolean' || typeof value.showReference !== 'boolean'
    || !Array.isArray(value.history) || value.history.length > 60) return null;
  if (value.predictionResult !== null && (!record(value.predictionResult)
    || !text(value.predictionResult.actual, 300) || typeof value.predictionResult.correct !== 'boolean')) return null;
  if (!value.history.every(entry => record(entry) && topic(entry.topicId) && text(entry.id, 80)
    && count(entry.round) && count(entry.completedAt) && count(entry.dueAt) && entry.dueAt >= entry.completedAt
    && count(entry.codeAttempts) && typeof entry.predictionCorrect === 'boolean' && typeof entry.usedHelp === 'boolean'
    && ['again', 'supported', 'independent'].includes(String(entry.confidence)))) return null;
  const draft = value as unknown as GuidedDraft;
  return { ...draft, checks: null, stage: draft.stage === 'explain' ? 'modify' : draft.stage };
}

export function loadGuidedDraft(key: string): { draft: GuidedDraft; writable: boolean; notice: string } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { draft: createGuidedDraft(), writable: true, notice: '' };
    const parsed = raw.length <= 65000 ? parse(JSON.parse(raw)) : null;
    if (!parsed) throw new Error('Invalid draft');
    return { draft: parsed, writable: true, notice: parsed.stage === 'modify' ? 'Retomamos tu código. Compruébalo de nuevo antes de continuar.' : '' };
  } catch {
    return { draft: createGuidedDraft(), writable: false, notice: 'No pudimos recuperar el guardado. No lo reemplazaremos. Puedes practicar, pero esta sesión no se conservará al salir.' };
  }
}

export function saveGuidedDraft(key: string, draft: GuidedDraft): boolean {
  try {
    if (!loadGuidedDraft(key).writable || !parse(draft)) return false;
    localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch { return false; }
}
