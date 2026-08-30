import type { UserProgressRecord } from '../types/curriculum';
import { getLearningActorId, learningApiRequest, readApiJson } from './learningHttp';

const CACHE_PREFIX = 'aula_course_progress_cache_v1:';
const CACHE_TTL_MS = 2 * 60_000;

export interface RemoteItemProgress {
  courseSlug: string;
  itemKey: string;
  status: 'not_started' | 'in_progress' | 'completed';
  playbackMs: number;
  score: number | null;
  version: number;
  updatedAt: string;
}

type ProgressSnapshot = Readonly<{ items: RemoteItemProgress[] }>;
type CachedProgress = Readonly<{ cachedAt: number; snapshot: ProgressSnapshot }>;

function cacheKey(): string {
  return `${CACHE_PREFIX}${getLearningActorId()}`;
}

function validItem(value: unknown): value is RemoteItemProgress {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<RemoteItemProgress>;
  return typeof item.courseSlug === 'string'
    && typeof item.itemKey === 'string'
    && ['not_started', 'in_progress', 'completed'].includes(item.status ?? '')
    && Number.isFinite(item.playbackMs)
    && Number.isInteger(item.version)
    && typeof item.updatedAt === 'string';
}

function parseSnapshot(value: unknown): ProgressSnapshot {
  if (!value || typeof value !== 'object' || !Array.isArray((value as ProgressSnapshot).items)) {
    throw new Error('El backend devolvió un progreso inválido.');
  }
  const items = (value as ProgressSnapshot).items;
  if (!items.every(validItem)) throw new Error('El backend devolvió una actividad de progreso inválida.');
  return { items };
}

export function getCachedCourseProgress(): { snapshot: ProgressSnapshot; fresh: boolean } | null {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey()) ?? 'null') as CachedProgress | null;
    if (!cached?.snapshot || !Array.isArray(cached.snapshot.items) || !Number.isFinite(cached.cachedAt)) return null;
    return { snapshot: cached.snapshot, fresh: Date.now() - cached.cachedAt < CACHE_TTL_MS };
  } catch {
    return null;
  }
}

export async function fetchCourseProgress(signal?: AbortSignal): Promise<ProgressSnapshot> {
  const response = await learningApiRequest('/v1/me/progress', {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : undefined,
  });
  const snapshot = parseSnapshot(await readApiJson<unknown>(response));
  try {
    localStorage.setItem(cacheKey(), JSON.stringify({ cachedAt: Date.now(), snapshot }));
  } catch {
    // La copia local solo evita lecturas repetidas; el backend conserva la fuente de verdad.
  }
  return snapshot;
}

export function mergeRemoteProgress(local: UserProgressRecord, remote: readonly RemoteItemProgress[]): UserProgressRecord {
  const completedItemIds = [...local.completedItemIds];
  const known = new Set(completedItemIds);
  for (const item of remote) {
    if (item.status !== 'completed' || known.has(item.itemKey)) continue;
    known.add(item.itemKey);
    completedItemIds.push(item.itemKey);
  }
  return { ...local, completedItemIds };
}
