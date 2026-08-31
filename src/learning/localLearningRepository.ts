import { createEmptyLearningProfile } from './mastery';
import type { LearningRepository } from './repository';
import { LEARNING_PROFILE_VERSION, type LearningProfile } from './types';
import {
  quarantineStoredValue,
  readJsonStorage,
  recordPersistenceReadFailure,
  recordPersistenceWriteFailure,
  type PersistenceStatus,
} from '../engine/persistenceIntegrity';

export const LEARNING_PROFILE_STORAGE_KEY = 'aula_learning_profile_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseProfile(value: unknown): LearningProfile | null {
  if (!isRecord(value) || value.version !== LEARNING_PROFILE_VERSION) return null;
  if (!isRecord(value.skills) || !Array.isArray(value.evidence) || !Array.isArray(value.reviews)) return null;
  if (!Array.isArray(value.notebook) || !Array.isArray(value.exams) || !isRecord(value.tutor)) return null;
  const profile = value as unknown as LearningProfile;
  return {
    ...profile,
    tutor: {
      ...profile.tutor,
      selectedModel: typeof profile.tutor.selectedModel === 'string' ? profile.tutor.selectedModel : 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
      downloadedModelIds: Array.isArray(profile.tutor.downloadedModelIds) ? profile.tutor.downloadedModelIds : [],
      conversations: isRecord(profile.tutor.conversations) ? profile.tutor.conversations : {},
      reinforcements: Array.isArray(profile.tutor.reinforcements) ? profile.tutor.reinforcements : [],
    },
  };
}

export type LearningProfileLoadStatus =
  | Readonly<{ state: 'ready'; key: typeof LEARNING_PROFILE_STORAGE_KEY; source: 'empty' | 'stored' }>
  | Extract<PersistenceStatus, { state: 'corrupt' | 'unavailable' }>;

export type LearningProfileLoadResult =
  | Readonly<{ status: 'loaded'; profile: LearningProfile; source: 'empty' | 'stored' }>
  | Readonly<{ status: 'corrupt'; key: string; recoveryKey: string; message: string }>
  | Readonly<{ status: 'unavailable'; key: string; operation: 'read' | 'write'; message: string }>;

export class LearningProfilePersistenceError extends Error {
  readonly code: 'PERSISTENCE_CORRUPTED' | 'PERSISTENCE_UNAVAILABLE' | 'PERSISTENCE_WRITE_FAILED';

  constructor(status: Exclude<PersistenceStatus, { state: 'ready' }>) {
    super(status.message);
    this.name = 'LearningProfilePersistenceError';
    this.code = status.state === 'corrupt'
      ? 'PERSISTENCE_CORRUPTED'
      : status.state === 'write-failed'
        ? 'PERSISTENCE_WRITE_FAILED'
        : 'PERSISTENCE_UNAVAILABLE';
  }
}

export class LocalLearningRepository implements LearningRepository {
  private queue = Promise.resolve();
  private lastLoadStatus: LearningProfileLoadStatus = {
    state: 'ready',
    key: LEARNING_PROFILE_STORAGE_KEY,
    source: 'empty',
  };

  constructor(private readonly storage: StorageLike | null = defaultStorage()) {}

  getLoadStatus(): LearningProfileLoadStatus {
    return this.lastLoadStatus;
  }

  private readProfile(): LearningProfile | null {
    if (!this.storage) {
      const status = recordPersistenceReadFailure(LEARNING_PROFILE_STORAGE_KEY, new Error('El almacenamiento local no está disponible.'));
      this.lastLoadStatus = status;
      return null;
    }

    const result = readJsonStorage(LEARNING_PROFILE_STORAGE_KEY, this.storage);
    if (result.state === 'missing') {
      this.lastLoadStatus = { state: 'ready', key: LEARNING_PROFILE_STORAGE_KEY, source: 'empty' };
      return null;
    }
    if (result.state !== 'loaded') {
      this.lastLoadStatus = result;
      return null;
    }

    const profile = parseProfile(result.value);
    if (!profile) {
      this.lastLoadStatus = quarantineStoredValue(
        LEARNING_PROFILE_STORAGE_KEY,
        result.raw,
        this.storage,
        new Error('El perfil de aprendizaje guardado no tiene una estructura válida.'),
      );
      return null;
    }
    this.lastLoadStatus = { state: 'ready', key: LEARNING_PROFILE_STORAGE_KEY, source: 'stored' };
    return profile;
  }

  async load(): Promise<LearningProfile> {
    const result = await this.loadWithStatus();
    if (result.status === 'loaded') return result.profile;
    if (result.status === 'corrupt') {
      throw new LearningProfilePersistenceError({
        state: 'corrupt',
        key: result.key,
        recoveryKey: result.recoveryKey,
        message: result.message,
      });
    }
    throw new LearningProfilePersistenceError({
      state: 'unavailable',
      key: result.key,
      operation: result.operation,
      message: result.message,
    });
  }

  async loadWithStatus(): Promise<LearningProfileLoadResult> {
    const profile = this.readProfile();
    if (this.lastLoadStatus.state === 'ready') {
      return {
        status: 'loaded',
        profile: profile ?? createEmptyLearningProfile(),
        source: this.lastLoadStatus.source,
      };
    }
    if (this.lastLoadStatus.state === 'corrupt') {
      return { status: 'corrupt', ...this.lastLoadStatus };
    }
    return { status: 'unavailable', ...this.lastLoadStatus };
  }

  async save(profile: LearningProfile): Promise<void> {
    if (!this.storage) {
      const status = recordPersistenceReadFailure(LEARNING_PROFILE_STORAGE_KEY, new Error('El almacenamiento local no está disponible.'));
      throw new LearningProfilePersistenceError(status);
    }
    try {
      this.storage.setItem(LEARNING_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      throw new LearningProfilePersistenceError(recordPersistenceWriteFailure(LEARNING_PROFILE_STORAGE_KEY, error));
    }
  }

  async update(mutator: (profile: LearningProfile) => LearningProfile): Promise<LearningProfile> {
    let result = createEmptyLearningProfile();
    const operation = this.queue.then(async () => {
      const current = this.readProfile();
      if (!current && this.lastLoadStatus.state !== 'ready') {
        throw new LearningProfilePersistenceError(this.lastLoadStatus);
      }
      result = mutator(current ?? createEmptyLearningProfile());
      await this.save(result);
    });
    this.queue = operation.catch(() => undefined);
    await operation;
    return result;
  }
}
