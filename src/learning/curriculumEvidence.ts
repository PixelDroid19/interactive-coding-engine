import type { UserProgressRecord } from '../types/curriculum';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from '../curriculum/ai-engineer/course';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from '../curriculum/javascript/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from '../curriculum/open-cells/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../curriculum/web-components-lit/course';
import { recordEvidence } from './mastery';
import { LocalLearningRepository } from './localLearningRepository';
import type { LearningRepository } from './repository';
import type { EvidenceResult, LearningProfile, NotebookEntry, ReviewCard, ReviewRating, TutorMessageRecord, TutorReinforcement } from './types';
import type { ExamEvaluation } from './exam';
import type { ExamQuestion } from './exam';
import { scheduleReview } from './reviewScheduler';
import { buildCurriculumSkillIndex, type CurriculumSkillTarget } from './curriculumSkills';
import { queueExerciseAttempt, type ExerciseCompletion } from '../services/learningSync';
import { checkedAttemptResult } from './checkedAttempt';

const DEFAULT_INDEX = buildCurriculumSkillIndex(
  [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE, OPEN_CELLS_COURSE, AI_ENGINEER_COURSE],
  { ...FUNDAMENTOS_SCRIMS, ...JAVASCRIPT_SCRIMS, ...COMPONENT_COURSE_SCRIMS, ...OPEN_CELLS_SCRIMS, ...AI_ENGINEER_SCRIMS },
);

const defaultRepository = new LocalLearningRepository();
const DAY_MS = 86_400_000;

function withReview(profile: LearningProfile, target: CurriculumSkillTarget, skillId: string, now: number): LearningProfile {
  const id = `review:${target.courseId}:${skillId}`;
  if (profile.reviews.some((review) => review.id === id)) return profile;
  const review: ReviewCard = {
    id,
    courseId: target.courseId,
    itemId: target.itemId,
    skillId,
    prompt: `Explica ${skillId.replace(/-/g, ' ')} con un ejemplo diferente al de la clase.`,
    intervalIndex: 0,
    dueAt: now + DAY_MS,
    lastReviewedAt: 0,
    repetitions: 0,
  };
  return { ...profile, reviews: [...profile.reviews, review] };
}

function applyTarget(profile: LearningProfile, target: CurriculumSkillTarget, result: EvidenceResult, now: number, attemptId: string): LearningProfile {
  return target.skillIds.reduce((current, skillId) => {
    const next = recordEvidence(current, {
      id: `checked:${attemptId}:${target.itemId}:${skillId}:${target.capability}`,
      courseId: target.courseId,
      itemId: target.itemId,
      skillId,
      capability: target.capability,
      result,
      source: target.source,
      timestamp: now,
    });
    return result === 'success' ? withReview(next, target, skillId, now) : next;
  }, profile);
}

export function createCurriculumEvidenceRecorder(
  index: Record<string, CurriculumSkillTarget>,
  repository: LearningRepository,
  now: () => number = Date.now,
) {
  return {
    /** Compatibility for old completion callers: progress is not an assessment. */
    async record(_itemId: string, _result: EvidenceResult = 'success'): Promise<LearningProfile> {
      return repository.load();
    },
    async recordAttempt(itemId: string, completion: ExerciseCompletion): Promise<LearningProfile> {
      const target = index[itemId];
      const result = checkedAttemptResult(completion);
      if (!target || !result || target.source === 'lesson' || target.source === 'reading') return repository.load();
      const timestamp = now();
      const attemptId = crypto.randomUUID();
      return repository.update((profile) => applyTarget(profile, target, result, timestamp, attemptId));
    },
    async migrate(_progress: UserProgressRecord): Promise<LearningProfile> {
      // Old completion flags lack the checked response, evaluator and time.
      // Keep existing history intact; do not manufacture new evidence today.
      return repository.load();
    },
  };
}

export const curriculumEvidence = createCurriculumEvidenceRecorder(DEFAULT_INDEX, defaultRepository);

export function getCurriculumSkillTarget(itemId: string): CurriculumSkillTarget | undefined {
  return DEFAULT_INDEX[itemId];
}

export function getCurriculumSkillIndex(): Record<string, CurriculumSkillTarget> {
  return DEFAULT_INDEX;
}

export function loadLearningProfile(): Promise<LearningProfile> {
  return defaultRepository.load();
}

export function rateCurriculumReview(reviewId: string, rating: ReviewRating): Promise<LearningProfile> {
  const now = Date.now();
  return defaultRepository.update((profile) => {
    const review = profile.reviews.find((candidate) => candidate.id === reviewId);
    if (!review) return profile;
    return {
      ...profile,
      updatedAt: now,
      reviews: profile.reviews.map((candidate) => candidate.id === reviewId ? scheduleReview(candidate, rating, now) : candidate),
    };
  });
}

export function saveNotebookEntry(entry: Omit<NotebookEntry, 'id' | 'updatedAt'>): Promise<LearningProfile> {
  const now = Date.now();
  const id = `notebook:${entry.courseId}:${crypto.randomUUID()}`;
  return defaultRepository.update((profile) => ({
    ...profile,
    updatedAt: now,
    notebook: [
      ...profile.notebook.filter((candidate) => candidate.id !== id),
      { ...entry, id, updatedAt: now },
    ],
  }));
}

