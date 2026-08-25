import type { DebuggingExerciseItem, SoloProjectItem, StandaloneChallengeItem } from '../../types/curriculum';
import type { CourseLanguage, ScrimLessonData } from '../../types/scrim';

export function resolveLessonLanguage(
  lesson: ScrimLessonData,
  language: CourseLanguage,
): ScrimLessonData {
  const resolved = structuredClone(lesson);
  const lessonVariant = lesson.languageVariants?.[language];
  if (lessonVariant) {
    resolved.initialWorkspace = structuredClone(lessonVariant.workspace);
    resolved.runtimePackages = [...(lessonVariant.packages ?? [])];
  }
  resolved.challenges = lesson.challenges.map((challenge, index) => {
    const challengeVariant = challenge.languageVariants?.[language];
    const variant = challengeVariant ?? (index === 0 ? lessonVariant : undefined);
    if (!variant) return structuredClone(challenge);
    return {
      ...structuredClone(challenge),
      tests: structuredClone(variant.tests),
    };
  });
  return resolved;
}

export function resolveDebuggingLanguage(
  exercise: DebuggingExerciseItem,
  language: CourseLanguage,
): DebuggingExerciseItem {
  const resolved = structuredClone(exercise);
  const variant = exercise.languageVariants?.[language];
  if (!variant) return resolved;
  resolved.initialWorkspace = structuredClone(variant.workspace);
  resolved.tests = structuredClone(variant.tests);
  return resolved;
}

export function resolveProjectLanguage(
  project: SoloProjectItem,
  language: CourseLanguage,
): SoloProjectItem {
  const resolved = structuredClone(project);
  const variant = project.languageVariants?.[language];
  if (variant) resolved.initialWorkspace = structuredClone(variant.workspace);
  return resolved;
}

export function resolveStandaloneChallengeLanguage(
  item: StandaloneChallengeItem,
  language: CourseLanguage,
): StandaloneChallengeItem {
  const resolved = structuredClone(item);
  const variant = item.languageVariants?.[language];
  if (!variant) return resolved;
  resolved.initialWorkspace = structuredClone(variant.workspace);
  resolved.challenge.tests = structuredClone(variant.tests);
  return resolved;
}
