// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile, recordEvidence } from '../learning/mastery';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  vi.resetModules();
  vi.useFakeTimers();
});

describe('learning sync', () => {
  it('sincroniza respuestas sin evaluar como sin calificar, nunca como una nota parcial', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const sync = await import('./learningSync');
    sync.queueExerciseAttempt('fundamentos', 'fundamentos-01', 'challenge', 'partial', { score: 100, response: { readingAnswer: 'No sé' }, diagnostics: { evaluation: 'ungraded', mode: 'self-reflection' } });
    expect(await sync.flushLearningQueue()).toBe(true);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.attempts[0]).toMatchObject({ result: 'ungraded', response: { readingAnswer: 'No sé' } });
    expect(body.attempts[0]).not.toHaveProperty('score');
  });
  it('un error del evaluador conserva el código para revisión sin nota de fracaso', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const sync = await import('./learningSync');
    sync.queueExerciseAttempt('javascript', 'javascript-01-debug', 'debugging', 'failure', { score: 0, response: { files: { 'app.js': 'console.log(' } }, diagnostics: { tests: [{ passed: false, isEvaluationError: true }] } });
    await sync.flushLearningQueue();
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.attempts[0]).toMatchObject({ result: 'ungraded' });
    expect(body.attempts[0]).not.toHaveProperty('score');
  });
  it('agrupa eventos y conserva el progreso más avanzado', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const sync = await import('./learningSync');
    sync.queueLearningEvent('open-cells', 'open-cells-01', 'lesson_opened');
    sync.queueLessonProgress('open-cells', 'open-cells-01', 'in_progress', 1200);
    sync.queueLessonProgress('open-cells', 'open-cells-01', 'completed', 2500, 90);
    expect(await sync.flushLearningQueue()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/v1/courses/open-cells/progress/open-cells-01');
    const progressBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(progressBody).toEqual({ status: 'completed', playbackMs: 2500, score: 90 });
  });

  it('mantiene separado el progreso de una clave repetida en cursos distintos', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const sync = await import('./learningSync');
    sync.queueLessonProgress('course-a', 'shared-practice', 'completed', 0, 90);
    sync.queueLessonProgress('course-b', 'shared-practice', 'in_progress', 700, 35);

    expect(await sync.flushLearningQueue()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(expect.arrayContaining([
      expect.stringContaining('/v1/courses/course-a/progress/shared-practice'),
      expect.stringContaining('/v1/courses/course-b/progress/shared-practice'),
    ]));
  });

  it('conserva la cola cuando Railway no responde', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const sync = await import('./learningSync');
    sync.queueLearningEvent('open-cells', 'open-cells-01', 'lesson_opened');
    expect(await sync.flushLearningQueue()).toBe(false);
    expect(localStorage.getItem('aula_learning_sync_v1')).toContain('lesson_opened');
  });

  it('sigue sincronizando en memoria si Storage está temporalmente bloqueado', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const blockedStorage = vi.spyOn(localStorage, 'setItem')
      .mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    const sync = await import('./learningSync');
    const healthEvents: unknown[] = [];
    const onHealth = (event: Event) => healthEvents.push((event as CustomEvent).detail);
    window.addEventListener('aula-learning-sync', onHealth);

    try {
      expect(() => sync.queueLessonProgress('fundamentos', 'fundamentos-01', 'completed', 4_000)).not.toThrow();
      expect((sync as unknown as { getLearningSyncHealth?: () => unknown }).getLearningSyncHealth?.()).toMatchObject({
        status: 'queued',
        persistence: 'session-only',
        reason: 'storage',
      });
      expect(healthEvents).toContainEqual(expect.objectContaining({
        status: 'queued',
        persistence: 'session-only',
        reason: 'storage',
      }));
      expect(await sync.flushLearningQueue()).toBe(true);
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener('aula-learning-sync', onHealth);
      blockedStorage.mockRestore();
    }
  });

  it('cuarentena una cola malformada y la hace visible antes de continuar con eventos nuevos', async () => {
    localStorage.setItem('aula_learning_sync_v1', '{no-json');
    const sync = await import('./learningSync');
    const healthEvents: unknown[] = [];
    const onHealth = (event: Event) => healthEvents.push((event as CustomEvent).detail);
    window.addEventListener('aula-learning-sync', onHealth);

    try {
      sync.queueLearningEvent('fundamentos', 'fundamentos-01', 'lesson_opened');

      const recoveryKey = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
        .find((key) => key?.startsWith('aula_recovery_v1:aula_learning_sync_v1:'));
      expect(recoveryKey).toBeDefined();
      expect(localStorage.getItem(recoveryKey!)).toContain('{no-json');
      expect((sync as unknown as { getLearningSyncHealth?: () => unknown }).getLearningSyncHealth?.()).toMatchObject({
        status: 'queued',
        persistence: 'durable',
        reason: 'corrupt',
        recoveryKey,
      });
      expect(healthEvents).toContainEqual(expect.objectContaining({
        status: 'queued',
        persistence: 'durable',
        reason: 'corrupt',
        recoveryKey,
      }));
    } finally {
      window.removeEventListener('aula-learning-sync', onHealth);
    }
  });

  it('cancela el resto de la cola al cerrar sesión y no mezcla cuentas', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    const sync = await import('./learningSync');
    sync.queueLearningEvent('fundamentos', 'fundamentos-01', 'lesson_opened');
    sync.queueLessonProgress('fundamentos', 'fundamentos-01', 'completed', 4_000);

    const flushing = sync.flushLearningQueue();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    sync.clearLearningSyncQueue();
    resolveRequest?.(new Response('{}', { status: 202 }));

    expect(await flushing).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(localStorage.getItem('aula_learning_sync_v1')).toBeNull();
  });

  it('limita la sincronización de progreso durante una reproducción continua', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const sync = await import('./learningSync');
    sync.queueLessonProgress('open-cells', 'open-cells-01', 'in_progress', 1000);
    await vi.advanceTimersByTimeAsync(5000);
    sync.queueLessonProgress('open-cells', 'open-cells-01', 'in_progress', 6000);
    await vi.advanceTimersByTimeAsync(9999);
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ status: 'in_progress', playbackMs: 6000 });
  });

  it('migra evidencia local una sola vez y la agrupa por lotes idempotentes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const sync = await import('./learningSync');
    const profile = recordEvidence(createEmptyLearningProfile(0), {
      id: 'checked:local-evidence-01', courseId: 'course-open-cells', itemId: 'open-cells-01',
      skillId: 'scoped-elements', capability: 'debug', result: 'partial', source: 'debugging', timestamp: Date.now(),
    });
    sync.queueLearningProfileEvidence(profile, { 'course-open-cells': 'open-cells' });
    expect(await sync.flushLearningQueue()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.evidence[0]).toMatchObject({
      courseSlug: 'open-cells', itemKey: 'open-cells-01', skillKey: 'scoped-elements', capability: 'debug', result: 'partial',
    });
    expect(body.evidence[0].id).toMatch(/^[0-9a-f-]{36}$/i);

    fetchMock.mockClear();
    sync.queueLearningProfileEvidence(profile, { 'course-open-cells': 'open-cells' });
    expect(await sync.flushLearningQueue()).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('conserva el perfil histórico sin enviar autoevaluaciones como evidencia comprobada', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const sync = await import('./learningSync');
    const profile = createEmptyLearningProfile(Date.now());
    profile.evidence = [
      { id: 'old-completed', courseId: 'course-open-cells', itemId: 'open-cells-01', skillId: 'scoped-elements', capability: 'produce', result: 'success', source: 'challenge', timestamp: Date.now() },
      { id: 'checked:self-rating', courseId: 'course-open-cells', itemId: 'open-cells-01', skillId: 'scoped-elements', capability: 'explain', result: 'success', source: 'review', timestamp: Date.now() },
    ];
    const original = structuredClone(profile);
    sync.queueLearningProfileEvidence(profile, { 'course-open-cells': 'open-cells' });
    expect(await sync.flushLearningQueue()).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(profile).toEqual(original);
  });

  it('retiene la evidencia antigua ya encolada sin transmitirla ni bloquear intentos nuevos', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const oldEvidence = { fingerprint: 'old-completed', id: crypto.randomUUID(), courseSlug: 'open-cells', itemKey: 'open-cells-01', skillKey: 'scoped-elements', capability: 'produce', result: 'success', source: 'challenge', occurredAt: new Date().toISOString() };
    const checkedEvidence = { ...oldEvidence, fingerprint: 'checked:real-attempt', id: crypto.randomUUID() };
    localStorage.setItem('aula_learning_sync_v1', JSON.stringify({ events: [], progress: {}, feedback: [], evidence: [oldEvidence, checkedEvidence], attempts: [], syncedEvidence: [] }));
    const sync = await import('./learningSync');
    expect(await sync.flushLearningQueue()).toBe(true);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.evidence).toHaveLength(1);
    expect(body.evidence[0].id).toBe(checkedEvidence.id);
    expect(JSON.parse(localStorage.getItem('aula_learning_sync_v1')!)).toMatchObject({ evidence: [], unverifiedEvidence: [oldEvidence], syncedEvidence: [checkedEvidence.fingerprint] });
    vi.resetModules();
    fetchMock.mockClear();
    const reloaded = await import('./learningSync');
    reloaded.queueLearningEvent('open-cells', 'open-cells-01', 'lesson_opened');
    await reloaded.flushLearningQueue();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('aula_learning_sync_v1')!).unverifiedEvidence).toEqual([oldEvidence]);
  });

  it('conserva el archivo histórico si falla el guardado y lo persiste al recuperar Storage', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const oldEvidence = { fingerprint: 'old-review', id: crypto.randomUUID(), courseSlug: 'open-cells', itemKey: 'open-cells-01', skillKey: 'scoped-elements', capability: 'explain', result: 'success', source: 'review', occurredAt: new Date().toISOString() };
    localStorage.setItem('aula_learning_sync_v1', JSON.stringify({ events: [], progress: {}, feedback: [], evidence: [oldEvidence] }));
    const sync = await import('./learningSync');
    const blocked = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    await sync.flushLearningQueue();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sync.getLearningSyncHealth()).toMatchObject({ status: 'queued', persistence: 'session-only' });
    blocked.mockRestore();
    sync.queueLearningEvent('open-cells', 'open-cells-01', 'lesson_opened');
    await sync.flushLearningQueue();
    expect(JSON.parse(localStorage.getItem('aula_learning_sync_v1')!)).toMatchObject({ evidence: [], unverifiedEvidence: [oldEvidence] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sincroniza la respuesta y los diagnósticos de un intento real', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }));
    const sync = await import('./learningSync');
    sync.queueExerciseAttempt('fundamentos', 'fundamentos-02-debug', 'debugging', 'failure', {
      score: 40,
      response: { files: { 'app.js': 'console.log(valor)' } },
      diagnostics: { failedTests: 2 },
    });

    expect(await sync.flushLearningQueue()).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.attempts[0]).toMatchObject({
      courseSlug: 'fundamentos', itemKey: 'fundamentos-02-debug', kind: 'debugging', result: 'failure', score: 40,
      response: { files: { 'app.js': 'console.log(valor)' } }, diagnostics: { failedTests: 2 },
    });
  });

  it('no descarta intentos mientras espera recuperar la conexión', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const sync = await import('./learningSync');

    for (let index = 0; index < 125; index += 1) {
      sync.queueExerciseAttempt('fundamentos', `fundamentos-${index}`, 'challenge', 'failure', { score: index % 100 });
    }

    const stored = JSON.parse(localStorage.getItem('aula_learning_sync_v1') ?? '{}') as { attempts?: unknown[] };
    expect(stored.attempts).toHaveLength(125);
    expect(await sync.flushLearningQueue()).toBe(false);
    expect(JSON.parse(localStorage.getItem('aula_learning_sync_v1') ?? '{}').attempts).toHaveLength(125);
  });
});
