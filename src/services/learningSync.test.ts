// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile, recordEvidence } from '../learning/mastery';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useFakeTimers();
});

describe('learning sync', () => {
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
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    const sync = await import('./learningSync');

    expect(() => sync.queueLessonProgress('fundamentos', 'fundamentos-01', 'completed', 4_000)).not.toThrow();
    expect(await sync.flushLearningQueue()).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
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
      id: 'local-evidence-01', courseId: 'course-open-cells', itemId: 'open-cells-01',
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
