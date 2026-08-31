// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPublishedCourses, getCachedPublishedCourses } from './courseCatalogApi';

const firstCourse = {
  id: 'course-fundamentos',
  slug: 'fundamentos',
  title: 'Fundamentos publicados',
  description: 'Bases actualizadas.',
  availability: 'available' as const,
  availabilityReason: null,
  updatedAt: '2026-08-30T00:00:00.000Z',
};

const secondCourse = {
  id: 'course-javascript',
  slug: 'javascript',
  title: 'JavaScript publicado',
  description: 'JavaScript actualizado.',
  availability: 'available' as const,
  availabilityReason: null,
  updatedAt: '2026-08-30T00:00:00.000Z',
};

describe('course catalog API', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('combina todas las páginas publicadas antes de guardar el catálogo', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [firstCourse],
            nextCursor: 'page-2',
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [secondCourse],
            nextCursor: null,
          }),
        ),
      );

    const catalog = await fetchPublishedCourses();

    expect(catalog).toEqual({
      items: [firstCourse, secondCourse],
      nextCursor: null,
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/v1/courses?limit=50');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/v1/courses?limit=50&cursor=page-2');
    expect(getCachedPublishedCourses()?.catalog).toEqual(catalog);
  });

  it('marca una caché con cursor pendiente como incompleta aunque siga dentro de su TTL', () => {
    localStorage.setItem(
      'aula_course_catalog_cache_v1',
      JSON.stringify({
        cachedAt: Date.now(),
        catalog: {
          items: [firstCourse],
          nextCursor: 'page-2',
        },
      }),
    );

    expect(getCachedPublishedCourses()).toMatchObject({
      fresh: true,
      complete: false,
    });
  });
});
