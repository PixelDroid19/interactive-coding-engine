import { describe, expect, it } from 'vitest';
import { createEmptyLearningProfile } from './mastery';
import { upsertTutorReinforcement } from './curriculumEvidence';

describe('feedback persistente del tutor', () => {
  it('acumula evidencia sobre el mismo concepto sin duplicar tarjetas', () => {
    const first = upsertTutorReinforcement(createEmptyLearningProfile(0), {
      courseId: 'course-javascript',
      itemId: 'javascript-05',
      skillId: 'return-values',
      note: 'Distingue mostrar un valor de devolverlo.',
      evidence: 'Dos intentos usaron console.log en lugar de return.',
    }, 100);
    const second = upsertTutorReinforcement(first, {
      courseId: 'course-javascript',
      itemId: 'javascript-05',
      skillId: 'return-values',
      note: 'Comprueba qué recibe quien llama a la función.',
      evidence: 'La comprobación volvió a fallar por no devolver el valor.',
    }, 200);

    expect(second.tutor.reinforcements).toHaveLength(1);
    expect(second.tutor.reinforcements[0]).toMatchObject({
      skillId: 'return-values',
      occurrences: 2,
      note: 'Comprueba qué recibe quien llama a la función.',
      updatedAt: 200,
      reviewed: false,
    });
  });
});
