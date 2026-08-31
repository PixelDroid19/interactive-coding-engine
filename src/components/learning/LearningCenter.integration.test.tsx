// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FUNDAMENTOS_COURSE } from '../../curriculum/fundamentos/course';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { LearningCenter } from './LearningCenter';

describe('LearningCenter', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      courseSlug: 'fundamentos',
      generatedAt: new Date(0).toISOString(),
      summary: { dueReviews: 0, reinforcements: 1, notes: 0, averageMastery: null, activeSkills: 1 },
      reviews: [], notes: [], skillGaps: [], recentItems: [],
      reinforcements: [{
        id: 'a32b923e-1f3d-45f7-b2e7-cf86a1956136', itemKey: 'fundamentos-07', skillKey: 'return-values',
        note: 'Distingue mostrar un dato de devolverlo.', evidence: 'El mismo error apareció en tres intentos.',
        occurrences: 3, reviewedAt: null, createdAt: new Date(1).toISOString(), updatedAt: new Date(2).toISOString(),
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
  });

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
    const summary = screen.getByRole('group', { name: 'Resumen de aprendizaje' });
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
    expect(screen.queryByText(/fundamentos del curso/i)).toBeNull();
    expect(screen.getByText(/Define JavaScript/i)).toBeTruthy();

    const leader = screen.getByRole('button', { name: /Líder.*requiere revisión externa/i });
    expect((leader as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Defiende tus decisiones' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Ruta$/ }));
    expect(screen.getByRole('heading', { name: 'De una instrucción a una aplicación Cells' })).toBeTruthy();
  });

  it('actualiza el contador de notas con la escritura confirmada sin esperar otra lectura', async () => {
    const onSummaryChange = vi.fn();
    const emptySnapshot = {
      courseSlug: 'fundamentos',
      generatedAt: new Date(0).toISOString(),
      summary: { dueReviews: 0, reinforcements: 0, notes: 0, averageMastery: null, activeSkills: 0 },
      reviews: [], notes: [], skillGaps: [], recentItems: [], reinforcements: [],
    };
    const savedEntry = {
      id: '2f36b5d7-a34a-413a-9b61-6aad4dca32e2',
      skillKey: 'primer-concepto',
      concept: 'primer concepto',
      mentalModel: 'Una secuencia de pasos observables.',
      pattern: '',
      ownExample: '',
      personalMistake: '',
      updatedAt: new Date(1).toISOString(),
    };
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(new Response(JSON.stringify(emptySnapshot), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(savedEntry), { status: 200, headers: { 'content-type': 'application/json' } }));

    render(
      <LearningCenter
        course={FUNDAMENTOS_COURSE}
        profile={createEmptyLearningProfile(0)}
        onClose={vi.fn()}
        onRateReview={vi.fn(async () => undefined)}
        onSaveNotebook={vi.fn(async () => undefined)}
        onCompleteExam={vi.fn(async () => undefined)}
        onReviewReinforcement={vi.fn(async () => undefined)}
        onSummaryChange={onSummaryChange}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Resumen de aprendizaje').textContent).toContain('0 notas propias'));
    fireEvent.click(screen.getByRole('button', { name: /^Cuaderno$/ }));
    fireEvent.change(screen.getByLabelText('Modelo mental'), { target: { value: savedEntry.mentalModel } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));

    await waitFor(() => expect(screen.getByLabelText('Resumen de aprendizaje').textContent).toContain('1 nota propia'));
    expect(screen.getByRole('button', { name: 'Guardado' })).toBeTruthy();
    expect(onSummaryChange).toHaveBeenLastCalledWith(expect.objectContaining({ notes: 1 }));
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('conserva el borrador y permite reintentar si el guardado remoto falla', async () => {
    const emptySnapshot = {
      courseSlug: 'fundamentos',
      generatedAt: new Date(0).toISOString(),
      summary: { dueReviews: 0, reinforcements: 0, notes: 0, averageMastery: null, activeSkills: 0 },
      reviews: [], notes: [], skillGaps: [], recentItems: [], reinforcements: [],
    };
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(new Response(JSON.stringify(emptySnapshot), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Base de datos no disponible' }), { status: 503, headers: { 'content-type': 'application/json' } }));

    render(
      <LearningCenter
        course={FUNDAMENTOS_COURSE}
        profile={createEmptyLearningProfile(0)}
        onClose={vi.fn()}
        onRateReview={vi.fn(async () => undefined)}
        onSaveNotebook={vi.fn(async () => undefined)}
        onCompleteExam={vi.fn(async () => undefined)}
        onReviewReinforcement={vi.fn(async () => undefined)}
      />,
    );

    await waitFor(() => expect(screen.getByText('Progreso sincronizado')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /^Cuaderno$/ }));
    const mentalModel = screen.getByLabelText('Modelo mental') as HTMLTextAreaElement;
    fireEvent.change(mentalModel, { target: { value: 'Este borrador no debe desaparecer.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo guardar');
    expect(mentalModel.value).toBe('Este borrador no debe desaparecer.');
    expect(screen.getByRole('button', { name: 'Reintentar guardado' })).toBeTruthy();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('congela el borrador mientras el backend confirma exactamente esa versión', async () => {
    const emptySnapshot = {
      courseSlug: 'fundamentos',
      generatedAt: new Date(0).toISOString(),
      summary: { dueReviews: 0, reinforcements: 0, notes: 0, averageMastery: null, activeSkills: 0 },
      reviews: [], notes: [], skillGaps: [], recentItems: [], reinforcements: [],
    };
    let finishSave!: (response: Response) => void;
    const pendingSave = new Promise<Response>((resolve) => { finishSave = resolve; });
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(new Response(JSON.stringify(emptySnapshot), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockReturnValueOnce(pendingSave);

    render(
      <LearningCenter
        course={FUNDAMENTOS_COURSE}
        profile={createEmptyLearningProfile(0)}
        onClose={vi.fn()}
        onRateReview={vi.fn(async () => undefined)}
        onSaveNotebook={vi.fn(async () => undefined)}
        onCompleteExam={vi.fn(async () => undefined)}
        onReviewReinforcement={vi.fn(async () => undefined)}
      />,
    );

    await waitFor(() => expect(screen.getByText('Progreso sincronizado')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /^Cuaderno$/ }));
    fireEvent.change(screen.getByLabelText('Modelo mental'), { target: { value: 'Versión que se está guardando.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));

    expect((screen.getByLabelText('Concepto') as HTMLSelectElement).disabled).toBe(true);
    screen.getAllByRole('textbox').forEach((field) => expect((field as HTMLTextAreaElement).disabled).toBe(true));

    finishSave(new Response(JSON.stringify({
      id: 'saved-1', skillKey: 'primer-concepto', concept: 'primer concepto',
      mentalModel: 'Versión que se está guardando.', pattern: '', ownExample: '', personalMistake: '',
      updatedAt: new Date(1).toISOString(),
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    expect(await screen.findByRole('button', { name: 'Guardado' })).toBeTruthy();
  });

  it('no deja que una lectura anterior borre una nota confirmada después', async () => {
    const staleSnapshot = {
      courseSlug: 'fundamentos',
      generatedAt: new Date(0).toISOString(),
      summary: { dueReviews: 0, reinforcements: 0, notes: 0, averageMastery: null, activeSkills: 0 },
      reviews: [], notes: [], skillGaps: [], recentItems: [], reinforcements: [],
    };
    let finishInitialRead!: (response: Response) => void;
    const pendingInitialRead = new Promise<Response>((resolve) => { finishInitialRead = resolve; });
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockReturnValueOnce(pendingInitialRead)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'saved-race', skillKey: 'primer-concepto', concept: 'primer concepto',
        mentalModel: 'Confirmada después de iniciar la lectura.', pattern: '', ownExample: '', personalMistake: '',
        updatedAt: new Date(2).toISOString(),
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    render(
      <LearningCenter
        course={FUNDAMENTOS_COURSE}
        profile={createEmptyLearningProfile(0)}
        onClose={vi.fn()}
        onRateReview={vi.fn(async () => undefined)}
        onSaveNotebook={vi.fn(async () => undefined)}
        onCompleteExam={vi.fn(async () => undefined)}
        onReviewReinforcement={vi.fn(async () => undefined)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Cuaderno$/ }));
    fireEvent.change(screen.getByLabelText('Modelo mental'), { target: { value: 'Confirmada después de iniciar la lectura.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    await waitFor(() => expect(screen.getByLabelText('Resumen de aprendizaje').textContent).toContain('1 nota propia'));

    finishInitialRead(new Response(JSON.stringify(staleSnapshot), { status: 200, headers: { 'content-type': 'application/json' } }));
    await waitFor(() => expect(screen.getByText('Progreso sincronizado')).toBeTruthy());
    expect(screen.getByLabelText('Resumen de aprendizaje').textContent).toContain('1 nota propia');
    expect((screen.getByLabelText('Modelo mental') as HTMLTextAreaElement).value).toBe('Confirmada después de iniciar la lectura.');
  });

  it('deja de superponer una nota local cuando el servidor entrega una versión más nueva', async () => {
    const reinforcement = {
      id: 'remote-reinforcement', itemKey: 'fundamentos-07', skillKey: 'return-values',
      note: 'Distingue mostrar un dato de devolverlo.', evidence: 'El mismo error apareció en tres intentos.',
      occurrences: 3, reviewedAt: null, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
    };
    const savedEntry = {
      id: 'saved-a', skillKey: 'primer-concepto', concept: 'primer concepto',
      mentalModel: 'Versión A confirmada aquí.', pattern: '', ownExample: '', personalMistake: '',
      updatedAt: new Date(1).toISOString(),
    };
    const newerEntry = {
      ...savedEntry,
      id: 'saved-b',
      mentalModel: 'Versión B más nueva del servidor.',
      updatedAt: new Date(2).toISOString(),
    };
    const initialSnapshot = {
      courseSlug: 'fundamentos', generatedAt: new Date(0).toISOString(),
      summary: { dueReviews: 0, reinforcements: 1, notes: 0, averageMastery: null, activeSkills: 1 },
      reviews: [], notes: [], skillGaps: [], recentItems: [], reinforcements: [reinforcement],
    };
    const newerSnapshot = {
      ...initialSnapshot,
      generatedAt: new Date(3).toISOString(),
      summary: { ...initialSnapshot.summary, reinforcements: 0, notes: 1 },
      notes: [newerEntry],
      reinforcements: [{ ...reinforcement, reviewedAt: new Date(3).toISOString() }],
    };
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(new Response(JSON.stringify(initialSnapshot), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(savedEntry), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ reviewedAt: new Date(3).toISOString() }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(newerSnapshot), { status: 200, headers: { 'content-type': 'application/json' } }));

    render(
      <LearningCenter
        course={FUNDAMENTOS_COURSE}
        profile={createEmptyLearningProfile(0)}
        onClose={vi.fn()}
        onRateReview={vi.fn(async () => undefined)}
        onSaveNotebook={vi.fn(async () => undefined)}
        onCompleteExam={vi.fn(async () => undefined)}
        onReviewReinforcement={vi.fn(async () => undefined)}
      />,
    );

    await waitFor(() => expect(screen.getByText('Progreso sincronizado')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /^Cuaderno$/ }));
    fireEvent.change(screen.getByLabelText('Modelo mental'), { target: { value: savedEntry.mentalModel } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    expect(await screen.findByRole('button', { name: 'Guardado' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Repaso$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Marcar return values como repasado' }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(4));
    fireEvent.click(screen.getByRole('button', { name: /^Cuaderno$/ }));

    await waitFor(() => expect((screen.getByLabelText('Modelo mental') as HTMLTextAreaElement).value).toBe(newerEntry.mentalModel));
  });
});
