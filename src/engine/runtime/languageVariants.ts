import { cloneRuntimeData } from './cloneRuntimeData';
import type { DebuggingExerciseItem, SoloProjectItem, StandaloneChallengeItem } from '../../types/curriculum';
import type { CourseLanguage, ScrimLessonData } from '../../types/scrim';

export function resolveLessonLanguage(
  lesson: ScrimLessonData,
  language: CourseLanguage,
): ScrimLessonData {
  const resolved = cloneRuntimeData(lesson);
  const lessonVariant = lesson.languageVariants?.[language];
  if (lessonVariant) {
    resolved.initialWorkspace = cloneRuntimeData(lessonVariant.workspace);
    resolved.runtimePackages = [...(lessonVariant.packages ?? [])];
    if (lessonVariant.lessonTape) {
      resolved.events = cloneRuntimeData(lessonVariant.lessonTape.events);
      resolved.snapshots = cloneRuntimeData(lessonVariant.lessonTape.snapshots);
      resolved.challenges = cloneRuntimeData(lessonVariant.lessonTape.challenges);
      resolved.chapters = cloneRuntimeData(lessonVariant.lessonTape.chapters ?? []);
      resolved.durationMs = lessonVariant.lessonTape.durationMs;
      if (resolved.audioTrack) resolved.audioTrack.durationMs = lessonVariant.lessonTape.durationMs;
    }
  }
  resolved.challenges = lesson.challenges.map((challenge, index) => {
    const challengeVariant = challenge.languageVariants?.[language];
    const variant = challengeVariant ?? (index === 0 ? lessonVariant : undefined);
    if (!variant) return cloneRuntimeData(challenge);
    return {
      ...cloneRuntimeData(challenge),
      tests: cloneRuntimeData(variant.tests),
    };
  });
  return resolved;
}

export function resolveDebuggingLanguage(
  exercise: DebuggingExerciseItem,
  language: CourseLanguage,
): DebuggingExerciseItem {
  const resolved = cloneRuntimeData(exercise);
  const variant = exercise.languageVariants?.[language];
  if (!variant) return resolved;
  resolved.initialWorkspace = cloneRuntimeData(variant.workspace);
  resolved.tests = cloneRuntimeData(variant.tests);
  return resolved;
}

export function resolveProjectLanguage(
  project: SoloProjectItem,
  language: CourseLanguage,
): SoloProjectItem {
  const resolved = cloneRuntimeData(project);
  const variant = project.languageVariants?.[language];
  if (variant) {
    resolved.initialWorkspace = cloneRuntimeData(variant.workspace);
    resolved.tests = cloneRuntimeData(variant.tests);
  }
  return resolved;
}

export function resolveStandaloneChallengeLanguage(
  item: StandaloneChallengeItem,
  language: CourseLanguage,
): StandaloneChallengeItem {
  const resolved = cloneRuntimeData(item);
  const variant = item.languageVariants?.[language];
  if (!variant) return resolved;
  resolved.initialWorkspace = cloneRuntimeData(variant.workspace);
  resolved.challenge.tests = cloneRuntimeData(variant.tests);
  return resolved;
}
