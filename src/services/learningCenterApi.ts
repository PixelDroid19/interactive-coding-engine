import type { ReviewRating } from '../learning/types';
import { learningApiRequest, readApiJson } from './learningHttp';

const CACHE_PREFIX = 'aula_learning_center_cache_v1:';
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
  skillKey: string;
  concept: string;
  mentalModel: string;
  pattern: string;
  ownExample: string;
  personalMistake: string;
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

type CachedSnapshot = Readonly<{ cachedAt: number; snapshot: LearningCenterSnapshot }>;

function cacheKey(courseSlug: string): string {
  return `${CACHE_PREFIX}${courseSlug}`;
}

function readCache(courseSlug: string): CachedSnapshot | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(courseSlug)) ?? 'null') as CachedSnapshot | null;
    if (!parsed?.snapshot || parsed.snapshot.courseSlug !== courseSlug || !Number.isFinite(parsed.cachedAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(snapshot: LearningCenterSnapshot): void {
  try {
    localStorage.setItem(cacheKey(snapshot.courseSlug), JSON.stringify({ cachedAt: Date.now(), snapshot }));
  } catch {
    // La caché mejora la experiencia, pero no es la fuente de verdad.
  }
}

export function getCachedLearningCenter(courseSlug: string): { snapshot: LearningCenterSnapshot; fresh: boolean } | null {
  const cached = readCache(courseSlug);
  return cached ? { snapshot: cached.snapshot, fresh: Date.now() - cached.cachedAt < CACHE_TTL_MS } : null;
}

export async function fetchLearningCenter(courseSlug: string, signal?: AbortSignal): Promise<LearningCenterSnapshot> {
  const response = await learningApiRequest(`/v1/me/learning-center?courseSlug=${encodeURIComponent(courseSlug)}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : undefined,
  });
  const snapshot = await readApiJson<LearningCenterSnapshot>(response);
  writeCache(snapshot);
  return snapshot;
}

export async function saveRemoteNotebook(skillKey: string, entry: {
  courseSlug: string;
  concept: string;
  mentalModel: string;
  pattern: string;
  ownExample: string;
  personalMistake: string;
}): Promise<void> {
  await readApiJson(await learningApiRequest(`/v1/me/notebook/${encodeURIComponent(skillKey)}`, {
    method: 'PUT', body: JSON.stringify(entry),
  }));
}

export async function rateRemoteReview(reviewId: string, rating: ReviewRating): Promise<void> {
  await readApiJson(await learningApiRequest(`/v1/me/reviews/${encodeURIComponent(reviewId)}/rating`, {
    method: 'POST', body: JSON.stringify({ rating, operationId: crypto.randomUUID() }),
  }));
}

export async function markRemoteReinforcementReviewed(reinforcementId: string): Promise<void> {
  await readApiJson(await learningApiRequest(`/v1/me/reinforcements/${encodeURIComponent(reinforcementId)}/reviewed`, {
    method: 'PUT', body: JSON.stringify({}),
  }));
}
