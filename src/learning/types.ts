export const LEARNING_PROFILE_VERSION = 1 as const;

export type MasteryCapability =
  | 'recognize'
  | 'explain'
  | 'produce'
  | 'modify'
  | 'transfer'
  | 'debug';

export type EvidenceResult = 'success' | 'partial' | 'failure';

export type EvidenceSource =
  | 'lesson'
  | 'reading'
  | 'reasoning'
  | 'challenge'
  | 'debugging'
  | 'project'
  | 'variation'
  | 'review'
  | 'leader'
  | 'exam';

export interface LearningEvidence {
  id: string;
  courseId: string;
  itemId: string;
  skillId: string;
  capability: MasteryCapability;
  result: EvidenceResult;
  source: EvidenceSource;
  timestamp: number;
}

export interface CapabilityMastery {
  score: number;
  attempts: number;
  successes: number;
  lastPracticedAt: number;
  lastResult: EvidenceResult;
}

export interface SkillMastery {
  skillId: string;
  capabilities: Partial<Record<MasteryCapability, CapabilityMastery>>;
  updatedAt: number;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewCard {
  id: string;
  courseId: string;
  itemId: string;
  skillId: string;
  prompt: string;
  intervalIndex: number;
  dueAt: number;
  lastReviewedAt: number;
  repetitions: number;
}

export interface NotebookEntry {
  id: string;
  courseId: string;
  skillId: string;
  concept: string;
  mentalModel: string;
  pattern: string;
  ownExample: string;
  personalMistake: string;
  updatedAt: number;
}

export interface ExamAttempt {
  id: string;
  courseId: string;
  startedAt: number;
  completedAt?: number;
  scores: Partial<Record<MasteryCapability, number>>;
  classification?: 'green' | 'yellow' | 'red';
}

export interface TutorMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface TutorReinforcement {
  id: string;
  courseId: string;
  itemId: string;
  skillId: string;
  note: string;
  evidence: string;
  occurrences: number;
  reviewed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TutorPreferences {
  selectedModel: string;
  downloadedModelIds: string[];
  conversations: Record<string, TutorMessageRecord[]>;
  reinforcements: TutorReinforcement[];
}

export interface LearningProfile {
  version: typeof LEARNING_PROFILE_VERSION;
  updatedAt: number;
  skills: Record<string, SkillMastery>;
  evidence: LearningEvidence[];
  reviews: ReviewCard[];
  notebook: NotebookEntry[];
  exams: ExamAttempt[];
  tutor: TutorPreferences;
}
