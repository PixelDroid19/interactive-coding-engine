import { createEmptyLearningProfile } from './mastery';
import type { LearningRepository } from './repository';
import { LEARNING_PROFILE_VERSION, type LearningProfile } from './types';

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

function parseProfile(raw: string | null): LearningProfile | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
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
  } catch {
    return null;
  }
}

export class LocalLearningRepository implements LearningRepository {
  private queue = Promise.resolve();

  constructor(private readonly storage: StorageLike | null = defaultStorage()) {}

  async load(): Promise<LearningProfile> {
    return parseProfile(this.storage?.getItem(LEARNING_PROFILE_STORAGE_KEY) ?? null)
      ?? createEmptyLearningProfile();
  }

  async save(profile: LearningProfile): Promise<void> {
    this.storage?.setItem(LEARNING_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  async update(mutator: (profile: LearningProfile) => LearningProfile): Promise<LearningProfile> {
    let result = createEmptyLearningProfile();
    const operation = this.queue.then(async () => {
      result = mutator(await this.load());
      await this.save(result);
    });
    this.queue = operation.catch(() => undefined);
    await operation;
    return result;
  }
}
