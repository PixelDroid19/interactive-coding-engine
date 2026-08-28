import { describe, expect, it } from 'vitest';
import { createEmptyLearningProfile, recordEvidence } from './mastery';
import { LocalLearningRepository, type StorageLike } from './localLearningRepository';
import { scheduleReview } from './reviewScheduler';

function memoryStorage(seed: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

describe('dominio de aprendizaje', () => {
  it('registra evidencia por habilidad y capacidad sin confundir completar con dominar', () => {
    const base = createEmptyLearningProfile(1_000);
    const afterReading = recordEvidence(base, {
      id: 'e-1',
      courseId: 'fundamentos',
      itemId: 'fundamentos-reading-03',
      skillId: 'variables',
      capability: 'recognize',
      result: 'success',
      source: 'reading',
      timestamp: 2_000,
    });
    const afterChallenge = recordEvidence(afterReading, {
      id: 'e-2',
      courseId: 'fundamentos',
      itemId: 'fundamentos-03',
      skillId: 'variables',
      capability: 'produce',
      result: 'partial',
      source: 'challenge',
      timestamp: 3_000,
    });

    expect(afterChallenge.skills.variables.capabilities.recognize).toMatchObject({ score: 1, attempts: 1 });
    expect(afterChallenge.skills.variables.capabilities.produce).toMatchObject({ score: 0.55, attempts: 1 });
    expect(afterChallenge.skills.variables.capabilities.debug).toBeUndefined();
    expect(afterChallenge.evidence).toHaveLength(2);
  });

  it('pondera intentos recientes y conserva un historial acotado', () => {
    let profile = createEmptyLearningProfile(0);
    for (let index = 0; index < 230; index += 1) {
      profile = recordEvidence(profile, {
        id: `e-${index}`,
        courseId: 'javascript',
        itemId: 'js-01',
        skillId: 'funciones',
        capability: 'explain',
        result: index === 229 ? 'success' : 'failure',
        source: 'reasoning',
        timestamp: index + 1,
      });
    }

    expect(profile.evidence).toHaveLength(200);
    expect(profile.skills.funciones.capabilities.explain?.score).toBeGreaterThan(0.4);
    expect(profile.updatedAt).toBe(230);
  });

  it('programa repasos a 1, 3, 7, 14 y 30 días según el resultado', () => {
    const day = 86_400_000;
    const base = {
      id: 'review:variables',
      courseId: 'fundamentos',
      itemId: 'fundamentos-03',
      skillId: 'variables',
      prompt: 'Explica qué conserva una variable.',
      intervalIndex: 0,
      dueAt: 0,
      lastReviewedAt: 0,
      repetitions: 0,
    };

    const good = scheduleReview(base, 'good', 10 * day);
    const next = scheduleReview(good, 'good', 13 * day);
    const easy = scheduleReview(next, 'easy', 20 * day);
    const again = scheduleReview(easy, 'again', 50 * day);

    expect(good.dueAt).toBe(13 * day);
    expect(next.dueAt).toBe(20 * day);
    expect(easy.dueAt).toBe(50 * day);
    expect(again.dueAt).toBe(51 * day);
    expect(again.intervalIndex).toBe(0);
  });

  it('persiste detrás de un repositorio y recupera datos corruptos sin romper la app', async () => {
    const repository = new LocalLearningRepository(memoryStorage());
    const first = await repository.load();
    await repository.update((profile) => recordEvidence(profile, {
      id: 'e-1',
      courseId: 'lit',
      itemId: 'lit-01',
      skillId: 'web-components',
      capability: 'recognize',
      result: 'success',
      source: 'lesson',
      timestamp: 4_000,
    }));
    const loaded = await repository.load();

    expect(first.version).toBe(1);
    expect(loaded.skills['web-components'].capabilities.recognize?.score).toBe(1);

    const corrupt = new LocalLearningRepository(memoryStorage({ aula_learning_profile_v1: '{no-json' }));
    await expect(corrupt.load()).resolves.toMatchObject({ version: 1, evidence: [] });
  });

  it('serializa el perfil con un contrato estable que podrá usar un adaptador HTTP', async () => {
    const storage = memoryStorage();
    const repository = new LocalLearningRepository(storage);
    const profile = createEmptyLearningProfile(9_000);

    await repository.save(profile);
    const loaded = await repository.load();

    expect(loaded).toEqual(profile);
    expect(Object.keys(loaded).sort()).toEqual([
      'evidence',
      'exams',
      'notebook',
      'reviews',
      'skills',
      'tutor',
      'updatedAt',
      'version',
    ]);
  });
});
