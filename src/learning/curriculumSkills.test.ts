import { describe, expect, it } from 'vitest';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from '../curriculum/javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../curriculum/web-components-lit/course';
import { buildCurriculumSkillIndex } from './curriculumSkills';

describe('índice de habilidades curriculares', () => {
  const courses = [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE];
  const scrims = { ...FUNDAMENTOS_SCRIMS, ...JAVASCRIPT_SCRIMS, ...COMPONENT_COURSE_SCRIMS };
  const index = buildCurriculumSkillIndex(courses, scrims);

  it('clasifica cada tipo de actividad en una capacidad diferente', () => {
    const allItems = courses.flatMap((course) => course.modules.flatMap((module) => module.items));
    for (const item of allItems) {
      expect(index[item.id]?.skillIds.length, `${item.id} no tiene habilidades observables`).toBeGreaterThan(0);
    }

    const reading = allItems.find((item) => item.type === 'reading')!;
    const reasoning = allItems.find((item) => item.type === 'reasoning')!;
    const debugging = allItems.find((item) => item.type === 'debugging')!;
    expect(index[reading.id].capability).toBe('explain');
    expect(index[reasoning.id].capability).toBe('explain');
    expect(index[debugging.id].capability).toBe('debug');
  });

  it('registra los retos internos con las habilidades de su lección', () => {
    const lesson = Object.values(scrims).find((candidate) => candidate.challenges.length > 0)!;
    const challenge = lesson.challenges[0];

    expect(index[challenge.id]).toMatchObject({
      itemId: challenge.id,
      lessonId: lesson.id,
      capability: 'modify',
      source: 'challenge',
    });
    expect(index[challenge.id].skillIds.length).toBeGreaterThan(0);
  });

  it('usa identificadores estables y no frases completas como claves de habilidad', () => {
    for (const target of Object.values(index)) {
      for (const skill of target.skillIds) {
        expect(skill).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(skill.length).toBeLessThanOrEqual(64);
      }
    }
  });
});
