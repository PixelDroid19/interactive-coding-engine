import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecorderEngine } from './recorderEngine';

const workspace = {
  activeFilePath: 'app.js',
  files: {
    'app.js': {
      name: 'app.js',
      path: 'app.js',
      content: 'console.log("hola")',
      language: 'javascript' as const,
    },
  },
};

describe('RecorderEngine', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('no incluye en la duración el tiempo pausado antes de detener', async () => {
    vi.useFakeTimers();
    const engine = new RecorderEngine(workspace, {
      onStatusChange: () => {},
      onTimeTick: () => {},
      onEventRecorded: () => {},
    });

    await engine.startRecording(false);
    await vi.advanceTimersByTimeAsync(1_000);
    engine.pauseRecording();
    await vi.advanceTimersByTimeAsync(5_000);

    const lesson = await engine.stopRecording();

    expect(lesson.durationMs).toBe(1_000);
  });

  it('deja de emitir tiempo cuando se cancela una grabación', async () => {
    vi.useFakeTimers();
    const onTimeTick = vi.fn();
    const engine = new RecorderEngine(workspace, {
      onStatusChange: () => {},
      onTimeTick,
      onEventRecorded: () => {},
    });

    await engine.startRecording(false);
    await vi.advanceTimersByTimeAsync(300);
    const ticksBeforeCancel = onTimeTick.mock.calls.length;
    const cancelRecording = (engine as RecorderEngine & { cancelRecording?: () => void }).cancelRecording;

    expect(typeof cancelRecording).toBe('function');
    cancelRecording?.call(engine);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(onTimeTick).toHaveBeenCalledTimes(ticksBeforeCancel);
  });
});
