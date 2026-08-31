import type { ReviewRating } from '../learning/types';
import { learningApiRequest, readApiJson } from './learningHttp';

const LEGACY_CACHE_PREFIX = 'aula_learning_center_cache_v1:';
const CACHE_PREFIX = 'aula_learning_center_cache_v2:';
const CACHE_TTL_MS = 5 * 60_000;

export interface RemoteReviewCard {
  id: string;
  itemKey: string;
  skillKey: string;
  prompt: string;
  intervalIndex: number;
  dueAt: string;
  lastReviewedAt: string | null;
  repetitions: number;
}

export interface RemoteNotebookEntry {
  id: string;
  title: string;
  body: string;
  itemKey: string | null;
  updatedAt: string;
}

interface LegacyRemoteNotebookEntry {
  id: string;
  skillKey?: string;
  concept?: string;
  mentalModel?: string;
  pattern?: string;
  ownExample?: string;
  personalMistake?: string;
  title?: string;
  body?: string;
  itemKey?: string | null;
  updatedAt: string;
}

export interface RemoteReinforcement {
  id: string;
  itemKey: string;
  skillKey: string;
  note: string;
  evidence: string;
  occurrences: number;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningCenterSnapshot {
  courseSlug: string;
  generatedAt: string;
  summary: {
    dueReviews: number;
    reinforcements: number;
    notes: number;
    averageMastery: number | null;
    activeSkills: number;
  };
  reviews: RemoteReviewCard[];
  notes: RemoteNotebookEntry[];
  reinforcements: RemoteReinforcement[];
  skillGaps: Array<{
    skillKey: string;
    capability: string;
    score: number;
    attempts: number;
    successes: number;
    lastResult: string;
    lastPracticedAt: string;
  }>;
  recentItems: Array<{
    itemKey: string;
    opens: number;
    completions: number;
    exits: number;
    activeMs: number;
    playbackMs: number;
    lastOpenedAt: string | null;
    lastCompletedAt: string | null;
    lastInteractedAt: string;
  }>;
}

type CachedSnapshot = Readonly<{
  cachedAt: number;
  snapshot: LearningCenterSnapshot;
}>;

function requiredIdentifier(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Falta ${label} para sincronizar tu aprendizaje.`);
  return value.trim();
}

function cacheKey(userId: string, courseSlug: string): string {
  return `${CACHE_PREFIX}${encodeURIComponent(userId)}:${encodeURIComponent(courseSlug)}`;
}

function normalizeNotebookEntry(entry: LegacyRemoteNotebookEntry): RemoteNotebookEntry {
  const legacySections = [
    entry.mentalModel?.trim() ? `Modelo mental\n${entry.mentalModel.trim()}` : '',
    entry.pattern?.trim() ? `Patrón para recordar\n${entry.pattern.trim()}` : '',
    entry.ownExample?.trim() ? `Ejemplo propio\n${entry.ownExample.trim()}` : '',
    entry.personalMistake?.trim() ? `Error que cometí\n${entry.personalMistake.trim()}` : '',
  ].filter(Boolean);
  return {
    id: entry.id,
    title: entry.title?.trim() || entry.concept?.trim() || 'Nota importada',
    body: entry.body?.trim() || legacySections.join('\n\n') || entry.concept?.trim() || '',
    itemKey: entry.itemKey?.trim() || null,
    updatedAt: entry.updatedAt,
  };
}

function normalizeSnapshot(snapshot: LearningCenterSnapshot): LearningCenterSnapshot {
  return {
    ...snapshot,
    notes: (snapshot.notes as unknown as LegacyRemoteNotebookEntry[]).map(normalizeNotebookEntry),
  };
}

export function purgeLegacyLearningCenterCache(): void {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(LEGACY_CACHE_PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // Storage puede no estar disponible; nunca usamos la caché antigua como alternativa.
  }
}

function readCache(userId: string, courseSlug: string): CachedSnapshot | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(userId, courseSlug)) ?? 'null') as CachedSnapshot | null;
    if (!parsed?.snapshot || parsed.snapshot.courseSlug !== courseSlug || !Number.isFinite(parsed.cachedAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cacheLearningCenterSnapshot(userId: string, snapshot: LearningCenterSnapshot): void {
  const ownerId = requiredIdentifier(userId, 'la identidad de la cuenta');
  const courseSlug = requiredIdentifier(snapshot?.courseSlug, 'el curso');
  purgeLegacyLearningCenterCache();
  try {
    localStorage.setItem(cacheKey(ownerId, courseSlug), JSON.stringify({ cachedAt: Date.now(), snapshot }));
  } catch {
    // La caché mejora la experiencia, pero no es la fuente de verdad.
  }
}

export function getCachedLearningCenter(userId: string, courseSlug: string): { snapshot: LearningCenterSnapshot; fresh: boolean } | null {
  const ownerId = requiredIdentifier(userId, 'la identidad de la cuenta');
  const normalizedCourseSlug = requiredIdentifier(courseSlug, 'el curso');
  purgeLegacyLearningCenterCache();
  const cached = readCache(ownerId, normalizedCourseSlug);
  return cached
    ? {
        snapshot: normalizeSnapshot(cached.snapshot),
        fresh: Date.now() - cached.cachedAt < CACHE_TTL_MS,
      }
    : null;
}

export async function fetchLearningCenter(userId: string, courseSlug: string, signal?: AbortSignal): Promise<LearningCenterSnapshot> {
  requiredIdentifier(userId, 'la identidad de la cuenta');
  const normalizedCourseSlug = requiredIdentifier(courseSlug, 'el curso');
  const response = await learningApiRequest(`/v1/me/learning-center?courseSlug=${encodeURIComponent(normalizedCourseSlug)}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : undefined,
  });
  const snapshot = normalizeSnapshot(await readApiJson<LearningCenterSnapshot>(response));
  if (signal?.aborted) throw new Error('La sincronización fue cancelada.');
  if (!snapshot || snapshot.courseSlug !== normalizedCourseSlug) {
    throw new Error('La respuesta de aprendizaje no corresponde al curso abierto. Inténtalo otra vez.');
  }
  return snapshot;
}

