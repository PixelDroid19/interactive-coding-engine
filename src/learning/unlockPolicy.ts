import type { Course, CurriculumItem } from '../types/curriculum';
import type { CurriculumSkillTarget } from './curriculumSkills';
import type { LearningProfile, MasteryCapability } from './types';

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

const KNOWLEDGE_CAPABILITIES: MasteryCapability[] = ['recognize', 'explain'];
const APPLICATION_CAPABILITIES: MasteryCapability[] = ['produce', 'modify', 'transfer', 'debug'];
const MASTERY_THRESHOLD = 0.55;

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

function bestScore(profile: LearningProfile, skillId: string, capabilities: MasteryCapability[]): number {
  return Math.max(0, ...capabilities.map((capability) => profile.skills[skillId]?.capabilities[capability]?.score ?? 0));
}

function recoveryFor(
  previousItems: CurriculumItem[],
  missing: MasteryGap[],
): string | undefined {
  const needsKnowledge = missing.some((gap) => KNOWLEDGE_CAPABILITIES.includes(gap.capability));
  if (needsKnowledge) {
    return previousItems.find((item) => item.type === 'reading' || item.type === 'reasoning')?.id
      ?? previousItems.find((item) => item.type === 'scrim')?.id
      ?? previousItems[0]?.id;
  }
  const needsApplication = missing.some((gap) => APPLICATION_CAPABILITIES.includes(gap.capability));
  if (needsApplication) {
    return previousItems.find((item) => item.type === 'challenge')?.id
      ?? previousItems.find((item) => item.type === 'scrim')?.id
      ?? previousItems.find((item) => item.type === 'debugging')?.id
      ?? previousItems[0]?.id;
  }
  return previousItems.find((item) => item.type === 'reading' || item.type === 'reasoning')?.id
    ?? previousItems[0]?.id;
}

export function getItemReadiness(
  course: Course,
  itemId: string,
  profile: LearningProfile,
  index: Record<string, CurriculumSkillTarget>,
): ItemReadiness {
  // El contenido creado por el estudiante o publicado desde el estudio no forma
  // parte del índice curricular estático y debe poder abrirse para revisarlo.
  if (!index[itemId]) return { unlocked: true, missing: [] };
  const groups = groupsFor(course);
  const groupIndex = groups.findIndex((group) => group.items.some((item) => item.id === itemId));
  if (groupIndex <= 0) return { unlocked: true, missing: [] };
  const previous = groups[groupIndex - 1];
  const targets = Object.values(index).filter((target) => target.courseId === course.id && target.lessonId === previous.anchor);
  const skillIds = [...new Set(targets.flatMap((target) => target.skillIds))];
  if (skillIds.length === 0) return { unlocked: true, missing: [] };
  const hasApplicationTarget = targets.some((target) => APPLICATION_CAPABILITIES.includes(target.capability));
  const missing: MasteryGap[] = [];

  for (const skillId of skillIds) {
    const knowledge = bestScore(profile, skillId, KNOWLEDGE_CAPABILITIES);
    if (knowledge < MASTERY_THRESHOLD) missing.push({ skillId, capability: 'explain', score: knowledge });
    if (hasApplicationTarget) {
      const application = bestScore(profile, skillId, APPLICATION_CAPABILITIES);
      if (application < MASTERY_THRESHOLD) missing.push({ skillId, capability: 'modify', score: application });
    }
  }

  if (missing.length === 0) return { unlocked: true, missing: [] };
  const firstSkill = missing[0].skillId.replace(/-/g, ' ');
  return {
    unlocked: false,
    missing,
    recoveryItemId: recoveryFor(previous.items, missing),
    message: `Antes de continuar, refuerza ${firstSkill}. Te llevamos al punto exacto que falta practicar.`,
  };
}
