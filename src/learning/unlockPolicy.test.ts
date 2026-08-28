import { describe, expect, it } from 'vitest';
import type { Course } from '../types/curriculum';
import { createEmptyLearningProfile, recordEvidence } from './mastery';
import type { CurriculumSkillTarget } from './curriculumSkills';
import { getItemReadiness } from './unlockPolicy';

const course: Course = {
  id: 'course-test', title: 'Curso', slug: 'curso', tagline: '', description: '', level: 'Beginner', tags: [],
  instructor: { name: 'Ada', role: 'Tutora' },
  modules: [{
    id: 'm1', title: 'Módulo', items: [
      { id: 'read-1', type: 'reading', title: 'Lee variables', estimatedMinutes: 2, summary: '', sections: [], keyPoints: [], relatedLessonId: 'lesson-1' },
      { id: 'lesson-item-1', type: 'scrim', title: 'Variables', estimatedMinutes: 4, scrimDataId: 'lesson-1' },
      { id: 'debug-1', type: 'debugging', title: 'Depura variables', estimatedMinutes: 3, relatedLessonId: 'lesson-1', executionMode: 'logic', templateId: 'js-only', initialWorkspace: { files: {}, activeFilePath: '' }, expectedBehavior: '', observedBehavior: '', hints: [], tests: [] },
      { id: 'read-2', type: 'reading', title: 'Lee funciones', estimatedMinutes: 2, summary: '', sections: [], keyPoints: [], relatedLessonId: 'lesson-2' },
      { id: 'lesson-item-2', type: 'scrim', title: 'Funciones', estimatedMinutes: 4, scrimDataId: 'lesson-2' },
    ],
  }],
};

const index: Record<string, CurriculumSkillTarget> = {
  'read-1': { courseId: course.id, itemId: 'read-1', lessonId: 'lesson-1', skillIds: ['variables'], capability: 'explain', source: 'reading' },
  'lesson-item-1': { courseId: course.id, itemId: 'lesson-item-1', lessonId: 'lesson-1', skillIds: ['variables'], capability: 'recognize', source: 'lesson' },
  'debug-1': { courseId: course.id, itemId: 'debug-1', lessonId: 'lesson-1', skillIds: ['variables'], capability: 'debug', source: 'debugging' },
  'challenge-1': { courseId: course.id, itemId: 'challenge-1', lessonId: 'lesson-1', skillIds: ['variables'], capability: 'modify', source: 'challenge' },
  'read-2': { courseId: course.id, itemId: 'read-2', lessonId: 'lesson-2', skillIds: ['funciones'], capability: 'explain', source: 'reading' },
  'lesson-item-2': { courseId: course.id, itemId: 'lesson-item-2', lessonId: 'lesson-2', skillIds: ['funciones'], capability: 'recognize', source: 'lesson' },
};

describe('puerta de dominio acumulativa', () => {
  it('deja abierto el primer grupo completo y bloquea el siguiente con recuperación concreta', () => {
    const profile = createEmptyLearningProfile();

    expect(getItemReadiness(course, 'debug-1', profile, index).unlocked).toBe(true);
    expect(getItemReadiness(course, 'read-2', profile, index)).toMatchObject({
      unlocked: false,
      recoveryItemId: 'read-1',
    });
    expect(getItemReadiness(course, 'read-2', profile, index).message).toMatch(/variables/i);
  });

  it('no confunde reconocer con aplicar: exige evidencia práctica antes de avanzar', () => {
    let profile = createEmptyLearningProfile();
    profile = recordEvidence(profile, { id: 'r', courseId: course.id, itemId: 'lesson-item-1', skillId: 'variables', capability: 'recognize', result: 'success', source: 'lesson', timestamp: 1 });
    profile = recordEvidence(profile, { id: 'e', courseId: course.id, itemId: 'read-1', skillId: 'variables', capability: 'explain', result: 'success', source: 'reading', timestamp: 2 });

    const readiness = getItemReadiness(course, 'read-2', profile, index);
    expect(readiness.unlocked).toBe(false);
    expect(readiness.missing.some((gap) => gap.capability === 'modify')).toBe(true);
    expect(readiness.recoveryItemId).toBe('lesson-item-1');
  });

  it('desbloquea el siguiente grupo cuando comprende y modifica con entradas variables', () => {
    let profile = createEmptyLearningProfile();
    profile = recordEvidence(profile, { id: 'e', courseId: course.id, itemId: 'read-1', skillId: 'variables', capability: 'explain', result: 'success', source: 'reading', timestamp: 1 });
    profile = recordEvidence(profile, { id: 'm', courseId: course.id, itemId: 'challenge-1', skillId: 'variables', capability: 'modify', result: 'success', source: 'challenge', timestamp: 2 });

    expect(getItemReadiness(course, 'lesson-item-2', profile, index)).toMatchObject({ unlocked: true, missing: [] });
  });
});
