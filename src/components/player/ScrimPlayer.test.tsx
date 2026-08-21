// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ScrimPlayer } from './ScrimPlayer';
import { FUNDAMENTOS_SCRIMS } from '../../curriculum/fundamentos/course';

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
    expect(screen.getByRole('button', { name: 'Explicar lección' }).hasAttribute('disabled')).toBe(true);
  });
});
