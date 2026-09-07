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

  it('conserva respuestas sin atribuir comprensión por extensión ni palabras clave', () => {
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

    for (const evaluation of [strong, medium, weak]) {
      expect(evaluation.classification).toBe('ungraded');
      expect(evaluation.scores).toEqual({});
    }
    expect(strong.responses[1].answer).toContain('recibe una entrada');
    expect(weak.responses[0].answer).toBe('No sé');
  });

  it('un listado de palabras de la rúbrica no genera una nota ni un diagnóstico de dominio', () => {
    const questions = buildExamQuestions(createEmptyLearningProfile(), 'course-js', ['funciones']);
    const filler = 'propósito código por ejemplo entrada salida cambia prueba hipótesis error '.repeat(3);
    const result = evaluateExamAnswers(questions, { recognize: filler, explain: filler, modify: filler, debug: filler });
    expect(result.classification).toBe('ungraded');
    expect(result.scores).toEqual({});
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