export interface RemoteNotebookInput {
  courseSlug: string;
  title: string;
  body: string;
  itemKey?: string;
}

export async function createRemoteNotebook(entry: RemoteNotebookInput): Promise<RemoteNotebookEntry> {
  requiredIdentifier(entry?.courseSlug, 'el curso');
  requiredIdentifier(entry?.body, 'el contenido de la nota');
  return normalizeNotebookEntry(await readApiJson<LegacyRemoteNotebookEntry>(
    await learningApiRequest('/v1/me/notebook', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
  ));
}

export async function updateRemoteNotebook(noteId: string, entry: RemoteNotebookInput): Promise<RemoteNotebookEntry> {
  const normalizedNoteId = requiredIdentifier(noteId, 'la nota');
  requiredIdentifier(entry?.courseSlug, 'el curso');
  requiredIdentifier(entry?.body, 'el contenido de la nota');
  return normalizeNotebookEntry(await readApiJson<LegacyRemoteNotebookEntry>(
    await learningApiRequest(`/v1/me/notebook/entries/${encodeURIComponent(normalizedNoteId)}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    }),
  ));
}

export async function deleteRemoteNotebook(noteId: string): Promise<void> {
  const normalizedNoteId = requiredIdentifier(noteId, 'la nota');
  const response = await learningApiRequest(`/v1/me/notebook/entries/${encodeURIComponent(normalizedNoteId)}`, { method: 'DELETE' });
  if (!response.ok) await readApiJson(response);
}

export async function rateRemoteReview(reviewId: string, rating: ReviewRating): Promise<void> {
  const normalizedReviewId = requiredIdentifier(reviewId, 'la tarjeta de repaso');
  await readApiJson(
    await learningApiRequest(`/v1/me/reviews/${encodeURIComponent(normalizedReviewId)}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating, operationId: crypto.randomUUID() }),
    }),
  );
}

export async function markRemoteReinforcementReviewed(reinforcementId: string): Promise<void> {
  const normalizedReinforcementId = requiredIdentifier(reinforcementId, 'el refuerzo');
  await readApiJson(
    await learningApiRequest(`/v1/me/reinforcements/${encodeURIComponent(normalizedReinforcementId)}/reviewed`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),
  );
}
