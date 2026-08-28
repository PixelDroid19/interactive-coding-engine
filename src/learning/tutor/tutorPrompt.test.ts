import { describe, expect, it } from 'vitest';
import { buildSocraticTutorRequest } from './tutorPrompt';

describe('prompt del tutor socrático', () => {
  it('combina pedagogía, actividad y código sin entregar la solución inicialmente', () => {
    const request = buildSocraticTutorRequest({
      mode: 'code-review',
      question: '¿Por qué falla mi función?',
      attemptCount: 1,
      activity: {
        courseId: 'course-javascript',
        courseTitle: 'JavaScript',
        itemId: 'javascript-05',
        itemTitle: 'Funciones',
        itemType: 'scrim',
        description: 'Aprende parámetros y retorno.',
        mentalModel: 'Una función es una máquina con entrada y salida.',
        skillsRequired: ['variables'],
        skillsIntroduced: ['funciones'],
        commonMistakes: ['Confundir imprimir con devolver.'],
      },
      code: {
        lessonId: 'javascript-05',
        activeFilePath: 'app.js',
        activeContent: 'function doble(numero) {\n  console.log(numero * 2);\n}',
        files: ['index.html', 'app.js'],
      },
      conversation: [],
    });

    expect(request.messages[0].content).toMatch(/una pregunta breve por turno/i);
    expect(request.messages[0].content).toMatch(/no escribas la solución completa/i);
    expect(request.messages[1].content).toContain('Confundir imprimir con devolver');
    expect(request.messages[1].content).toContain('function doble');
    expect(request.messages[1].content).toContain('Intentos observados: 1');
    expect(request.maxNewTokens).toBeLessThanOrEqual(220);
  });

  it('limita historial y código para caber en un modelo local pequeño', () => {
    const conversation = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `mensaje-${index}`,
    }));
    const request = buildSocraticTutorRequest({
      mode: 'question',
      question: 'Ayúdame a razonar.',
      attemptCount: 0,
      activity: {
        courseId: 'course-fundamentos', courseTitle: 'Fundamentos', itemId: 'f-1', itemTitle: 'Datos', itemType: 'reading',
      },
      code: { lessonId: 'f-1', activeFilePath: 'app.js', activeContent: 'x'.repeat(12_000), files: ['app.js'] },
      conversation,
    });

    expect(request.messages.map((message) => message.content).join('')).not.toContain('mensaje-0');
    expect(request.messages.map((message) => message.content).join('')).toContain('mensaje-11');
    expect(request.messages.at(-1)?.content.length).toBeLessThan(7_500);
  });
});
