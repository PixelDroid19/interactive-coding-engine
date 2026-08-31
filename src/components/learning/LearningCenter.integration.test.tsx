// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FUNDAMENTOS_COURSE } from '../../curriculum/fundamentos/course';
import { createEmptyLearningProfile } from '../../learning/mastery';
import type { LearningProfile } from '../../learning/types';
import { LearningCenter } from './LearningCenter';

const auth = vi.hoisted(() => ({ useAuthSession: vi.fn() }));

vi.mock('../../auth/AuthSessionProvider', () => ({
  useAuthSession: auth.useAuthSession,
}));

const STUDENT_AUTH = {
  status: 'ready' as const,
  session: {
    authenticated: true as const,
    user: {
      id: 'student-1',
      email: 'alumna@example.com',
      displayName: 'Alumna',
      roles: ['student'],
    },
    csrfToken: 'csrf-token-de-alumna-seguro',
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

const emptySnapshot = {
  courseSlug: 'fundamentos',
  generatedAt: new Date(0).toISOString(),
  summary: {
    dueReviews: 0,
    reinforcements: 0,
    notes: 0,
    averageMastery: null,
    activeSkills: 0,
  },
  reviews: [],
  notes: [],
  skillGaps: [],
  recentItems: [],
  reinforcements: [],
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
  return render(<LearningCenter course={FUNDAMENTOS_COURSE} profile={profile} onClose={vi.fn()} />);
}

function snapshotWithReview(id: string, prompt: string) {
  return {
    ...emptySnapshot,
    summary: { ...emptySnapshot.summary, dueReviews: 1, activeSkills: 1 },
    reviews: [
      {
        id,
        itemKey: 'fundamentos-07',
        skillKey: 'return-values',
        prompt,
        intervalIndex: 0,
        dueAt: new Date(0).toISOString(),
        lastReviewedAt: null,
        repetitions: 0,
      },
    ],
  };
}

function snapshotWithReinforcement(id: string, note: string) {
  return {
    ...emptySnapshot,
    summary: { ...emptySnapshot.summary, reinforcements: 1, activeSkills: 1 },
    reinforcements: [
      {
        id,
        itemKey: 'fundamentos-07',
        skillKey: 'return-values',
        note,
        evidence: 'Se observó la misma confusión en varias respuestas.',
        occurrences: 3,
        reviewedAt: null,
        createdAt: new Date(1).toISOString(),
        updatedAt: new Date(2).toISOString(),
      },
    ],
  };
}

function snapshotWithSkill() {
  return {
    ...emptySnapshot,
    summary: { ...emptySnapshot.summary, activeSkills: 1 },
    skillGaps: [
      {
        skillKey: 'return-values',
        capability: 'explain',
        score: 0.4,
        attempts: 1,
        successes: 0,
        lastResult: 'partial',
        lastPracticedAt: new Date(1).toISOString(),
      },
    ],
  };
}

function studentAuth(userId: string) {
  return {
    ...STUDENT_AUTH,
    session: {
      ...STUDENT_AUTH.session,
      user: {
        ...STUDENT_AUTH.session.user,
        id: userId,
        email: `${userId}@example.com`,
        displayName: userId,
      },
    },
  };
}

describe('LearningCenter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    auth.useAuthSession.mockReturnValue(STUDENT_AUTH);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(emptySnapshot), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('solo ofrece Repaso y Mis notas a una alumna autenticada, con teclado', async () => {
    renderCenter();

    await screen.findByText('Progreso sincronizado');
    const tablist = screen.getByRole('tablist', {
      name: 'Secciones de aprendizaje',
    });
    expect(tablist).toBeTruthy();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Repaso', 'Mis notas']);
    expect(screen.queryByRole('tab', { name: 'Examen' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Líder' })).toBeNull();

    const review = screen.getByRole('tab', { name: 'Repaso' });
    fireEvent.keyDown(review, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Mis notas' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Mis notas' }), {
      key: 'Enter',
    });
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
    expect(screen.getByRole('heading', { name: 'Anota lo que te resulte útil' })).toBeTruthy();
    expect(screen.getByText('Cuando guardes una nota aparecerá aquí. No necesitas completar una plantilla.')).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('deriva los conceptos por reforzar de eventos remotos reales sin mostrar ayuda en vivo inerte', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...emptySnapshot,
          summary: {
            ...emptySnapshot.summary,
            reinforcements: 1,
            activeSkills: 1,
          },
          reinforcements: [
            {
              id: 'reinforcement-1',
              itemKey: 'fundamentos-07',
              skillKey: 'return-values',
              note: 'Distingue mostrar un dato de devolverlo.',
              evidence: 'El mismo error apareció tres veces.',
              occurrences: 3,
              reviewedAt: null,
              createdAt: new Date(1).toISOString(),
              updatedAt: new Date(2).toISOString(),
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

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

    expect(
      await screen.findByRole('heading', {
        name: 'Inicia sesión para ver tu aprendizaje',
      }),
    ).toBeTruthy();
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

    expect(
      await screen.findByRole('heading', {
        name: 'Esta cuenta no tiene acceso de alumno',
      }),
    ).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('purga la caché heredada sin dueño antes de pintar datos personales', async () => {
    const actorId = '30000000-0000-4000-8000-000000000003';
    const legacyKey = `aula_learning_center_cache_v1:${actorId}:fundamentos`;
    localStorage.setItem('aula_anonymous_actor_v1', actorId);
    localStorage.setItem(
      legacyKey,
      JSON.stringify({
        cachedAt: Date.now(),
        snapshot: snapshotWithReview('legacy-review', 'Respuesta heredada de otra persona'),
      }),
    );

    renderCenter();

    expect(screen.queryByText('Respuesta heredada de otra persona')).toBeNull();
    await waitFor(() => expect(localStorage.getItem(legacyKey)).toBeNull());
  });

  it('separa dos alumnas consecutivas, aborta la lectura anterior e ignora su respuesta tardía', async () => {
    let resolveFirst!: (response: Response) => void;
    let resolveSecond!: (response: Response) => void;
    const firstRequest = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const secondRequest = new Promise<Response>((resolve) => {
      resolveSecond = resolve;
    });
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockReset().mockReturnValueOnce(firstRequest).mockReturnValueOnce(secondRequest);

    auth.useAuthSession.mockReturnValue(studentAuth('student-a'));
    const view = renderCenter();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    auth.useAuthSession.mockReturnValue(studentAuth('student-b'));
    view.rerender(<LearningCenter course={FUNDAMENTOS_COURSE} profile={createEmptyLearningProfile(0)} onClose={vi.fn()} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect((fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal).aborted).toBe(true);

    resolveSecond(
      new Response(JSON.stringify(snapshotWithReview('review-b', 'Respuesta privada de B')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(await screen.findByText('Respuesta privada de B')).toBeTruthy();

    resolveFirst(
      new Response(JSON.stringify(snapshotWithReview('review-a', 'Respuesta privada de A')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await waitFor(() => expect(screen.queryByText('Respuesta privada de A')).toBeNull());
    expect(screen.getByText('Respuesta privada de B')).toBeTruthy();
    expect(localStorage.getItem('aula_learning_center_cache_v2:student-a:fundamentos')).toBeNull();
  });

  it('usa el snapshot remoto como fuente canónica y no resucita una tarjeta local ausente', async () => {
    const profile = profileWithSkill();
    profile.reviews.push({
      id: 'local-review',
      courseId: FUNDAMENTOS_COURSE.id,
      itemId: 'fundamentos-07',
      skillId: 'return-values',
      prompt: 'Tarjeta local que el servidor ya retiró',
      intervalIndex: 0,
      dueAt: 0,
      lastReviewedAt: 0,
      repetitions: 0,
    });

    renderCenter(profile);

    await screen.findByText('Progreso sincronizado');
    expect(screen.queryByText('Tarjeta local que el servidor ya retiró')).toBeNull();
    expect(screen.getByText('Aún no tienes actividad para repasar.')).toBeTruthy();
  });

  it('guarda una nota libre, conserva el borrador y permite reintentar ante un error remoto', async () => {
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(snapshotWithSkill()), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Base de datos no disponible' } }), { status: 503, headers: { 'content-type': 'application/json' } }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'saved-after-retry',
            title: 'Valores de retorno',
            body: 'Un valor debe salir de la función para reutilizarlo.',
            itemKey: null,
            updatedAt: new Date(3).toISOString(),
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(snapshotWithSkill()), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    renderCenter(profileWithSkill());

    await screen.findByText('Progreso sincronizado');
    fireEvent.click(screen.getByRole('tab', { name: 'Mis notas' }));
    const note = screen.getByLabelText('Nota') as HTMLTextAreaElement;
    fireEvent.change(screen.getByLabelText('Título de la nota'), { target: { value: 'Valores de retorno' } });
    fireEvent.change(note, {
      target: { value: 'Un valor debe salir de la función para reutilizarlo.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo guardar');
    expect(note.value).toBe('Un valor debe salir de la función para reutilizarlo.');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(await screen.findByRole('heading', { name: 'Valores de retorno' })).toBeTruthy();
    expect(note.value).toBe('');
    const createCall = vi.mocked(globalThis.fetch).mock.calls[2];
    expect(String(createCall?.[0])).toContain('/v1/me/notebook');
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      courseSlug: 'fundamentos',
      title: 'Valores de retorno',
      body: 'Un valor debe salir de la función para reutilizarlo.',
    });
  });

  it('mantiene la nota confirmada si una lectura anterior llega después del guardado', async () => {
    let finishInitialRead!: (response: Response) => void;
    const pendingInitialRead = new Promise<Response>((resolve) => {
      finishInitialRead = resolve;
    });
    const savedEntry = {
      id: 'saved-race',
      title: 'Lectura pendiente',
      body: 'Confirmada después de iniciar la lectura.',
      itemKey: null,
      updatedAt: new Date(2).toISOString(),
    };
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockReturnValueOnce(pendingInitialRead)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(savedEntry), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(emptySnapshot), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    localStorage.setItem(
      'aula_learning_center_cache_v2:student-1:fundamentos',
      JSON.stringify({
        cachedAt: 0,
        snapshot: snapshotWithSkill(),
      }),
    );

    renderCenter(profileWithSkill());

    fireEvent.click(screen.getByRole('tab', { name: 'Mis notas' }));
    fireEvent.change(await screen.findByLabelText('Nota'), {
      target: { value: savedEntry.body },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    await screen.findByText(savedEntry.body);

    finishInitialRead(
      new Response(JSON.stringify(emptySnapshot), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await screen.findByText('Progreso sincronizado');
    expect(screen.getByText(savedEntry.body)).toBeTruthy();
  });

  it('muestra de inmediato una caché fresca y la revalida al abrir sin llamarla sincronizada si falla', async () => {
    const savedEntry = {
      id: 'saved-cache',
      title: 'Nota disponible',
      body: 'La nota sigue disponible al reabrir.',
      itemKey: null,
      updatedAt: new Date(4).toISOString(),
    };
    const freshSnapshot = {
      ...snapshotWithSkill(),
      summary: { ...snapshotWithSkill().summary, notes: 1 },
      notes: [savedEntry],
    };
    let resolveRevalidation!: (response: Response) => void;
    const pendingRevalidation = new Promise<Response>((resolve) => {
      resolveRevalidation = resolve;
    });
    const cacheKey = 'aula_learning_center_cache_v2:student-1:fundamentos';
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ cachedAt: Date.now(), snapshot: freshSnapshot }),
    );
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockReset().mockReturnValueOnce(pendingRevalidation);

    renderCenter(profileWithSkill());
    fireEvent.click(screen.getByRole('tab', { name: 'Mis notas' }));
    expect(screen.getByText(savedEntry.body)).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/v1/me/learning-center?courseSlug=fundamentos');
    expect(screen.queryByText('Progreso sincronizado')).toBeNull();

    resolveRevalidation(
      new Response(JSON.stringify({ error: { message: 'Sin conexión' } }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(await screen.findByText('Mostrando la última copia disponible')).toBeTruthy();
    expect(screen.getByText(savedEntry.body)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(cacheKey) ?? 'null').snapshot.notes).toEqual([savedEntry]);
    expect(screen.queryByText('Progreso sincronizado')).toBeNull();
  });

  it('conserva una calificación confirmada en la caché fresca aunque falle el refresco posterior', async () => {
    const cacheKey = 'aula_learning_center_cache_v2:student-1:fundamentos';
    const prompt = 'Explica el valor que devuelve una función.';
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ cachedAt: Date.now(), snapshot: snapshotWithReview('review-cache', prompt) }),
    );
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(snapshotWithReview('review-cache', prompt)), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Sin conexión' } }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(emptySnapshot), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const view = renderCenter();
    await screen.findByText('Progreso sincronizado');
    fireEvent.change(screen.getByLabelText('Responde sin abrir la lección'), {
      target: { value: 'Una función devuelve un valor para usarlo fuera de ella.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comparar mi respuesta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lo expliqué' }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3));
    expect(await screen.findByText('Mostrando la última copia disponible')).toBeTruthy();
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
    expect(cached.snapshot.reviews).toEqual([]);
    expect(cached.snapshot.summary.dueReviews).toBe(0);

    view.unmount();
    renderCenter();
    await screen.findByText('Progreso sincronizado');

    expect(screen.queryByText(prompt)).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledTimes(4);
  });

  it('conserva un refuerzo confirmado en la caché fresca aunque falle el refresco posterior', async () => {
    const cacheKey = 'aula_learning_center_cache_v2:student-1:fundamentos';
    const note = 'Repasa cuándo devolver un dato al resto del programa.';
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ cachedAt: Date.now(), snapshot: snapshotWithReinforcement('reinforcement-cache', note) }),
    );
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(snapshotWithReinforcement('reinforcement-cache', note)), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Sin conexión' } }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(emptySnapshot), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const view = renderCenter();
    await screen.findByRole('heading', { name: 'Conceptos para reforzar' });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar return values como repasado' }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3));
    expect(await screen.findByText('Mostrando la última copia disponible')).toBeTruthy();
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
    expect(cached.snapshot.reinforcements).toEqual([]);
    expect(cached.snapshot.summary.reinforcements).toBe(0);

    view.unmount();
    renderCenter();
    await screen.findByText('Progreso sincronizado');

    expect(screen.queryByRole('heading', { name: 'Conceptos para reforzar' })).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledTimes(4);
  });

  it('cancela un refresco posterior a una mutación cuando cambia de A a B y no restaura la caché de A', async () => {
    let resolveRefresh!: (response: Response) => void;
    const pendingRefresh = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const aCacheKey = 'aula_learning_center_cache_v2:student-a:fundamentos';
    localStorage.setItem(
      aCacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        snapshot: snapshotWithReview('review-a', 'Respuesta de A que ya fue calificada'),
      }),
    );
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(snapshotWithReview('review-a', 'Respuesta de A que ya fue calificada')), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockReturnValueOnce(pendingRefresh)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(emptySnapshot), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    auth.useAuthSession.mockReturnValue(studentAuth('student-a'));
    const view = renderCenter();
    await screen.findByText('Progreso sincronizado');
    fireEvent.change(screen.getByLabelText('Responde sin abrir la lección'), {
      target: { value: 'Una función devuelve un valor para usarlo fuera de ella.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comparar mi respuesta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lo expliqué' }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3));
    const cachedAfterRating = JSON.parse(localStorage.getItem(aCacheKey) ?? 'null');
    expect(cachedAfterRating.snapshot.reviews).toEqual([]);
    expect(cachedAfterRating.snapshot.summary.dueReviews).toBe(0);

    auth.useAuthSession.mockReturnValue(studentAuth('student-b'));
    view.rerender(<LearningCenter course={FUNDAMENTOS_COURSE} profile={createEmptyLearningProfile(0)} onClose={vi.fn()} />);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(4));
    expect((vi.mocked(globalThis.fetch).mock.calls[2]?.[1]?.signal as AbortSignal | undefined)?.aborted).toBe(true);

    localStorage.removeItem(aCacheKey);
    resolveRefresh(
      new Response(JSON.stringify(snapshotWithReview('review-a', 'Respuesta de A que ya fue calificada')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await waitFor(() => expect(localStorage.getItem(aCacheKey)).toBeNull());
    expect(screen.queryByText('Respuesta de A que ya fue calificada')).toBeNull();
  });

  it('no vuelve a escribir la caché de una alumna al resolver un refresco pendiente después de logout', async () => {
    let resolveRefresh!: (response: Response) => void;
    const pendingRefresh = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const aCacheKey = 'aula_learning_center_cache_v2:student-a:fundamentos';
    localStorage.setItem(
      aCacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        snapshot: snapshotWithReview('review-a', 'Respuesta de A antes de logout'),
      }),
    );
    vi.mocked(globalThis.fetch)
      .mockReset()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(snapshotWithReview('review-a', 'Respuesta de A antes de logout')), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockReturnValueOnce(pendingRefresh);

    auth.useAuthSession.mockReturnValue(studentAuth('student-a'));
    const view = renderCenter();
    await screen.findByText('Progreso sincronizado');
    fireEvent.change(screen.getByLabelText('Responde sin abrir la lección'), {
      target: { value: 'Una función devuelve un valor para usarlo fuera de ella.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comparar mi respuesta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lo expliqué' }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3));

    auth.useAuthSession.mockReturnValue({
      ...STUDENT_AUTH,
      session: { authenticated: false, providers: ['google'] },
    });
    view.rerender(<LearningCenter course={FUNDAMENTOS_COURSE} profile={createEmptyLearningProfile(0)} onClose={vi.fn()} />);
    expect((vi.mocked(globalThis.fetch).mock.calls[2]?.[1]?.signal as AbortSignal | undefined)?.aborted).toBe(true);

    localStorage.removeItem(aCacheKey);
    resolveRefresh(
      new Response(JSON.stringify(snapshotWithReview('review-a', 'Respuesta de A antes de logout')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await waitFor(() => expect(localStorage.getItem(aCacheKey)).toBeNull());
    expect(screen.queryByText('Respuesta de A antes de logout')).toBeNull();
  });
});
