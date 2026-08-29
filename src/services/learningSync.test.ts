// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    const progressBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(progressBody).toEqual({ status: 'completed', playbackMs: 2500, score: 90 });
  });

  it('conserva la cola cuando Railway no responde', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const sync = await import('./learningSync');
    sync.queueLearningEvent('open-cells', 'open-cells-01', 'lesson_opened');
    expect(await sync.flushLearningQueue()).toBe(false);
    expect(localStorage.getItem('aula_learning_sync_v1')).toContain('lesson_opened');
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
});
