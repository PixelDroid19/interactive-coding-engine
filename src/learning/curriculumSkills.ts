import type { Course, CurriculumItem } from '../types/curriculum';
import type { ScrimLessonData } from '../types/scrim';
import type { EvidenceSource, MasteryCapability } from './types';

export interface CurriculumSkillTarget {
  courseId: string;
  itemId: string;
  lessonId: string;
  skillIds: string[];
  capability: MasteryCapability;
  source: EvidenceSource;
}

function slugSkill(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'fundamento';
}

function uniqueSkills(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)).map(slugSkill))];
}

function lessonIdFor(item: CurriculumItem): string {
  if (item.type === 'scrim') return item.scrimDataId;
  if ('relatedLessonId' in item && item.relatedLessonId) return item.relatedLessonId;
  return item.id;
}

function capabilityFor(item: CurriculumItem): { capability: MasteryCapability; source: EvidenceSource } {
  switch (item.type) {
    case 'reading': return { capability: 'explain', source: 'reading' };
    case 'reasoning': return { capability: 'explain', source: 'reasoning' };
    case 'debugging': return { capability: 'debug', source: 'debugging' };
    case 'solo-project': return { capability: 'transfer', source: 'project' };
    case 'challenge': return { capability: 'produce', source: 'challenge' };
    default: return { capability: 'recognize', source: 'lesson' };
  }
}

function skillsFor(item: CurriculumItem, lesson?: ScrimLessonData): string[] {
  const lessonSkills = uniqueSkills([
    ...(lesson?.skillsIntroduced ?? []),
    ...(lesson?.concepts ?? []),
  ]);
  if (lessonSkills.length) return lessonSkills;
  if (item.type === 'reading') return uniqueSkills(item.keyPoints.slice(0, 3));
  if (item.type === 'solo-project') return uniqueSkills(item.requirements.map((requirement) => requirement.category || requirement.title));
  return [slugSkill(item.title.replace(/^\d+[.:\s-]*/, ''))];
}

export function buildCurriculumSkillIndex(
  courses: Course[],
  scrims: Record<string, ScrimLessonData>,
): Record<string, CurriculumSkillTarget> {
  const index: Record<string, CurriculumSkillTarget> = {};
  for (const course of courses) {
    for (const item of course.modules.flatMap((module) => module.items)) {
      const lessonId = lessonIdFor(item);
      const lesson = scrims[lessonId];
      index[item.id] = {
        courseId: course.id,
        itemId: item.id,
        lessonId,
        skillIds: skillsFor(item, lesson),
        ...capabilityFor(item),
      };
      if (item.type === 'scrim' && lesson) {
        for (const challenge of lesson.challenges) {
          index[challenge.id] = {
            courseId: course.id,
            itemId: challenge.id,
            lessonId: lesson.id,
            skillIds: skillsFor(item, lesson),
            capability: 'modify',
            source: 'challenge',
          };
        }
      }
    }
  }
  return index;
}
