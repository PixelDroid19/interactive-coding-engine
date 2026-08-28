// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FUNDAMENTOS_COURSE } from '../../curriculum/fundamentos/course';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { LearningCenter } from './LearningCenter';

describe('LearningCenter', () => {
  afterEach(cleanup);

  it('reúne repaso, cuaderno, examen, entrevista y ruta sin salir del curso', () => {
    const profile = createEmptyLearningProfile(0);
    profile.tutor.reinforcements.push({
      id: 'tutor:course-fundamentos:return-values',
      courseId: FUNDAMENTOS_COURSE.id,
      itemId: 'fundamentos-07',
      skillId: 'return-values',
      note: 'Distingue mostrar un dato de devolverlo.',
      evidence: 'El mismo error apareció en tres intentos.',
      occurrences: 3,
      reviewed: false,
      createdAt: 1,
      updatedAt: 2,
    });
    const onReviewReinforcement = vi.fn(async () => undefined);
    render(
      <LearningCenter
        course={FUNDAMENTOS_COURSE}
        profile={profile}
        onClose={vi.fn()}
        onRateReview={vi.fn(async () => undefined)}
        onSaveNotebook={vi.fn(async () => undefined)}
        onCompleteExam={vi.fn(async () => undefined)}
        onReviewReinforcement={onReviewReinforcement}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Centro de aprendizaje' })).toBeTruthy();
    const summary = screen.getByLabelText('Resumen de aprendizaje');
    expect(summary.textContent).toContain('1 por reforzar');
    expect(summary.textContent).toContain('0 notas propias');
    expect(screen.getByRole('heading', { name: 'Conceptos para reforzar' })).toBeTruthy();
    expect(screen.getByText('Distingue mostrar un dato de devolverlo.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar return values como repasado' }));
    expect(onReviewReinforcement).toHaveBeenCalledWith('tutor:course-fundamentos:return-values');

    fireEvent.click(screen.getByRole('button', { name: /^Cuaderno$/ }));
    expect(screen.getByRole('heading', { name: 'Tu explicación corta, no otra documentación' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Examen$/ }));
    expect(screen.getByRole('heading', { name: 'Examen mixto' })).toBeTruthy();

    const leader = screen.getByRole('button', { name: /Líder.*requiere revisión externa/i });
    expect((leader as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Defiende tus decisiones' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Ruta$/ }));
    expect(screen.getByRole('heading', { name: 'De una instrucción a una aplicación Cells' })).toBeTruthy();
  });
});
