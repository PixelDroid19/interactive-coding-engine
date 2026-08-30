import { generateSnapshots } from '../engine/eventLog';
import type { ScrimLessonData, WorkspaceSnapshot } from '../types/scrim';
import { LEARNING_API_URL } from './learningHttp';

const API_URL = LEARNING_API_URL;

type RemoteLesson = Readonly<{
  key: string;
  contentHash: string;
  scrim: Omit<ScrimLessonData, 'snapshots'>;
  snapshotIntervalMs: number;
  audio: Readonly<{ url: string; durationMs: number }> | null;
}>;

export class PublishedLessonError extends Error {
  constructor(readonly status: number, readonly code: string | undefined, message: string) {
    super(message);
    this.name = 'PublishedLessonError';
  }
}

function isWorkspace(value: unknown): value is WorkspaceSnapshot {
  return Boolean(value && typeof value === 'object' && 'files' in value && 'activeFilePath' in value);
}

function parseRemoteLesson(value: unknown, expectedId: string): RemoteLesson {
  if (!value || typeof value !== 'object') throw new Error('El backend devolvió una lección vacía.');
  const candidate = value as Partial<RemoteLesson>;
  if (candidate.key !== expectedId || !candidate.scrim || candidate.scrim.id !== expectedId) {
    throw new Error('El backend devolvió otra lección.');
  }
  if (!Array.isArray(candidate.scrim.events) || !isWorkspace(candidate.scrim.initialWorkspace)) {
    throw new Error('La cinta remota no contiene workspace y eventos válidos.');
  }
  if (!Number.isInteger(candidate.snapshotIntervalMs) || Number(candidate.snapshotIntervalMs) < 1000) {
    throw new Error('El intervalo de snapshots remoto no es válido.');
  }
  if (candidate.audio && (!URL.canParse(candidate.audio.url) || !Number.isInteger(candidate.audio.durationMs))) {
    throw new Error('La referencia de audio remota no es válida.');
  }
  return candidate as RemoteLesson;
}

export async function fetchPublishedLesson(lessonId: string, signal?: AbortSignal): Promise<ScrimLessonData> {
  const response = await fetch(`${API_URL}/v1/lessons/${encodeURIComponent(lessonId)}`, {
    headers: { accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    let code: string | undefined;
    let message = `No se pudo cargar la revisión publicada (HTTP ${response.status}).`;
    try {
      const payload = await response.json() as { error?: { code?: string; message?: string } };
      code = payload.error?.code;
      if (payload.error?.message) message = payload.error.message;
    } catch {
      // Los proxies intermedios pueden devolver una respuesta sin JSON.
    }
    throw new PublishedLessonError(response.status, code, message);
  }
  const remote = parseRemoteLesson(await response.json(), lessonId);
  const durationMs = remote.audio?.durationMs ?? remote.scrim.durationMs;
  return {
    ...remote.scrim,
    durationMs,
    snapshots: generateSnapshots(remote.scrim.initialWorkspace, remote.scrim.events, remote.snapshotIntervalMs),
    audioTrack: remote.scrim.audioTrack
      ? { ...remote.scrim.audioTrack, url: remote.audio?.url ?? remote.scrim.audioTrack.url, durationMs }
      : remote.audio
        ? { url: remote.audio.url, durationMs, narrationScript: [] }
        : undefined,
  } as ScrimLessonData;
}
