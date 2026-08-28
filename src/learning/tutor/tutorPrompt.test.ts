import { describe, expect, it } from 'vitest';
import { buildTutorFileEditRequest, buildTutorPlanRepairRequest, buildTutorPlannerRequest, buildTutorResponseRequest } from './tutorPrompt';

describe('prompt del tutor socrático', () => {
  it('combina pedagogía, actividad y código sin entregar la solución inicialmente', () => {
    const input = {
      mode: 'review' as const,
      question: '¿Por qué falla mi función?',
      attemptCount: 1,
      activity: {
        courseId: 'course-javascript',
        courseTitle: 'JavaScript',
        itemId: 'javascript-05',
        itemTitle: 'Funciones',
        itemType: 'scrim' as const,
        description: 'Aprende parámetros y retorno.',
        mentalModel: 'Una función es una máquina con entrada y salida.',
        skillsRequired: ['variables'],
        skillsIntroduced: ['funciones'],
        commonMistakes: ['Confundir imprimir con devolver.'],
      },
      workspace: {
        lessonId: 'javascript-05',
        activeFilePath: 'app.js',
        files: { 'index.html': '<main></main>', 'app.js': 'function doble(numero) {\n  console.log(numero * 2);\n}' },
      },
      conversation: [],
    };
    const request = buildTutorResponseRequest(input, 'Revisa el código con evidencia.', '--- app.js\nfunction doble(numero) { console.log(numero * 2); }');

    expect(request.messages[0].content).toMatch(/termina con una pregunta breve/i);
    expect(request.messages[0].content).toMatch(/usa solo las observaciones/i);
    expect(request.messages[1].content).toContain('Confundir imprimir con devolver');
    expect(request.messages[1].content).toContain('function doble');
    expect(request.messages[1].content).toContain('Intentos observados: 1');
    expect(request.maxNewTokens).toBeLessThanOrEqual(256);
  });

  it('limita historial y código para caber en un modelo local pequeño', () => {
    const conversation = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `mensaje-${index}`,
    }));
    const request = buildTutorResponseRequest({
      mode: 'auto',
      question: 'Ayúdame a razonar.',
      attemptCount: 0,
      activity: {
        courseId: 'course-fundamentos', courseTitle: 'Fundamentos', itemId: 'f-1', itemTitle: 'Datos', itemType: 'reading',
      },
      workspace: { lessonId: 'f-1', activeFilePath: 'app.js', files: { 'app.js': 'x'.repeat(12_000) } },
      conversation,
    }, 'Ayuda a razonar.', 'Archivo consultado.');

    expect(request.messages.map((message) => message.content).join('')).not.toContain('mensaje-0');
    expect(request.messages.map((message) => message.content).join('')).toContain('mensaje-11');
    expect(request.messages.at(-1)?.content.length).toBeLessThan(7_500);
  });

  it('publica un contrato de herramientas sin incrustar el código completo en el JSON', () => {
    const request = buildTutorPlannerRequest({
      mode: 'auto', question: 'Revisa mi ejercicio.', attemptCount: 1,
      activity: { courseId: 'c', courseTitle: 'Curso', itemId: 'i', itemTitle: 'Actividad', itemType: 'debugging' },
      workspace: { activeFilePath: 'app.js', files: { 'app.js': 'const x = 1;' } },
      conversation: [],
    });
    expect(request.expectedFormat).toBe('json_object');
    expect(request.allowInvalidStructuredOutput).toBe(true);
    expect(request.messages.at(-1)?.content).toContain('write_file');
    expect(request.messages.at(-1)?.content).not.toContain('contenido completo');
  });

  it('crea una reparación acotada del plan y una generación separada para el archivo', () => {
    const input = {
      mode: 'collaborate' as const,
      question: 'Corrige app.js.',
      attemptCount: 1,
      activity: { courseId: 'c', courseTitle: 'Curso', itemId: 'i', itemTitle: 'Actividad', itemType: 'debugging' as const },
      workspace: { activeFilePath: 'app.js', files: { 'app.js': 'const x = 1;' } },
      conversation: [],
    };
    const repair = buildTutorPlanRepairRequest(input, 'texto inválido', 'Falta calls.');
    const edit = buildTutorFileEditRequest(input, 'app.js', 'const x = 1;', 'Se leyó app.js.');

    expect(repair.messages.at(-1)?.content).toContain('texto inválido');
    expect(repair.messages.at(-1)?.content).toContain('Falta calls');
    expect(edit.expectedFormat).toBeUndefined();
    expect(edit.messages.at(-1)?.content).toContain('const x = 1;');
    expect(edit.messages[0].content).toMatch(/solo el contenido completo/i);
  });
});
