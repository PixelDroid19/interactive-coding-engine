import type { Course, CurriculumItem, UserProgressRecord } from '../types/curriculum';
import type { ScrimLessonData } from '../types/scrim';
import type { LearningProfile } from './types';
import { latestCoursePractice } from './unlockPolicy';

export interface NextLearningAction {
  item: CurriculumItem;
  moduleId: string;
  reason: 'resume' | 'practice' | 'continue' | 'review';
  explanation: string;
  timeMs: number;
}

/** Navigation advice only: never marks completion or estimates mastery. */
export function getNextLearningAction(course: Course, progress: UserProgressRecord, profile: LearningProfile, scrims: Record<string, ScrimLessonData> = {}): NextLearningAction | null {
  const entries = course.modules.flatMap(module => module.items.map(item => ({ item, moduleId: module.id })))
    .filter(entry => entry.item.availability !== 'locked');
  if (!entries.length) return null;
  const completed = new Set([...progress.completedItemIds, ...progress.completedChallenges, ...progress.passedSoloProjects]);
  const action = (entry: typeof entries[number], reason: NextLearningAction['reason'], explanation: string, timeMs = 0): NextLearningAction => ({ ...entry, reason, explanation, timeMs });
  const resume = progress.lastAccessedCourseId === course.id
    ? entries.find(entry => entry.item.id === progress.lastAccessedItemId && !completed.has(entry.item.id)) : undefined;
  if (resume) {
    const savedTime = progress.lastAccessedTimestamp;
    const timeMs = resume.item.type === 'scrim' && typeof savedTime === 'number' && Number.isFinite(savedTime) ? Math.max(0, savedTime) : 0;
    return action(resume, 'resume', 'Retoma la actividad que dejaste abierta en este curso.', timeMs);
  }
  for (const evidence of latestCoursePractice(profile, course.id)) {
    if (evidence.result === 'success' || completed.has(evidence.itemId)) continue;
    const practice = entries.find(entry => entry.item.id === evidence.itemId);
    if (practice) return action(practice, 'practice', 'Retoma esta práctica pendiente. También puedes elegir otra actividad del mapa.');
    for (const entry of entries) {
      if (entry.item.type !== 'scrim') continue;
      const lesson = scrims[entry.item.scrimDataId];
      const challenge = lesson?.challenges.find(candidate => candidate.id === evidence.itemId);
      if (challenge && Number.isFinite(challenge.timestamp) && challenge.timestamp >= 0 && challenge.timestamp < lesson.durationMs) {
        return action(entry, 'practice', 'Retoma el reto pendiente dentro de esta clase. También puedes elegir otra actividad del mapa.', challenge.timestamp);
      }
    }
  }
  const next = entries.find(entry => !completed.has(entry.item.id));
  if (next) return action(next, 'continue', 'Sigue con la siguiente actividad de este curso. Puedes elegir otra en el mapa.');
  const review = entries.find(entry => ['debugging', 'reasoning', 'challenge', 'solo-project'].includes(entry.item.type)
    || (entry.item.type === 'reading' && Boolean(entry.item.handsOnLab))) ?? entries[0];
  return action(review, 'review', 'Ya recorriste las actividades disponibles. Vuelve a una práctica para comprobar qué puedes resolver.');
}
