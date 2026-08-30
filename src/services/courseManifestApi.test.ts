import { describe, expect, it } from 'vitest';
import type { Course } from '../types/curriculum';
import { applyPublishedManifest } from './courseManifestApi';

const course: Course = {
  id: 'course-demo', slug: 'demo', title: 'Demo', tagline: 'Demo', description: 'Demo', level: 'Beginner', tags: [],
  instructor: { name: 'Equipo', role: 'Instructor' },
  modules: [
    {
      id: 'module-local', title: 'Módulo local', items: [
        { id: 'demo-01', title: 'Título local', type: 'scrim', estimatedMinutes: 5, scrimDataId: 'demo-01' },
        {
          id: 'demo-01-debug', title: 'Depuración local', type: 'debugging', estimatedMinutes: 10,
          executionMode: 'logic', templateId: 'js-only', initialWorkspace: { files: {}, activeFilePath: '' },
          expectedBehavior: 'Funciona', observedBehavior: 'Falla', hints: [], tests: [],
        },
        { id: 'demo-local-only', title: 'No publicado', type: 'scrim', estimatedMinutes: 2, scrimDataId: 'demo-local-only' },
        { id: 'scrim-custom-1', title: 'Grabación local', type: 'scrim', estimatedMinutes: 3, scrimDataId: 'scrim-custom-1' },
      ],
    },
  ],
};

describe('applyPublishedManifest', () => {
  it('usa el orden y la disponibilidad remotos sin perder el contenido ejecutable local', () => {
    const hydrated = applyPublishedManifest(course, {
      slug: 'demo', version: 3, publishedAt: '2026-08-29T00:00:00.000Z',
      modules: [{
        id: 'module-local', title: 'Módulo publicado', description: 'Ordenado por backend',
        items: [
          {
            id: 'demo-01-debug', title: 'Depuración publicada', type: 'debugging', estimatedMinutes: 14,
            lessonKey: 'demo-01', availability: 'locked', availabilityReason: 'Completa la clase primero.',
          },
          {
            id: 'demo-01', title: 'Clase publicada', type: 'scrim', estimatedMinutes: 7,
            lessonKey: 'demo-01', availability: 'available', availabilityReason: null,
          },
        ],
      }],
      lessons: [],
    });

    expect(hydrated.modules[0]?.title).toBe('Módulo publicado');
    expect(hydrated.modules[0]?.items.map((item) => item.id)).toEqual(['demo-01-debug', 'demo-01', 'scrim-custom-1']);
    expect(hydrated.modules[0]?.items[0]).toMatchObject({
      title: 'Depuración publicada', estimatedMinutes: 14, availability: 'locked', availabilityReason: 'Completa la clase primero.',
      expectedBehavior: 'Funciona',
    });
    expect(hydrated.modules[0]?.items.some((item) => item.id === 'demo-local-only')).toBe(false);
  });
});
