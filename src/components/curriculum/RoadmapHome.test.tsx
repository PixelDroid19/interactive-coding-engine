// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../../curriculum/fundamentos/course';
import { createEmptyLearningProfile } from '../../learning/mastery';
import type { LearningProfile } from '../../learning/types';
import type { Course, UserProgressRecord } from '../../types/curriculum';
import { RoadmapHome } from './RoadmapHome';

const auth = vi.hoisted(() => ({ useAuthSession: vi.fn() }));

vi.mock('../../auth/AuthSessionProvider', () => ({
  useAuthSession: auth.useAuthSession,
}));
vi.mock('../../auth/AccountMenu', () => ({ AccountMenu: () => null }));
vi.mock('../ThemeToggle', () => ({ ThemeToggle: () => null }));
vi.mock('../learning/LearningCenter', () => ({
  LearningCenter: ({ onSummaryChange }: { onSummaryChange: (userId: string | null, summary: { dueReviews: number } | null) => void }) => (
    <button type="button" onClick={() => onSummaryChange('student-a', { dueReviews: 3 })}>
      Publicar resumen remoto
    </button>
  ),
}));

const progress: UserProgressRecord = {
  completedItemIds: [],
  completedChallenges: [],
  passedSoloProjects: [],
  savedLearnerBranches: {},
  recentActivity: [],
};

function profileWithDueReview(): LearningProfile {
  const profile = createEmptyLearningProfile(0);
  profile.reviews.push({
    id: 'local-review',
    courseId: FUNDAMENTOS_COURSE.id,
    itemId: 'fundamentos-07',
    skillId: 'return-values',
    prompt: 'No debe aparecer para una sesión anónima',
    intervalIndex: 0,
    dueAt: 0,
    lastReviewedAt: 0,
    repetitions: 0,
  });
  return profile;
}

function studentAuth(userId = 'student-a') {
  return {
    status: 'ready' as const,
    session: {
      authenticated: true as const,
      user: {
        id: userId,
        email: `${userId}@example.com`,
        displayName: userId,
        roles: ['student'] as const,
      },
      csrfToken: 'csrf-roadmap-test-token',
    },
    error: null,
    busy: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    verification: {
      open: false,
      emailHint: '',
      deliveryFailed: false,
      error: null,
      busy: false,
      resendReadyAt: 0,
    },
    verifyEmail: vi.fn(),
    resendCode: vi.fn(),
    dismissVerification: vi.fn(),
  };
}

const anonymousAuth = {
  status: 'ready' as const,
  session: { authenticated: false as const, providers: ['google'] as const },
  error: null,
  busy: false,
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  verification: {
    open: false,
    emailHint: '',
    deliveryFailed: false,
    error: null,
    busy: false,
    resendReadyAt: 0,
  },
  verifyEmail: vi.fn(),
  resendCode: vi.fn(),
  dismissVerification: vi.fn(),
};

function renderRoadmap(profile = profileWithDueReview()) {
  return render(
    <RoadmapHome
      course={FUNDAMENTOS_COURSE}
      progress={progress}
      learningProfile={profile}
      scrims={FUNDAMENTOS_SCRIMS}
      onEnterLesson={vi.fn()}
      onPlayground={vi.fn()}
      onBackToCourses={vi.fn()}
      onLearningProfileChange={vi.fn()}
    />,
  );
}

