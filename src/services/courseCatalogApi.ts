import { learningApiRequest, readApiJson } from './learningHttp';

const CACHE_KEY = 'aula_course_catalog_cache_v1';
const CACHE_TTL_MS = 10 * 60_000;

export type CourseAvailability = 'available' | 'locked';

export interface PublishedCourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  metadata?: {
    id?: string;
    tagline?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    tags?: string[];
    instructor?: { name: string; role: string; bio?: string; avatarUrl?: string };
    thumbnailGradient?: string;
  };
  availability: CourseAvailability;
  availabilityReason: string | null;
  availabilityScope?: 'global' | 'user' | null;
  updatedAt: string;
}

type PublishedCatalog = Readonly<{ items: PublishedCourseSummary[]; nextCursor: string | null }>;
type CachedCatalog = Readonly<{ cachedAt: number; catalog: PublishedCatalog }>;

function readCache(): CachedCatalog | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as CachedCatalog | null;
    return parsed?.catalog && Number.isFinite(parsed.cachedAt) ? parsed : null;
  } catch {
    return null;
  }
}

export function getCachedPublishedCourses(): { catalog: PublishedCatalog; fresh: boolean; complete: boolean } | null {
  const cached = readCache();
  return cached ? {
    catalog: cached.catalog,
    fresh: Date.now() - cached.cachedAt < CACHE_TTL_MS,
    complete: cached.catalog.nextCursor === null,
  } : null;
}

export async function fetchPublishedCourses(signal?: AbortSignal): Promise<PublishedCatalog> {
  const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : undefined;
  const items: PublishedCourseSummary[] = [];
  const visitedCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const query = new URLSearchParams({ limit: '50' });
    if (cursor !== null) query.set('cursor', cursor);
    const response = await learningApiRequest(`/v1/courses?${query}`, { signal: requestSignal });
    const page = await readApiJson<PublishedCatalog>(response);
    items.push(...page.items);
    cursor = page.nextCursor;
    if (cursor !== null && !visitedCursors.add(cursor)) {
      throw new Error('El backend devolvió un cursor de catálogo repetido.');
    }
  } while (cursor !== null);

  const catalog: PublishedCatalog = { items, nextCursor: null };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), catalog }));
  } catch {
    // La disponibilidad del backend sigue siendo la fuente de verdad.
  }
  return catalog;
}