export function saveExamEvaluation(
  courseId: string,
  questions: ExamQuestion[],
  evaluation: ExamEvaluation,
): Promise<LearningProfile> {
  const now = Date.now();
  return defaultRepository.update((profile) => {
    const attemptId = `exam:${courseId}:${now}`;
    const withAttempt: LearningProfile = {
      ...profile,
      updatedAt: now,
      exams: [...profile.exams, {
        id: attemptId,
        courseId,
        startedAt: now,
        completedAt: now,
        scores: {},
        classification: 'ungraded',
        kind: 'exam',
        responses: questions.map(question => ({ prompt: question.prompt, answer: evaluation.responses.find(response => response.capability === question.capability)?.answer.slice(0, 2000) ?? '' })),
      }],
    };
    return withAttempt;
  });
}

export function saveLeaderInterview(courseId: string, skillId: string, answers: string[]): Promise<LearningProfile> {
  const now = Date.now();
  const prompts = [`Propósito y límites de ${skillId.replace(/-/g, ' ')}`, 'Qué cambia cuando cambia el requisito', 'Cómo comprobar la decisión'];
  return defaultRepository.update((profile) => ({
    ...profile,
    updatedAt: now,
    exams: [...profile.exams, {
      id: `leader:${courseId}:${skillId}:${now}`, courseId, startedAt: now, completedAt: now,
      kind: 'interview', classification: 'ungraded', scores: {},
      responses: prompts.map((prompt, index) => ({ prompt, answer: (answers[index] ?? '').trim().slice(0, 2000) })),
    }],
  }));
}

export function recordPostSolveEvidence(itemId: string, readingAnswer: string, variationAnswer: string): Promise<LearningProfile> {
  const target = DEFAULT_INDEX[itemId] ?? Object.values(DEFAULT_INDEX).find((candidate) => candidate.lessonId === itemId || itemId.startsWith(candidate.itemId));
  if (!target) return defaultRepository.load();
  const course = [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE, OPEN_CELLS_COURSE, AI_ENGINEER_COURSE].find(entry => entry.id === target.courseId);
  if (course && (readingAnswer.trim() || variationAnswer.trim())) {
    // Preserve the response for a tutor, but never infer mastery from its length.
    queueExerciseAttempt(course.slug, itemId, 'challenge', 'partial', {
      response: { readingAnswer: readingAnswer.trim().slice(0, 2000), variationAnswer: variationAnswer.trim().slice(0, 2000) },
      diagnostics: { mode: 'self-reflection', evaluation: 'ungraded' },
    });
  }
  return defaultRepository.load();
}

export function saveTutorModelPreference(modelId: string, downloaded = false): Promise<LearningProfile> {
  return defaultRepository.update((profile) => ({
    ...profile,
    updatedAt: Date.now(),
    tutor: {
      ...profile.tutor,
      selectedModel: modelId,
      downloadedModelIds: downloaded
        ? [...new Set([...profile.tutor.downloadedModelIds, modelId])]
        : profile.tutor.downloadedModelIds,
    },
  }));
}

export function saveTutorConversation(key: string, messages: TutorMessageRecord[]): Promise<LearningProfile> {
  return defaultRepository.update((profile) => ({
    ...profile,
    updatedAt: Date.now(),
    tutor: {
      ...profile.tutor,
      conversations: {
        ...profile.tutor.conversations,
        [key]: messages.slice(-12),
      },
    },
  }));
}

export type TutorReinforcementInput = Pick<TutorReinforcement, 'courseId' | 'itemId' | 'skillId' | 'note' | 'evidence'>;

export function upsertTutorReinforcement(profile: LearningProfile, input: TutorReinforcementInput, now = Date.now()): LearningProfile {
  const id = `tutor:${input.courseId}:${input.skillId}`;
  const previous = profile.tutor.reinforcements.find((candidate) => candidate.id === id);
  const reinforcement: TutorReinforcement = previous
    ? { ...previous, ...input, occurrences: previous.occurrences + 1, reviewed: false, updatedAt: now }
    : { ...input, id, occurrences: 1, reviewed: false, createdAt: now, updatedAt: now };
  return {
    ...profile,
    updatedAt: now,
    tutor: {
      ...profile.tutor,
      reinforcements: [...profile.tutor.reinforcements.filter((candidate) => candidate.id !== id), reinforcement],
    },
  };
}

export function saveTutorReinforcement(input: TutorReinforcementInput): Promise<LearningProfile> {
  return defaultRepository.update((profile) => upsertTutorReinforcement(profile, input));
}

export function markTutorReinforcementReviewed(id: string): Promise<LearningProfile> {
  const now = Date.now();
  return defaultRepository.update((profile) => ({
    ...profile,
    updatedAt: now,
    tutor: {
      ...profile.tutor,
      reinforcements: profile.tutor.reinforcements.map((candidate) => candidate.id === id ? { ...candidate, reviewed: true, updatedAt: now } : candidate),
    },
  }));
}
