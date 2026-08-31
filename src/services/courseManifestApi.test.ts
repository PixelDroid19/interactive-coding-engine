import { describe, expect, it } from 'vitest';
import type { Course } from '../types/curriculum';
import { AI_ENGINEER_COURSE } from '../curriculum/ai-engineer/course';
import { FUNDAMENTOS_COURSE } from '../curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE } from '../curriculum/javascript/course';
import { OPEN_CELLS_COURSE } from '../curriculum/open-cells/course';
import { COMPONENT_COURSE } from '../curriculum/web-components-lit/course';
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
    const application = applyPublishedManifest(course, {
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

    expect(application.status).toBe('applied');
    expect(application.course.modules[0]?.title).toBe('Módulo publicado');
    expect(application.course.modules[0]?.items.map((item) => item.id)).toEqual(['demo-01-debug', 'demo-01', 'scrim-custom-1']);
    expect(application.course.modules[0]?.items[0]).toMatchObject({
      title: 'Depuración publicada', estimatedMinutes: 14, availability: 'locked', availabilityReason: 'Completa la clase primero.',
      expectedBehavior: 'Funciona',
    });
    expect(application.course.modules[0]?.items.some((item) => item.id === 'demo-local-only')).toBe(false);
  });

  it('rechaza un manifiesto vacío y conserva navegables los cinco currículos locales', () => {
    const localCourses = [
      FUNDAMENTOS_COURSE,
      JAVASCRIPT_COURSE,
      COMPONENT_COURSE,
      OPEN_CELLS_COURSE,
      AI_ENGINEER_COURSE,
    ];

    for (const localCourse of localCourses) {
      const application = applyPublishedManifest(localCourse, {
        slug: localCourse.slug,
        version: 1,
        publishedAt: '2026-08-30T00:00:00.000Z',
        modules: [],
        lessons: [],
      });

      expect(application).toMatchObject({ status: 'rejected', course: localCourse });
      expect(application.course.modules.flatMap((module) => module.items)).not.toHaveLength(0);
    }
  });

  it('rechaza un manifiesto truncado que omite un módulo local', () => {
    const localCourse: Course = {
      ...course,
      modules: [
        ...course.modules,
        {
          id: 'module-omitted',
          title: 'Módulo que no puede desaparecer',
          items: [{ id: 'demo-02', title: 'Segunda clase', type: 'scrim', estimatedMinutes: 5, scrimDataId: 'demo-02' }],
        },
      ],
    };

    const application = applyPublishedManifest(localCourse, {
      slug: 'demo', version: 4, publishedAt: '2026-08-30T00:00:00.000Z',
      modules: [{
        id: 'module-local', title: 'Solo la primera parte', items: [{
          id: 'demo-01', title: 'Clase publicada', type: 'scrim', estimatedMinutes: 7,
          lessonKey: 'demo-01', availability: 'available', availabilityReason: null,
        }],
      }],
      lessons: [],
    });

    expect(application).toMatchObject({ status: 'rejected', course: localCourse });
  });
});
