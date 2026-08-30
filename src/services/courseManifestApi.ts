import type { Course, CourseModule, CurriculumItem, ItemType } from '../types/curriculum';
import { learningApiRequest, readApiJson } from './learningHttp';

const CACHE_PREFIX = 'aula_course_manifest_cache_v1:';
const CACHE_TTL_MS = 10 * 60_000;
const ITEM_TYPES = new Set<ItemType>(['scrim', 'challenge', 'debugging', 'solo-project', 'reading', 'reasoning']);

export interface PublishedCurriculumItem {
  id: string;
  title: string;
  type: ItemType;
  estimatedMinutes: number;
  description?: string;
  lessonKey: string;
  availability: 'available' | 'locked';
  availabilityReason: string | null;
}

export interface PublishedCurriculumModule {
  id: string;
  title: string;
  description?: string;
  items: PublishedCurriculumItem[];
}

export interface PublishedCourseManifest {
  slug: string;
  version: number;
  publishedAt: string;
  modules: PublishedCurriculumModule[];
  lessons: Array<{
    key: string;
    availability: 'available' | 'locked';
    availabilityReason: string | null;
  }>;
}

type CachedManifest = Readonly<{ cachedAt: number; manifest: PublishedCourseManifest }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function parseManifest(value: unknown, expectedSlug: string): PublishedCourseManifest {
  if (!isRecord(value) || value.slug !== expectedSlug || !Number.isInteger(value.version) || !Array.isArray(value.modules) || !Array.isArray(value.lessons)) {
    throw new Error('El backend devolvió un manifiesto curricular inválido.');
  }
  const modules: PublishedCurriculumModule[] = value.modules.map((candidate) => {
    if (!isRecord(candidate) || typeof candidate.id !== 'string' || typeof candidate.title !== 'string' || !Array.isArray(candidate.items)) {
      throw new Error('El backend devolvió un módulo curricular inválido.');
    }
    const items: PublishedCurriculumItem[] = candidate.items.map((item) => {
      if (
        !isRecord(item)
        || typeof item.id !== 'string'
        || typeof item.title !== 'string'
        || typeof item.type !== 'string'
        || !ITEM_TYPES.has(item.type as ItemType)
        || !Number.isFinite(item.estimatedMinutes)
        || typeof item.lessonKey !== 'string'
        || (item.availability !== 'available' && item.availability !== 'locked')
        || (item.availabilityReason !== null && typeof item.availabilityReason !== 'string')
      ) {
        throw new Error('El backend devolvió una actividad curricular inválida.');
      }
      return item as unknown as PublishedCurriculumItem;
    });
    return {
      id: candidate.id,
      title: candidate.title,
      ...(typeof candidate.description === 'string' ? { description: candidate.description } : {}),
      items,
    };
  });
  return { ...(value as unknown as PublishedCourseManifest), modules };
}

function cacheKey(courseSlug: string): string {
  return `${CACHE_PREFIX}${courseSlug}`;
}

export function getCachedPublishedManifest(courseSlug: string): { manifest: PublishedCourseManifest; fresh: boolean } | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(courseSlug)) ?? 'null') as CachedManifest | null;
    if (!parsed?.manifest || parsed.manifest.slug !== courseSlug || !Number.isFinite(parsed.cachedAt)) return null;
    return { manifest: parsed.manifest, fresh: Date.now() - parsed.cachedAt < CACHE_TTL_MS };
  } catch {
    return null;
  }
}

export async function fetchPublishedManifest(courseSlug: string, signal?: AbortSignal): Promise<PublishedCourseManifest> {
  const response = await learningApiRequest(`/v1/courses/${encodeURIComponent(courseSlug)}/manifest`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : undefined,
  });
  const manifest = parseManifest(await readApiJson<unknown>(response), courseSlug);
  try {
    localStorage.setItem(cacheKey(courseSlug), JSON.stringify({ cachedAt: Date.now(), manifest }));
  } catch {
    // La caché solo permite reabrir la última estructura publicada sin otra petición.
  }
  return manifest;
}

export function applyPublishedManifest(course: Course, manifest: PublishedCourseManifest): Course {
  if (manifest.slug !== course.slug) return course;
  const localItems = new Map(course.modules.flatMap((module) => module.items).map((item) => [item.id, item]));
  const localModules = new Map(course.modules.map((module) => [module.id, module]));
  const modules: CourseModule[] = manifest.modules.flatMap((remoteModule) => {
    const publishedItems = remoteModule.items.flatMap((remoteItem) => {
      const localItem = localItems.get(remoteItem.id);
      if (!localItem || localItem.type !== remoteItem.type) return [];
      return [{
        ...localItem,
        title: remoteItem.title,
        estimatedMinutes: remoteItem.estimatedMinutes,
        description: remoteItem.description ?? localItem.description,
        availability: remoteItem.availability,
        availabilityReason: remoteItem.availabilityReason ?? undefined,
      } as CurriculumItem];
    });
    const customItems = localModules.get(remoteModule.id)?.items.filter((item) => item.id.startsWith('scrim-custom-')) ?? [];
    const items = [...publishedItems, ...customItems];
    return items.length > 0 ? [{
      id: remoteModule.id,
      title: remoteModule.title,
      description: remoteModule.description,
      items,
    }] : [];
  });
  return { ...course, modules };
}
