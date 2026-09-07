import { describe, expect, it } from 'vitest';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from '../curriculum/javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../curriculum/web-components-lit/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from '../curriculum/open-cells/course';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from '../curriculum/ai-engineer/course';
import type { Course, UserProgressRecord } from '../types/curriculum';
import { createEmptyLearningProfile, recordEvidence } from './mastery';
import { getNextLearningAction } from './nextLearningAction';

const empty: UserProgressRecord = { completedItemIds: [], completedChallenges: [], passedSoloProjects: [], savedLearnerBranches: {}, recentActivity: [] };
const courses = [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE, OPEN_CELLS_COURSE, AI_ENGINEER_COURSE];

describe('una acción siguiente que pertenece al curso abierto', () => {
  it.each([
    { course: FUNDAMENTOS_COURSE, scrims: FUNDAMENTOS_SCRIMS },
    { course: JAVASCRIPT_COURSE, scrims: JAVASCRIPT_SCRIMS },
    { course: COMPONENT_COURSE, scrims: COMPONENT_COURSE_SCRIMS },
    { course: OPEN_CELLS_COURSE, scrims: OPEN_CELLS_SCRIMS },
    { course: AI_ENGINEER_COURSE, scrims: AI_ENGINEER_SCRIMS },
  ])('$course.slug recupera cada reto publicado sin confundirlo con la clase completada', ({ course, scrims }) => {
    for (const module of course.modules) for (const item of module.items) {
      if (item.type !== 'scrim' || item.availability === 'locked') continue;
      const lesson = scrims[item.scrimDataId];
      expect(lesson, item.id).toBeDefined();
      for (const challenge of lesson.challenges) {
        const profile = recordEvidence(createEmptyLearningProfile(), {
          id: `checked:${challenge.id}`, courseId: course.id, itemId: challenge.id,
          skillId: 'instruccion', capability: 'modify', source: 'challenge', result: 'failure', timestamp: 1,
        });
        expect(getNextLearningAction(course, { ...empty, completedItemIds: [item.id] }, profile, scrims), challenge.id)
          .toMatchObject({ item: { id: item.id }, moduleId: module.id, reason: 'practice', timeMs: challenge.timestamp });
      }
    }
  });

  it.each(courses)('$slug empieza en su contenido real y respeta el orden', course => {
    const available = course.modules.flatMap(module => module.items).filter(item => item.availability !== 'locked');
    const first = getNextLearningAction(course, empty, createEmptyLearningProfile());
    expect(first?.item.id).toBe(available[0].id);
    const next = getNextLearningAction(course, { ...empty, completedItemIds: [available[0].id] }, createEmptyLearningProfile());
    expect(next?.item.id).toBe(available[1].id);
    expect(next?.reason).toBe('continue');
  });

  it('reanuda solo una actividad pendiente de este curso y conserva el tiempo de la clase', () => {
    const course = FUNDAMENTOS_COURSE;
    const scrim = course.modules.flatMap(module => module.items).find(item => item.type === 'scrim')!;
    const progress = { ...empty, lastAccessedCourseId: course.id, lastAccessedItemId: scrim.id, lastAccessedTimestamp: 1234 };
    expect(getNextLearningAction(course, progress, createEmptyLearningProfile())).toMatchObject({ reason: 'resume', item: { id: scrim.id }, timeMs: 1234 });
    expect(getNextLearningAction(COMPONENT_COURSE, progress, createEmptyLearningProfile())?.reason).toBe('continue');
  });

  it.each(courses)('$slug recorre todas sus actividades disponibles sin saltar ningún tipo', course => {
    const published = course.modules.flatMap(module => module.items
      .filter(item => item.availability !== 'locked')
      .map(item => ({ item, moduleId: module.id })));
    const progress = structuredClone(empty);
    const profile = createEmptyLearningProfile();
    for (const expected of published) {
      const before = structuredClone({ progress, profile });
      const next = getNextLearningAction(course, progress, profile);
      expect(next, `${course.slug}/${expected.item.id}`).toMatchObject({
        item: { id: expected.item.id, type: expected.item.type },
        moduleId: expected.moduleId,
        reason: 'continue',
        timeMs: 0,
      });
      expect({ progress, profile }).toEqual(before);
      if (expected.item.type === 'challenge') progress.completedChallenges.push(expected.item.id);
      else if (expected.item.type === 'solo-project') progress.passedSoloProjects.push(expected.item.id);
      else progress.completedItemIds.push(expected.item.id);
    }
    expect(getNextLearningAction(course, progress, profile)?.reason).toBe('review');
  });

  it('no confunde un fallo ajeno o histórico ya superado con una práctica pendiente', () => {
    const course = FUNDAMENTOS_COURSE;
    const item = course.modules.flatMap(module => module.items).find(item => item.type === 'debugging')!;
    const evidence = { courseId: course.id, itemId: item.id, skillId: 'variables', capability: 'debug' as const, source: 'debugging' as const };
    let profile = recordEvidence(createEmptyLearningProfile(), { ...evidence, id: 'curriculum:old-skip', result: 'failure', timestamp: 0 });
    expect(getNextLearningAction(course, empty, profile)?.reason).toBe('continue');
    profile = recordEvidence(profile, { ...evidence, id: 'checked:failed', result: 'failure', timestamp: 1 });
    expect(getNextLearningAction(course, empty, profile)).toMatchObject({ reason: 'practice', item: { id: item.id } });
    profile = recordEvidence(profile, { ...evidence, id: 'checked:passed', result: 'success', timestamp: 2 });
    profile = recordEvidence(profile, { ...evidence, id: 'checked:other', courseId: 'other', result: 'failure', timestamp: 3 });
    expect(getNextLearningAction(course, empty, profile)?.reason).toBe('continue');
  });

  it('mantiene publicados, cursos vacíos y cursos terminados sin inventar lecciones', () => {
    const original = FUNDAMENTOS_COURSE;
    const course: Course = { ...original, modules: [{ ...original.modules[0], items: original.modules[0].items.slice(0, 2).map(item => ({ ...item, availability: 'locked' as const })) }] };
    expect(getNextLearningAction(course, empty, createEmptyLearningProfile())).toBeNull();
    expect(getNextLearningAction({ ...course, modules: [] }, empty, createEmptyLearningProfile())).toBeNull();
    const completed = { ...empty, completedItemIds: original.modules.flatMap(module => module.items).map(item => item.id) };
    const action = getNextLearningAction(original, completed, createEmptyLearningProfile());
    expect(action?.reason).toBe('review');
    expect(action?.item.type).toBe('debugging');
  });

  it('recupera un reto interno pendiente aunque la reproducción de la clase haya terminado', () => {
    const lesson = FUNDAMENTOS_SCRIMS['fundamentos-01'];
    const challenge = lesson.challenges[0];
    const profile = recordEvidence(createEmptyLearningProfile(), {
      id: 'checked:internal-attempt', courseId: FUNDAMENTOS_COURSE.id,
      itemId: challenge.id, skillId: 'instruccion', capability: 'modify', source: 'challenge', result: 'failure', timestamp: 1,
    });
    const progress = { ...empty, completedItemIds: ['fundamentos-01'] };
    expect(getNextLearningAction(FUNDAMENTOS_COURSE, progress, profile, FUNDAMENTOS_SCRIMS)).toMatchObject({
      item: { id: 'fundamentos-01' }, reason: 'practice', timeMs: challenge.timestamp,
    });
    expect(getNextLearningAction(JAVASCRIPT_COURSE, progress, profile, FUNDAMENTOS_SCRIMS)?.reason).toBe('continue');
    expect(getNextLearningAction(FUNDAMENTOS_COURSE, { ...progress, completedChallenges: [challenge.id] }, profile, FUNDAMENTOS_SCRIMS)?.reason).toBe('continue');
    const resolved = recordEvidence(profile, { ...profile.evidence[0], id: 'checked:internal-solved', result: 'success', timestamp: 2 });
    expect(getNextLearningAction(FUNDAMENTOS_COURSE, progress, resolved, FUNDAMENTOS_SCRIMS)?.reason).toBe('continue');
  });
});
