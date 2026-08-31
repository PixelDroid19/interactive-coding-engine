// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FUNDAMENTOS_COURSE } from '../../curriculum/fundamentos/course';
import { createEmptyLearningProfile } from '../../learning/mastery';
import type { LearningProfile } from '../../learning/types';
import { LearningCenter } from './LearningCenter';

const auth = vi.hoisted(() => ({ useAuthSession: vi.fn() }));

vi.mock('../../auth/AuthSessionProvider', () => ({ useAuthSession: auth.useAuthSession }));

const STUDENT_AUTH = {
  status: 'ready' as const,
  session: {
    authenticated: true as const,
    user: { id: 'student-1', email: 'alumna@example.com', displayName: 'Alumna', roles: ['student'] },
    csrfToken: 'csrf-token-de-alumna-seguro',
  },
  error: null,
  busy: false,
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  verification: { open: false, emailHint: '', deliveryFailed: false, error: null, busy: false, resendReadyAt: 0 },
  verifyEmail: vi.fn(),
  resendCode: vi.fn(),
  dismissVerification: vi.fn(),
};

const emptySnapshot = {
  courseSlug: 'fundamentos',
  generatedAt: new Date(0).toISOString(),
  summary: { dueReviews: 0, reinforcements: 0, notes: 0, averageMastery: null, activeSkills: 0 },
  reviews: [], notes: [], skillGaps: [], recentItems: [], reinforcements: [],
};

function profileWithSkill(skillId = 'return-values'): LearningProfile {
  const profile = createEmptyLearningProfile(0);
  profile.evidence.push({
    id: `evidence:${skillId}`,
    courseId: FUNDAMENTOS_COURSE.id,
    itemId: 'fundamentos-07',
    skillId,
    capability: 'explain',
    result: 'partial',
    source: 'challenge',
    timestamp: 1,
  });
  return profile;
}

function renderCenter(profile = createEmptyLearningProfile(0)) {
  return render(
    <LearningCenter
      course={FUNDAMENTOS_COURSE}
      profile={profile}
      onClose={vi.fn()}
      onRateReview={vi.fn(async () => undefined)}
      onSaveNotebook={vi.fn(async () => undefined)}
      onReviewReinforcement={vi.fn(async () => undefined)}
    />,
  );
}

