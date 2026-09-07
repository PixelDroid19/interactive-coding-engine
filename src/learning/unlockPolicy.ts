import type { Course, CurriculumItem } from '../types/curriculum';
import type { CurriculumSkillTarget } from './curriculumSkills';
import type { LearningEvidence, LearningProfile, MasteryCapability } from './types';
import { isCheckedPracticeEvidence } from './checkedAttempt';

export interface MasteryGap {
  skillId: string;
  capability: MasteryCapability;
  score: number;
}

export interface ItemReadiness {
  unlocked: boolean;
  missing: MasteryGap[];
  recoveryItemId?: string;
  message?: string;
}

// Completion flags and self-ratings in old profiles are not checked answers.
export function latestCoursePractice(profile: LearningProfile, courseId: string): LearningEvidence[] {
  const latest = new Map<string, LearningEvidence>();
  for (const evidence of profile.evidence) {
    if (evidence.courseId !== courseId || !isCheckedPracticeEvidence(evidence.id, evidence.source)) continue;
    const key = `${evidence.itemId}:${evidence.skillId}:${evidence.capability}`;
    if ((latest.get(key)?.timestamp ?? -Infinity) <= evidence.timestamp) latest.set(key, evidence);
  }
  return [...latest.values()].sort((a, b) => b.timestamp - a.timestamp);
}

function anchorFor(item: CurriculumItem): string {
  if (item.type === 'scrim') return item.scrimDataId;
  if ('relatedLessonId' in item && item.relatedLessonId) return item.relatedLessonId;
  return item.id;
}

function groupsFor(course: Course): Array<{ anchor: string; items: CurriculumItem[] }> {
  const groups: Array<{ anchor: string; items: CurriculumItem[] }> = [];
  for (const item of course.modules.flatMap((module) => module.items)) {
    const anchor = anchorFor(item);
    const existing = groups.find((group) => group.anchor === anchor);
    if (existing) existing.items.push(item);
    else groups.push({ anchor, items: [item] });
  }
  return groups;
}

export function getItemReadiness(
  course: Course,
  itemId: string,
  profile: LearningProfile,
  index: Record<string, CurriculumSkillTarget>,
): ItemReadiness {
  const item = course.modules.flatMap(module => module.items).find(candidate => candidate.id === itemId);
  if (item?.availability === 'locked') return { unlocked: false, missing: [], message: item.availabilityReason ?? 'Esta actividad no está disponible por ahora.' };
  // El contenido creado por el estudiante o publicado desde el estudio no forma
  // parte del índice curricular estático y debe poder abrirse para revisarlo.
  if (!index[itemId]) return { unlocked: true, missing: [] };
  const groups = groupsFor(course);
  const groupIndex = groups.findIndex((group) => group.items.some((item) => item.id === itemId));
  if (groupIndex <= 0) return { unlocked: true, missing: [] };
  const previous = groups[groupIndex - 1];
  const targets = Object.values(index).filter((target) => target.courseId === course.id && target.lessonId === previous.anchor);
  const targetIds = new Set(targets.map(target => target.itemId));
  const pending = latestCoursePractice(profile, course.id).filter(evidence => targetIds.has(evidence.itemId) && evidence.result !== 'success');
  const missing: MasteryGap[] = pending.map(evidence => ({ skillId: evidence.skillId, capability: evidence.capability, score: evidence.result === 'partial' ? 0.55 : 0.15 }));
  if (missing.length === 0) return { unlocked: true, missing: [] };
  const recovery = previous.items.find(candidate => candidate.id === pending[0].itemId)
    ?? previous.items.find(candidate => candidate.type === 'scrim');
  return {
    unlocked: true,
    missing,
    recoveryItemId: recovery?.availability === 'locked' ? undefined : recovery?.id,
    message: 'Puedes continuar o retomar la práctica que quedó pendiente. No necesitas reiniciar el curso.',
  };
}
