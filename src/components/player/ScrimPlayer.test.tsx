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
      expect(screen.getByRole('dialog', { name: 'Continuar lección' })).toBeTruthy();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continuar donde lo dejé' }));
    });
    expect(screen.getByRole('heading', { name: '¿Cómo quieres continuar?' })).toBeTruthy();
    expect(screen.getByText('Puedes continuar desde donde lo dejaste la última vez o comenzar la lección desde cero.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar donde lo dejé' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Comenzar lección desde cero' })).toBeTruthy();
    expect(screen.queryByText(/\bversi[oó]n\b|\brama\b/i)).toBeNull();
  });

  it('blocks explanation while the start gate is active', () => {
    render(<ScrimPlayer lessonData={lesson} onBack={() => undefined} />);

    expect(screen.getByText('Clase con explicación')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Empezar la clase' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Explicar lección' }).hasAttribute('disabled')).toBe(true);
  });

  it('explica qué aprenderá el estudiante antes de iniciar la cinta', () => {
    render(<ScrimPlayer lessonData={lesson} onBack={() => undefined} />);

    expect(screen.getByRole('heading', { name: 'Al terminar podrás' })).toBeTruthy();
    lesson.learningObjectives.forEach((objective) => {
      expect(screen.getByText(objective)).toBeTruthy();
    });
  });

  it('usa una salida lógica sin mini-browser en una lección de JavaScript puro', () => {
    render(<ScrimPlayer lessonData={{ ...lesson, executionMode: 'logic' } as typeof lesson} onBack={() => undefined} />);

    expect(screen.getByRole('region', { name: 'Salida de JavaScript' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ejecutar lógica' })).toBeTruthy();
    expect(screen.queryByRole('toolbar', { name: 'Barra de vista previa, usa flechas para mover' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fijar vista al lado' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Abrir index.html' })).toBeNull();
  });

  it('conserva el mini-browser cuando la lección enseña DOM', () => {
    const domLesson = FUNDAMENTOS_SCRIMS['fundamentos-10'];
    render(<ScrimPlayer lessonData={{ ...domLesson, executionMode: 'browser' } as typeof domLesson} onBack={() => undefined} />);

    expect(screen.getByRole('toolbar', { name: 'Barra de vista previa, usa flechas para mover' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Salida de JavaScript' })).toBeNull();
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
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar lección desde cero' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Continuar donde lo dejé' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Saltar por ahora' }));

    expect(loadLastBranchForLesson(lesson.id)).toBeNull();
  });

  it('abre el reto al pulsar su marcador en la línea de tiempo', async () => {
    const challenge = { ...lesson.challenges[0], timestamp: 50_000 };
    const markerLesson = {
      ...lesson,
      id: 'leccion-marcador-reto',
      durationMs: 60_000,
      audioTrack: undefined,
      challenges: [challenge],
    };

    render(<ScrimPlayer lessonData={markerLesson} onBack={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Empezar la clase' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pausar la clase' }));
    fireEvent.click(screen.getByRole('button', { name: `Ir al reto ${challenge.title}` }));

    expect(await screen.findByRole('button', { name: 'Comprobar reto' })).toBeTruthy();
  });
});