describe('RoadmapHome', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('no muestra el resumen personal local cuando no hay una alumna autenticada', () => {
    auth.useAuthSession.mockReturnValue(anonymousAuth);

    renderRoadmap();

    expect(screen.queryByLabelText('1 repasos pendientes')).toBeNull();
  });

  it('mantiene el recorrido público neutral tras logout aunque quede progreso personal y una regla de dominio', () => {
    const onEnterLesson = vi.fn();
    const privateProgress: UserProgressRecord = {
      ...progress,
      completedItemIds: ['fundamentos-01'],
      lastAccessedItemId: 'fundamentos-01',
    };
    auth.useAuthSession.mockReturnValue(anonymousAuth);

    render(
      <RoadmapHome
        course={FUNDAMENTOS_COURSE}
        progress={privateProgress}
        learningProfile={createEmptyLearningProfile(0)}
        scrims={FUNDAMENTOS_SCRIMS}
        onEnterLesson={onEnterLesson}
        onPlayground={vi.fn()}
        onBackToCourses={vi.fn()}
        onLearningProfileChange={vi.fn()}
      />,
    );

    const completedLesson = screen.getByRole('button', {
      name: '1. Tu primer programa Reto',
    });
    const nextLesson = screen.getByRole('button', {
      name: '2. Pensar en pasos Reto',
    });
    expect(completedLesson.className).not.toContain('is-done');
    expect(completedLesson.className).not.toContain('is-current');
    expect(nextLesson.className).not.toContain('is-locked');

    fireEvent.click(nextLesson);

    expect(onEnterLesson).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Refuerzo necesario' })).toBeNull();
  });

  it('oculta el bloqueo personal de A al cerrar sesión o cambiar a B', () => {
    auth.useAuthSession.mockReturnValue(studentAuth('student-a'));
    const view = renderRoadmap(createEmptyLearningProfile(0));
    const nextLesson = screen.getByRole('button', {
      name: '2. Pensar en pasos Reto',
    });

    fireEvent.click(nextLesson);
    expect(screen.getByRole('dialog', { name: 'Refuerzo necesario' })).toBeTruthy();
    expect(screen.getByText(/Antes de continuar, refuerza/)).toBeTruthy();

    auth.useAuthSession.mockReturnValue(anonymousAuth);
    view.rerender(
      <RoadmapHome
        course={FUNDAMENTOS_COURSE}
        progress={progress}
        learningProfile={createEmptyLearningProfile(0)}
        scrims={FUNDAMENTOS_SCRIMS}
        onEnterLesson={vi.fn()}
        onPlayground={vi.fn()}
        onBackToCourses={vi.fn()}
        onLearningProfileChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog', { name: 'Refuerzo necesario' })).toBeNull();
    expect(screen.queryByText(/Antes de continuar, refuerza/)).toBeNull();

    auth.useAuthSession.mockReturnValue(studentAuth('student-b'));
    view.rerender(
      <RoadmapHome
        course={FUNDAMENTOS_COURSE}
        progress={progress}
        learningProfile={createEmptyLearningProfile(0)}
        scrims={FUNDAMENTOS_SCRIMS}
        onEnterLesson={vi.fn()}
        onPlayground={vi.fn()}
        onBackToCourses={vi.fn()}
        onLearningProfileChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog', { name: 'Refuerzo necesario' })).toBeNull();
    expect(screen.queryByText(/Antes de continuar, refuerza/)).toBeNull();
  });

  it('mantiene visible un bloqueo publicado para una persona anónima', () => {
    const publishedLockedCourse: Course = {
      ...FUNDAMENTOS_COURSE,
      modules: FUNDAMENTOS_COURSE.modules.map((module) => ({
        ...module,
        items: module.items.map((item) =>
          item.id === 'fundamentos-01'
            ? { ...item, availability: 'locked' as const, availabilityReason: 'Esta clase se publicará pronto.' }
            : item,
        ),
      })),
    };
    auth.useAuthSession.mockReturnValue(anonymousAuth);

    render(
      <RoadmapHome
        course={publishedLockedCourse}
        progress={progress}
        learningProfile={createEmptyLearningProfile(0)}
        scrims={FUNDAMENTOS_SCRIMS}
        onEnterLesson={vi.fn()}
        onPlayground={vi.fn()}
        onBackToCourses={vi.fn()}
        onLearningProfileChange={vi.fn()}
      />,
    );

    const lesson = screen.getByRole('button', { name: '1. Tu primer programa Reto' });
    fireEvent.click(lesson);

    expect(screen.getByRole('dialog', { name: 'Refuerzo necesario' })).toBeTruthy();
    expect(screen.getByText('Esta clase se publicará pronto.')).toBeTruthy();
  });

  it('asocia el resumen remoto a su userId y lo limpia al cambiar de cuenta o cerrar sesión', () => {
    auth.useAuthSession.mockReturnValue(studentAuth());
    const view = renderRoadmap();
    fireEvent.click(screen.getByRole('button', { name: 'Mi aprendizaje' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publicar resumen remoto' }));

    expect(screen.getByLabelText('3 repasos pendientes')).toBeTruthy();

    auth.useAuthSession.mockReturnValue(studentAuth('student-b'));
    view.rerender(
      <RoadmapHome
        course={FUNDAMENTOS_COURSE}
        progress={progress}
        learningProfile={profileWithDueReview()}
        scrims={FUNDAMENTOS_SCRIMS}
        onEnterLesson={vi.fn()}
        onPlayground={vi.fn()}
        onBackToCourses={vi.fn()}
        onLearningProfileChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('3 repasos pendientes')).toBeNull();

    auth.useAuthSession.mockReturnValue(anonymousAuth);
    view.rerender(
      <RoadmapHome
        course={FUNDAMENTOS_COURSE}
        progress={progress}
        learningProfile={profileWithDueReview()}
        scrims={FUNDAMENTOS_SCRIMS}
        onEnterLesson={vi.fn()}
        onPlayground={vi.fn()}
        onBackToCourses={vi.fn()}
        onLearningProfileChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('3 repasos pendientes')).toBeNull();
  });

  it('aclara el contador de lecciones y prácticas con singular y plural en español', () => {
    auth.useAuthSession.mockReturnValue(anonymousAuth);
    renderRoadmap();
    expect(screen.getByText(/lecciones · .*prácticas/)).toBeTruthy();
    expect(screen.queryByText('1 lección')).toBeNull();
    cleanup();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    const singleCourse: Course = {
      ...FUNDAMENTOS_COURSE,
      id: 'single-course',
      title: 'Curso singular',
      modules: [
        {
          id: 'm1',
          title: 'Módulo 1',
          items: [
            { id: 'single-1', title: 'Única', type: 'scrim', scrimDataId: 'fundamentos-01', estimatedMinutes: 5 } as Course['modules'][number]['items'][number],
            {
              id: 'single-debug',
              title: 'Debug único',
              type: 'debugging',
              executionMode: 'logic',
              templateId: 'js-only',
              initialWorkspace: { files: {}, entryFile: 'app.js' },
              expectedBehavior: '',
              observedBehavior: '',
              hints: [],
              tests: [],
              estimatedMinutes: 5,
            } as unknown as Course['modules'][number]['items'][number],
          ],
        },
      ],
    };
    render(
      <RoadmapHome
        course={singleCourse}
        progress={progress}
        learningProfile={createEmptyLearningProfile(0)}
        scrims={FUNDAMENTOS_SCRIMS}
        onEnterLesson={vi.fn()}
        onPlayground={vi.fn()}
        onBackToCourses={vi.fn()}
        onLearningProfileChange={vi.fn()}
      />,
    );
    expect(screen.getByText('1 lección · 1 práctica')).toBeTruthy();
  });
});