describe('LearningCenter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    auth.useAuthSession.mockReturnValue(STUDENT_AUTH);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(emptySnapshot), {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('solo ofrece Repaso, Mis notas y Mi ruta a una alumna autenticada, con teclado', async () => {
    renderCenter();

    await screen.findByText('Progreso sincronizado');
    const tablist = screen.getByRole('tablist', { name: 'Secciones de aprendizaje' });
    expect(tablist).toBeTruthy();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Repaso', 'Mis notas', 'Mi ruta']);
    expect(screen.queryByRole('tab', { name: 'Examen' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Líder' })).toBeNull();

    const review = screen.getByRole('tab', { name: 'Repaso' });
    fireEvent.keyDown(review, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Mis notas' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Mis notas' }), { key: 'Enter' });
    expect(screen.getByRole('tab', { name: 'Mis notas' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Mis notas' })).toBeTruthy();
  });

  it('no muestra evaluaciones inventadas ni las deriva de las etiquetas del curso', async () => {
    renderCenter();

    await screen.findByText('Progreso sincronizado');
    expect(screen.queryByRole('heading', { name: 'Sin evaluación asignada' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Evaluar respuestas' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Examen mixto' })).toBeNull();
  });

  it('muestra estados vacíos de repaso y notas sin crear un concepto de relleno', async () => {
    renderCenter();

    await screen.findByText('Progreso sincronizado');
    expect(screen.getByText('Aún no tienes actividad para repasar.')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Mis notas' }));
    expect(screen.getByRole('heading', { name: 'Aún no hay conceptos para anotar' })).toBeTruthy();
    expect(screen.queryByDisplayValue('primer-concepto')).toBeNull();
  });

  it('deriva los conceptos por reforzar de eventos remotos reales sin mostrar ayuda en vivo inerte', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      ...emptySnapshot,
      summary: { ...emptySnapshot.summary, reinforcements: 1, activeSkills: 1 },
      reinforcements: [{
        id: 'reinforcement-1', itemKey: 'fundamentos-07', skillKey: 'return-values',
        note: 'Distingue mostrar un dato de devolverlo.', evidence: 'El mismo error apareció tres veces.',
        occurrences: 3, reviewedAt: null, createdAt: new Date(1).toISOString(), updatedAt: new Date(2).toISOString(),
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    renderCenter();

    expect(await screen.findByRole('heading', { name: 'Conceptos para reforzar' })).toBeTruthy();
    expect(screen.getByText('Distingue mostrar un dato de devolverlo.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Ayuda en vivo' })).toBeNull();
    expect(screen.queryByRole('button', { name: /solicitar ayuda/i })).toBeNull();
  });

  it('pide iniciar sesión sin consultar ni inventar progreso para una persona anónima', async () => {
    const login = vi.fn();
    auth.useAuthSession.mockReturnValue({
      ...STUDENT_AUTH,
      session: { authenticated: false, providers: ['google'] },
      login,
    });

    renderCenter();

    expect(await screen.findByRole('heading', { name: 'Inicia sesión para ver tu aprendizaje' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(login).toHaveBeenCalledWith('google');
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('tablist', { name: 'Secciones de aprendizaje' })).toBeNull();
  });

  it('no expone datos de estudiante a una cuenta autenticada sin el rol alumno', async () => {
    auth.useAuthSession.mockReturnValue({
      ...STUDENT_AUTH,
      session: {
        ...STUDENT_AUTH.session,
        user: { ...STUDENT_AUTH.session.user, roles: ['tutor'] },
      },
    });

    renderCenter();

    expect(await screen.findByRole('heading', { name: 'Esta cuenta no tiene acceso de alumno' })).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('guarda una nota de un concepto observado, conserva el borrador y permite reintentar ante un error remoto', async () => {
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(new Response(JSON.stringify(emptySnapshot), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Base de datos no disponible' } }), { status: 503, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'saved-after-retry', skillKey: 'return-values', concept: 'return values',
        mentalModel: 'Un valor debe salir de la función para reutilizarlo.', pattern: '', ownExample: '', personalMistake: '',
        updatedAt: new Date(3).toISOString(),
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    renderCenter(profileWithSkill());

    await screen.findByText('Progreso sincronizado');
    fireEvent.click(screen.getByRole('tab', { name: 'Mis notas' }));
    const mentalModel = screen.getByLabelText('Modelo mental') as HTMLTextAreaElement;
    fireEvent.change(mentalModel, { target: { value: 'Un valor debe salir de la función para reutilizarlo.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo guardar');
    expect(mentalModel.value).toBe('Un valor debe salir de la función para reutilizarlo.');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar guardado' }));
    expect(await screen.findByRole('button', { name: 'Guardado' })).toBeTruthy();
    expect(mentalModel.value).toBe('Un valor debe salir de la función para reutilizarlo.');
  });

  it('mantiene la nota confirmada si una lectura anterior llega después del guardado', async () => {
    let finishInitialRead!: (response: Response) => void;
    const pendingInitialRead = new Promise<Response>((resolve) => { finishInitialRead = resolve; });
    const savedEntry = {
      id: 'saved-race', skillKey: 'return-values', concept: 'return values',
      mentalModel: 'Confirmada después de iniciar la lectura.', pattern: '', ownExample: '', personalMistake: '',
      updatedAt: new Date(2).toISOString(),
    };
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockReturnValueOnce(pendingInitialRead)
      .mockResolvedValueOnce(new Response(JSON.stringify(savedEntry), { status: 200, headers: { 'content-type': 'application/json' } }));

    renderCenter(profileWithSkill());

    fireEvent.click(screen.getByRole('tab', { name: 'Mis notas' }));
    fireEvent.change(screen.getByLabelText('Modelo mental'), { target: { value: savedEntry.mentalModel } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardado' })).toBeTruthy());

    finishInitialRead(new Response(JSON.stringify(emptySnapshot), { status: 200, headers: { 'content-type': 'application/json' } }));
    await screen.findByText('Progreso sincronizado');
    expect((screen.getByLabelText('Modelo mental') as HTMLTextAreaElement).value).toBe(savedEntry.mentalModel);
  });
});
