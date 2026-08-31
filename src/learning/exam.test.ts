import { describe, expect, it } from 'vitest';
import { buildExamQuestions, evaluateExamAnswers } from './exam';
import { createEmptyLearningProfile, recordEvidence } from './mastery';

describe('modo examen por capacidades', () => {
  it('elige primero habilidades débiles del curso y mezcla cuatro capacidades', () => {
    let profile = createEmptyLearningProfile();
    profile = recordEvidence(profile, { id: 'a', courseId: 'course-js', itemId: 'js-1', skillId: 'variables', capability: 'explain', result: 'success', source: 'reading', timestamp: 1 });
    profile = recordEvidence(profile, { id: 'b', courseId: 'course-js', itemId: 'js-2', skillId: 'funciones', capability: 'explain', result: 'failure', source: 'reasoning', timestamp: 2 });

    const questions = buildExamQuestions(profile, 'course-js');

    expect(questions).toHaveLength(4);
    expect(questions.map((question) => question.capability)).toEqual(['recognize', 'explain', 'modify', 'debug']);
    expect(questions.every((question) => question.skillId === 'funciones')).toBe(true);
  });

  it('clasifica verde, amarillo o rojo con criterios observables por respuesta', () => {
    const profile = createEmptyLearningProfile();
    const questions = buildExamQuestions(profile, 'course-js', ['funciones']);
    const strong = evaluateExamAnswers(questions, {
      recognize: 'Una función agrupa instrucciones reutilizables y tiene un nombre.',
      explain: 'Por ejemplo, recibe una entrada, ejecuta pasos y devuelve una salida al lugar que la llamó.',
      modify: 'Cambiaría el parámetro, probaría dos entradas diferentes y observaría la salida sin fijar el resultado.',
      debug: 'Mi hipótesis es que imprime pero no devuelve. Haría una prueba con return y revisaría el error en la consola.',
    });
    const medium = evaluateExamAnswers(questions, {
      recognize: 'Una función reutiliza instrucciones.',
      explain: 'Recibe datos y devuelve algo.',
      modify: '',
      debug: 'Revisaría el error y haría una prueba.',
    });
    const weak = evaluateExamAnswers(questions, { recognize: 'No sé', explain: '', modify: '', debug: '' });

    expect(strong.classification).toBe('green');
    expect(medium.classification).toBe('yellow');
    expect(weak.classification).toBe('red');
    expect(strong.scores.debug).toBeGreaterThan(weak.scores.debug);
  });

  it('usa un concepto visible del curso cuando todavía no existe evidencia', () => {
    const questions = buildExamQuestions(createEmptyLearningProfile(), 'course-lit', [
      { skillId: 'web-components', label: 'Web Components' },
      { skillId: 'lit', label: 'Lit' },
    ]);

    expect(questions.every((question) => question.skillId === 'web-components')).toBe(true);
    expect(questions[0].prompt).toContain('Web Components');
    expect(questions[0].prompt).not.toContain('fundamentos del curso');
  });
});
