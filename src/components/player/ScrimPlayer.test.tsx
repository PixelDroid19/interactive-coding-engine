// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScrimPlayer } from './ScrimPlayer';
import { FUNDAMENTOS_SCRIMS } from '../../curriculum/fundamentos/course';
import { loadLastBranchForLesson } from '../../engine/persistence';

describe('ScrimPlayer overlay coordination', () => {
  const lesson = FUNDAMENTOS_SCRIMS['fundamentos-01'];

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('shows branch recovery instead of the start gate and blocks explanation actions', async () => {
    const branch = {
      id: 'branch-recovery-test',
      lessonId: lesson.id,
      baseTime: 1200,
      baseSequence: 0,
      workspace: lesson.initialWorkspace,
      isForked: true,
      lastSavedAt: Date.now(),
      executionCount: 0,
    };
    localStorage.setItem('aula_learner_branches_v1', JSON.stringify({ [branch.id]: branch }));

    render(<ScrimPlayer lessonData={lesson} onBack={() => undefined} />);

    expect(screen.queryByText('Clase con explicación')).toBeNull();
    expect(screen.getByRole('button', { name: 'Explicar lección' }).hasAttribute('disabled')).toBe(true);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Recuperar rama' })).toBeTruthy();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continuar mi versión' }));
    });
    expect(screen.getByRole('button', { name: 'Continuar mi versión' })).toBeTruthy();
  });

  it('blocks explanation while the start gate is active', () => {
    render(<ScrimPlayer lessonData={lesson} onBack={() => undefined} />);

    expect(screen.getByText('Clase con explicación')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Empezar la clase' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Explicar lección' }).hasAttribute('disabled')).toBe(true);
  });

  it('guarda el reto activo para recuperarlo después de recargar', async () => {
    const challenge = { ...lesson.challenges[0], timestamp: 5 };
    const shortLesson = {
      ...lesson,
      id: 'leccion-reto-persistente',
      durationMs: 500,
      audioTrack: undefined,
      challenges: [challenge],
    };

    render(<ScrimPlayer lessonData={shortLesson} onBack={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Empezar la clase' }));

    await waitFor(() => {
      expect(loadLastBranchForLesson(shortLesson.id)?.activeChallengeId).toBe(challenge.id);
    });
  });

  it('descarta la rama recuperable al elegir ver la clase desde el inicio', () => {
    const branch = {
      id: 'branch-discard-test',
      lessonId: lesson.id,
      baseTime: 1200,
      baseSequence: 0,
      workspace: lesson.initialWorkspace,
      isForked: true,
      lastSavedAt: Date.now(),
      executionCount: 0,
    };
    localStorage.setItem('aula_learner_branches_v1', JSON.stringify({ [branch.id]: branch }));

    render(<ScrimPlayer lessonData={lesson} onBack={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver la clase desde el inicio' }));

    expect(loadLastBranchForLesson(lesson.id)).toBeNull();
  });

  it('elimina la rama del reto al saltarlo y volver a la cinta', async () => {
    const challenge = lesson.challenges[0];
    const branch = {
      id: 'branch-skip-test',
      lessonId: lesson.id,
      baseTime: challenge.timestamp,
      baseSequence: 0,
      workspace: lesson.initialWorkspace,
      isForked: true,
      activeChallengeId: challenge.id,
      lastSavedAt: Date.now(),
      executionCount: 0,
    };
    localStorage.setItem('aula_learner_branches_v1', JSON.stringify({ [branch.id]: branch }));

    render(<ScrimPlayer lessonData={lesson} onBack={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar mi versión' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Saltar por ahora' }));

    expect(loadLastBranchForLesson(lesson.id)).toBeNull();
  });
});
