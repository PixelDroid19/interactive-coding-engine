// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { ReviewQueue } from './ReviewQueue';

describe('ReviewQueue', () => {
  afterEach(cleanup);

  it('explica con honestidad que todavía no hay actividad cuando no existe evidencia real', () => {
    render(
      <ReviewQueue
        courseId="course-1"
        profile={createEmptyLearningProfile(0)}
        onRate={vi.fn(async () => undefined)}
        onReviewReinforcement={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText('Aún no tienes actividad para repasar.')).toBeTruthy();
  });

  it('informa un error de calificación y deja el repaso disponible para reintentar', async () => {
    const profile = createEmptyLearningProfile(0);
    profile.reviews.push({
      id: 'review-1',
      courseId: 'course-1',
      itemId: 'lesson-1',
      skillId: 'return-values',
      prompt: '¿Qué devuelve una función?',
      intervalIndex: 0,
      dueAt: 0,
      lastReviewedAt: 0,
      repetitions: 0,
    });
    const onRate = vi.fn().mockRejectedValueOnce(new Error('Servicio temporalmente no disponible')).mockResolvedValueOnce(undefined);

    render(<ReviewQueue courseId="course-1" profile={profile} onRate={onRate} onReviewReinforcement={vi.fn(async () => undefined)} />);
    fireEvent.change(screen.getByLabelText('Responde sin abrir la lección'), {
      target: {
        value: 'Una función puede devolver un valor para usarlo después.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comparar mi respuesta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lo expliqué' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo registrar tu calificación');
    expect((screen.getByRole('button', { name: 'Lo expliqué' }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Lo expliqué' }));
    await waitFor(() => expect(onRate).toHaveBeenCalledTimes(2));
  });

  it('informa un error al marcar un refuerzo y permite volver a intentarlo', async () => {
    const profile = createEmptyLearningProfile(0);
    profile.tutor.reinforcements.push({
      id: 'reinforcement-1',
      courseId: 'course-1',
      itemId: 'lesson-1',
      skillId: 'return-values',
      note: 'Repasa la diferencia entre mostrar y devolver.',
      evidence: 'Observado en una práctica.',
      occurrences: 1,
      reviewed: false,
      createdAt: 1,
      updatedAt: 1,
    });
    const onReviewReinforcement = vi.fn().mockRejectedValueOnce(new Error('Servicio temporalmente no disponible')).mockResolvedValueOnce(undefined);

    render(<ReviewQueue courseId="course-1" profile={profile} onRate={vi.fn(async () => undefined)} onReviewReinforcement={onReviewReinforcement} />);
    const retry = screen.getByRole('button', {
      name: /Marcar return values como repasado/,
    });
    fireEvent.click(retry);

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo marcar este refuerzo como repasado');
    expect((retry as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(retry);
    await waitFor(() => expect(onReviewReinforcement).toHaveBeenCalledTimes(2));
  });
});
