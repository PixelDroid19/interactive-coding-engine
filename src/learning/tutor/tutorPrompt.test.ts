import { describe, expect, it } from 'vitest';
import { buildTutorFileEditRequest, buildTutorPlanRepairRequest, buildTutorPlannerRequest, buildTutorResponseRequest, tutorHintFilePaths } from './tutorPrompt';

describe('prompt del tutor socrático', () => {
  it('transmite el requisito de reparación también a las explicaciones', () => {
    const input = { mode: 'explain' as const, question: 'Explica.', attemptCount: 1,
      activity: { courseId: 'lit', courseTitle: 'Lit', itemId: 'd', itemTitle: 'Ciclo', itemType: 'debugging' as const },
      workspace: null, conversation: [] };
    const request = buildTutorResponseRequest(input, 'Archivo leído.', 'La respuesta se cortó; vuelve a escribirla brevemente.');
    expect(request.messages[0].content).toContain('La respuesta se cortó; vuelve a escribirla brevemente.');
  });

  it('pide respuestas directas en cada fase y no reenvía borradores internos anteriores', () => {
    const input = {
      mode: 'explain' as const, question: 'Explica total.', attemptCount: 1,
      activity: { courseId: 'lit', courseTitle: 'Lit', itemId: 'd', itemTitle: 'Ciclo', itemType: 'debugging' as const },
      workspace: { activeFilePath: 'app.js', files: { 'app.js': 'this.total = 10;' } },
      conversation: [
        { role: 'user' as const, content: '¿Qué significa <think>?' },
        { role: 'assistant' as const, content: '<think>Unfinished internal draft' },
        { role: 'assistant' as const, content: 'Una propiedad reactiva solicita una actualización.' },
      ],
    };
    const response = buildTutorResponseRequest(input, 'Archivo leído.');
    for (const request of [response, buildTutorPlannerRequest(input), buildTutorPlanRepairRequest(input, '{}', 'Sin llamadas'),
      buildTutorFileEditRequest(input, 'app.js', 'this.total = 10;', 'Archivo leído.')]) {
      expect(request.enableThinking).toBe(false);
    }
    expect(response.messages.some(message => message.content.includes('Unfinished internal draft'))).toBe(false);
    expect(response.messages.some(message => message.content === '¿Qué significa <think>?')).toBe(true);
    expect(response.messages.some(message => message.content === 'Una propiedad reactiva solicita una actualización.')).toBe(true);
  });

  it('acota las lecturas a referencias directas existentes, sin recorrer dependencias ni repetir archivos', () => {
    expect(tutorHintFilePaths({ activeFilePath: 'index.html', files: {
      'index.html': '<script src="missing.js"></script><script src="a.js"></script><script src="a.js"></script><script src="b.js"></script><script src="c.js"></script>',
      'a.js': 'import "./nested.js";', 'b.js': '', 'c.js': '', 'nested.js': '',
    } })).toEqual(['index.html', 'a.js', 'b.js']);
    expect(tutorHintFilePaths({ activeFilePath: 'missing.html', files: { 'app.js': '' } })).toEqual([]);
  });

  it('incluye el JavaScript local enlazado desde el HTML sin cargar archivos ajenos', () => {
    const request = buildTutorResponseRequest({
      mode: 'hint', question: '¿Por qué mi etiqueta no está registrada?', attemptCount: 1,
      activity: { courseId: 'lit', courseTitle: 'Lit', itemId: 'debug-1', itemTitle: 'Registro', itemType: 'debugging' },
      workspace: { activeFilePath: 'demo/index.html', files: {
        'demo/index.html': '<alerta-app></alerta-app><script src="../src/app.js" type="module"></script>',
        'src/app.js': 'customElements.define("alertas-app", AlertaApp);',
        'unrelated.js': 'const unrelatedMarker = 92841;',
      } }, conversation: [],
    }, '0 de 2 comprobaciones superadas.');
    const evidence = request.messages.at(-1)?.content ?? '';
    expect(evidence).toContain('customElements.define("alertas-app", AlertaApp);');
    expect(evidence).toContain('<alerta-app>');
    expect(evidence).not.toContain('unrelatedMarker');
  });

  it('incluye el archivo real aunque el plan solo haya consultado diagnósticos', () => {
    const request = buildTutorResponseRequest({
      mode: 'hint', question: 'Compara las dos llamadas.', attemptCount: 0,
      activity: { courseId: 'js', courseTitle: 'JavaScript', itemId: 'debug-1', itemTitle: 'Dos llamadas', itemType: 'debugging' },
      workspace: { activeFilePath: 'app.js', files: { 'app.js': 'console.log("Preparar");\nconsole.log("Ejecutar";' } },
      conversation: [],
    }, 'Dos errores de sintaxis.');
    expect(request.messages.at(-1)?.content).toContain('console.log("Preparar");\nconsole.log("Ejecutar";');
    expect(request.messages[0].content).not.toContain('Comenta read_diagnostics.');
  });

  it('reserva espacio para un módulo relativo aunque el archivo activo sea largo y no sigue URLs externas', () => {
    const request = buildTutorResponseRequest({
      mode: 'hint', question: 'Ayúdame con el contrato de la función importada.', attemptCount: 1,
      activity: { courseId: 'js', courseTitle: 'JavaScript', itemId: 'debug-2', itemTitle: 'Módulos', itemType: 'debugging' },
      workspace: { activeFilePath: 'src/app.js', files: {
        'src/app.js': 'import { total } from "./reglas.js";\nimport "https://external.test/private.js";\n' + '/* ejemplo */\n'.repeat(1000),
        'src/reglas.js': 'export function total(precio, cantidad) { return precio + cantidad; }',
        'https://external.test/private.js': 'externalPrivateMarker',
      } }, conversation: [],
    }, '');
    const evidence = request.messages.at(-1)?.content ?? '';
    expect(evidence).toContain('return precio + cantidad');
    expect(evidence).not.toContain('externalPrivateMarker');
    expect(evidence.length).toBeLessThan(4500);
  });

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
    const request = buildTutorResponseRequest(input, '--- app.js\nfunction doble(numero) { console.log(numero * 2); }');

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
    }, 'Archivo consultado.');

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
    expect(request.expectedJsonSchema).toMatchObject({
      type: 'object',
      properties: {
        calls: { type: 'array', maxItems: 3 },
      },
    });
    expect(JSON.stringify(request.expectedJsonSchema)).toContain('write_file');
    expect(request.messages.at(-1)?.content).toContain('write_file');
    expect(request.messages.at(-1)?.content).not.toContain('contenido completo');
  });

  it('no consume salida local en una estrategia que la respuesta final no usa', () => {
    const request = buildTutorPlannerRequest({
      mode: 'explain', question: 'Explica mi función.', attemptCount: 1,
      activity: { courseId: 'js', courseTitle: 'JavaScript', itemId: 'j-1', itemTitle: 'Funciones', itemType: 'scrim' },
      workspace: { activeFilePath: 'app.js', files: { 'app.js': 'function doble(x) { return x * 2; }' } },
      conversation: [],
    });

    expect(request.expectedJsonKeys).toEqual(['calls']);
    expect(request.expectedJsonSchema).not.toHaveProperty('properties.replyStrategy');
    expect(request.messages.map(message => message.content).join('\n')).not.toContain('replyStrategy');
    expect(request.maxNewTokens).toBeLessThanOrEqual(180);
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
    expect(edit.messages.at(-1)?.content.trim().endsWith('REQUISITO PRINCIPAL: Corrige app.js.')).toBe(true);
    expect(edit.messages[0].content).toMatch(/solo el contenido completo/i);
  });
});
