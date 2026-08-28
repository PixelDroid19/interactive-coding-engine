import type { LearningProfile } from './types';

export interface LearningRepository {
  load(): Promise<LearningProfile>;
  save(profile: LearningProfile): Promise<void>;
  update(mutator: (profile: LearningProfile) => LearningProfile): Promise<LearningProfile>;
}
