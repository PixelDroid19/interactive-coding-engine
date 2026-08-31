// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { cacheLearningCenterSnapshot, getCachedLearningCenter, type LearningCenterSnapshot } from './learningCenterApi';

function snapshot(prompt: string): LearningCenterSnapshot {
  return {
    courseSlug: 'fundamentos',
    generatedAt: new Date(0).toISOString(),
    summary: {
      dueReviews: 1,
      reinforcements: 0,
      notes: 0,
      averageMastery: null,
      activeSkills: 1,
    },
    reviews: [
      {
        id: `review:${prompt}`,
        itemKey: 'fundamentos-01',
        skillKey: 'variables',
        prompt,
        intervalIndex: 0,
        dueAt: new Date(0).toISOString(),
        lastReviewedAt: null,
        repetitions: 0,
      },
    ],
    notes: [],
    reinforcements: [],
    skillGaps: [],
    recentItems: [],
  };
}

describe('caché del Centro de aprendizaje', () => {
  beforeEach(() => localStorage.clear());

  it('separa snapshots de dos userId para el mismo curso', () => {
    cacheLearningCenterSnapshot('student-a', snapshot('Solo A'));
    cacheLearningCenterSnapshot('student-b', snapshot('Solo B'));

    expect(getCachedLearningCenter('student-a', 'fundamentos')?.snapshot.reviews[0]?.prompt).toBe('Solo A');
    expect(getCachedLearningCenter('student-b', 'fundamentos')?.snapshot.reviews[0]?.prompt).toBe('Solo B');
  });

  it('purga explícitamente la caché v1 sin dueño y nunca la devuelve', () => {
    const legacyKey = 'aula_learning_center_cache_v1:30000000-0000-4000-8000-000000000003:fundamentos';
    localStorage.setItem(
      legacyKey,
      JSON.stringify({
        cachedAt: Date.now(),
        snapshot: snapshot('Dato heredado'),
      }),
    );

    expect(getCachedLearningCenter('student-a', 'fundamentos')).toBeNull();
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it('rechaza una identidad o curso vacíos antes de acceder a datos personales', () => {
    expect(() => getCachedLearningCenter('', 'fundamentos')).toThrow('Falta la identidad de la cuenta');
    expect(() => getCachedLearningCenter('student-a', '  ')).toThrow('Falta el curso');
  });
});
