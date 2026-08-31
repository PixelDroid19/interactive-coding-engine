// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider } from './themes/ThemeProvider';
import { FUNDAMENTOS_COURSE } from './curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE } from './curriculum/javascript/course';
import { COMPONENT_COURSE } from './curriculum/web-components-lit/course';
import { OPEN_CELLS_COURSE } from './curriculum/open-cells/course';
import { AI_ENGINEER_COURSE } from './curriculum/ai-engineer/course';

const canonicalDataMocks = vi.hoisted(() => ({
  fetchPublishedCourses: vi.fn(),
  fetchPublishedManifest: vi.fn(),
  fetchCourseProgress: vi.fn(),
}));

vi.mock('./services/courseCatalogApi', async () => {
  const actual = await vi.importActual('./services/courseCatalogApi');
  return {
    ...actual,
    fetchPublishedCourses: canonicalDataMocks.fetchPublishedCourses,
  };
});

vi.mock('./services/courseManifestApi', async () => {
  const actual = await vi.importActual('./services/courseManifestApi');
  return {
    ...actual,
    fetchPublishedManifest: canonicalDataMocks.fetchPublishedManifest,
  };
});

vi.mock('./services/courseProgressApi', async () => {
  const actual = await vi.importActual('./services/courseProgressApi');
  return {
    ...actual,
    fetchCourseProgress: canonicalDataMocks.fetchCourseProgress,
  };
});

vi.mock('./auth/AccountMenu', () => {
  return {
    AccountMenu: () => null,
  };
});

vi.mock('./services/learningSync', async () => {
  const actual = await vi.importActual('./services/learningSync');
  return {
    ...actual,
    flushLearningQueue: vi.fn().mockResolvedValue(undefined),
  };
});

import App from './App';

const remoteFundamentals = {
  id: FUNDAMENTOS_COURSE.id,
  slug: FUNDAMENTOS_COURSE.slug,
  title: 'Fundamentos publicados',
  description: 'Descripción publicada.',
  metadata: {
    tagline: 'Bases actualizadas',
    level: 'Beginner' as const,
    tags: ['variables'],
    instructor: { name: 'Equipo editorial', role: 'Docente' },
    thumbnailGradient: 'linear-gradient(#fff, #000)',
  },
  availability: 'available' as const,
  availabilityReason: null,
  updatedAt: '2026-08-30T00:00:00.000Z',
};

const publishedManifest = {
  slug: FUNDAMENTOS_COURSE.slug,
  version: 1,
  publishedAt: '2026-08-30T00:00:00.000Z',
  modules: FUNDAMENTOS_COURSE.modules.map((module) => ({
    id: module.id,
    title: module.title,
    items: module.items.slice(0, 1).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      estimatedMinutes: item.estimatedMinutes,
      lessonKey: item.id,
      availability: 'available' as const,
      availabilityReason: null,
    })),
  })),
  lessons: [],
};

const renderApp = () =>
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );

describe('datos canónicos del catálogo', () => {
  beforeEach(() => {
    localStorage.clear();
    canonicalDataMocks.fetchPublishedCourses.mockReset();
    canonicalDataMocks.fetchPublishedManifest.mockReset();
    canonicalDataMocks.fetchCourseProgress.mockReset();
    canonicalDataMocks.fetchPublishedCourses.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    canonicalDataMocks.fetchPublishedManifest.mockResolvedValue(publishedManifest);
    canonicalDataMocks.fetchCourseProgress.mockResolvedValue({ items: [] });
  });

  afterEach(() => {
    cleanup();
  });

  it('conserva los recorridos locales que no aparecen en una respuesta publicada parcial', async () => {
    canonicalDataMocks.fetchPublishedCourses.mockResolvedValue({
      items: [remoteFundamentals],
      nextCursor: null,
    });

    renderApp();

    expect(
      await screen.findByRole('button', {
        name: 'Ver recorrido: Fundamentos publicados',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: `Ver recorrido: ${JAVASCRIPT_COURSE.title}`,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: `Ver recorrido: ${COMPONENT_COURSE.title}`,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: `Ver recorrido: ${OPEN_CELLS_COURSE.title}`,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: `Ver recorrido: ${AI_ENGINEER_COURSE.title}`,
      }),
    ).toBeTruthy();
  });

  it('actualiza una caché paginada fresca en lugar de aceptarla como catálogo completo', async () => {
    localStorage.setItem(
      'aula_course_catalog_cache_v1',
      JSON.stringify({
        cachedAt: Date.now(),
        catalog: {
          items: [{ ...remoteFundamentals, title: 'Fundamentos de caché parcial' }],
          nextCursor: 'page-2',
        },
      }),
    );
    canonicalDataMocks.fetchPublishedCourses.mockResolvedValue({
      items: [remoteFundamentals],
      nextCursor: null,
    });

    renderApp();

    expect(
      await screen.findByRole('button', {
        name: 'Ver recorrido: Fundamentos publicados',
      }),
    ).toBeTruthy();
  });

  it('advierte cuando no puede consultar el catálogo publicado', async () => {
    canonicalDataMocks.fetchPublishedCourses.mockRejectedValue(new Error('Catálogo no disponible.'));

    renderApp();

    const alert = await screen.findByRole('alert', { name: 'Estado de datos publicados' });
    expect(alert.textContent).toContain(
      'No pudimos consultar el catálogo publicado. Se muestra el contenido local y su disponibilidad puede estar desactualizada.',
    );
    expect(alert.querySelector('details')?.open).toBe(false);
    expect(screen.getByText(/Modo local · datos sin actualizar/)).toBeTruthy();
  });

  it('advierte cuando no puede actualizar la estructura publicada del curso', async () => {
    canonicalDataMocks.fetchPublishedManifest.mockRejectedValue(new Error('Manifiesto no disponible.'));

    renderApp();

    expect((await screen.findByRole('alert', { name: 'Estado de datos publicados' })).textContent).toContain(
      'No pudimos actualizar la estructura publicada de este curso. Estás viendo el contenido local y el acceso puede estar desactualizado.',
    );
  });

  it('rechaza un manifiesto HTTP correcto pero incompleto y conserva el currículo local', async () => {
    canonicalDataMocks.fetchPublishedManifest.mockResolvedValue({ ...publishedManifest, modules: [] });

    renderApp();

    expect((await screen.findByRole('alert', { name: 'Estado de datos publicados' })).textContent).toContain(
      'El manifiesto publicado está incompleto:',
    );
    expect(screen.getByRole('button', { name: `Ver recorrido: ${FUNDAMENTOS_COURSE.title}` })).toBeTruthy();
  });

  it('advierte cuando no puede actualizar el progreso remoto', async () => {
    canonicalDataMocks.fetchCourseProgress.mockRejectedValue(new Error('Progreso no disponible.'));

    renderApp();

    expect((await screen.findByRole('alert', { name: 'Estado de datos publicados' })).textContent).toContain(
      'No pudimos actualizar tu progreso desde el servidor. Se conserva el progreso de este dispositivo.',
    );
  });

  it('identifica una copia de catálogo desactualizada cuando falla su actualización', async () => {
    localStorage.setItem(
      'aula_course_catalog_cache_v1',
      JSON.stringify({
        cachedAt: Date.now() - 11 * 60_000,
        catalog: { items: [remoteFundamentals], nextCursor: null },
      }),
    );
    canonicalDataMocks.fetchPublishedCourses.mockRejectedValue(new Error('Catálogo no disponible.'));

    renderApp();

    expect((await screen.findByRole('alert', { name: 'Estado de datos publicados' })).textContent).toContain(
      'No pudimos actualizar el catálogo publicado. Estás viendo una copia guardada que puede estar desactualizada.',
    );
  });
});
