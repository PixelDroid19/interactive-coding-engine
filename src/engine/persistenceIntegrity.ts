export const PERSISTENCE_RECOVERY_PREFIX = 'aula_recovery_v1';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type PersistenceStatus =
  | Readonly<{ state: 'ready'; key: string }>
  | Readonly<{ state: 'corrupt'; key: string; recoveryKey: string; message: string }>
  | Readonly<{ state: 'write-failed'; key: string; message: string }>
  | Readonly<{ state: 'unavailable'; key: string; operation: 'read' | 'write'; message: string }>;

export type JsonStorageReadResult =
  | Readonly<{ state: 'missing'; key: string }>
  | Readonly<{ state: 'loaded'; key: string; raw: string; value: unknown }>
  | Extract<PersistenceStatus, { state: 'corrupt' | 'unavailable' }>;

const statuses = new Map<string, PersistenceStatus>();
const quarantinedRawValues = new Map<string, string>();
let recoverySequence = 0;

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo acceder al almacenamiento local.';
}

function dispatch(status: PersistenceStatus): void {
  statuses.set(status.key, status);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aula-persistence-integrity', { detail: status }));
  }
}

function recoveryKeyFor(key: string): string {
  recoverySequence += 1;
  return `${PERSISTENCE_RECOVERY_PREFIX}:${key}:${Date.now()}:${recoverySequence}`;
}

export function getPersistenceStatus(key: string): PersistenceStatus {
  return statuses.get(key) ?? { state: 'ready', key };
}

export function recordPersistenceWriteFailure(key: string, error: unknown): Extract<PersistenceStatus, { state: 'write-failed' }> {
  const status: Extract<PersistenceStatus, { state: 'write-failed' }> = { state: 'write-failed', key, message: messageFor(error) };
  dispatch(status);
  return status;
}

export function recordPersistenceReadFailure(key: string, error: unknown): Extract<PersistenceStatus, { state: 'unavailable' }> {
  const status: Extract<PersistenceStatus, { state: 'unavailable' }> = { state: 'unavailable', key, operation: 'read', message: messageFor(error) };
  dispatch(status);
  return status;
}

export function quarantineStoredValue(
  key: string,
  raw: string,
  storage: StorageAdapter,
  reason: unknown,
): Extract<PersistenceStatus, { state: 'corrupt' | 'unavailable' }> {
  const previous = statuses.get(key);
  if (previous?.state === 'corrupt' && quarantinedRawValues.get(key) === raw) {
    return previous;
  }
  const recoveryKey = recoveryKeyFor(key);
  try {
    storage.setItem(recoveryKey, JSON.stringify({
      version: 1,
      sourceKey: key,
      capturedAt: Date.now(),
      raw,
      reason: messageFor(reason),
    }));
  } catch (error) {
    const writeFailure = recordPersistenceWriteFailure(key, error);
    const status: Extract<PersistenceStatus, { state: 'unavailable' }> = {
      state: 'unavailable',
      key,
      operation: 'write',
      message: writeFailure.message,
    };
    dispatch(status);
    return status;
  }

  const status: Extract<PersistenceStatus, { state: 'corrupt' }> = {
    state: 'corrupt',
    key,
    recoveryKey,
    message: messageFor(reason),
  };
  quarantinedRawValues.set(key, raw);
  dispatch(status);
  return status;
}

export function readJsonStorage(key: string, storage: StorageAdapter): JsonStorageReadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return recordPersistenceReadFailure(key, error);
  }
  if (raw === null) return { state: 'missing', key };
  try {
    return { state: 'loaded', key, raw, value: JSON.parse(raw) };
  } catch (error) {
    return quarantineStoredValue(key, raw, storage, error);
  }
}

export function writeJsonStorage(key: string, value: unknown, storage: StorageAdapter): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    recordPersistenceWriteFailure(key, error);
    return false;
  }
}
