import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './course';
import { DEBUG_EXERCISES } from './debugExercises';
import { validateReasoningAttempt } from '../../engine/reasoningRunner';
import { reconstructWorkspaceAt } from '../../engine/eventLog';
import { runChallengeValidation } from '../../engine/testRunner';
import { ReasoningAttempt } from '../../types/curriculum';

describe('progresión integrada del curso de Fundamentos', () => {
  const scriptFileByLesson: Record<string, string> = {
    'fundamentos-01': '01-que-es-programar.md',
    'fundamentos-02': '02-pensamiento-computacional.md',
    'fundamentos-03': '03-variables-tipos.md',
    'fundamentos-04': '04-operadores.md',
    'fundamentos-05': '05-condicionales.md',
    'fundamentos-06': '06-bucles.md',
    'fundamentos-07': '07-funciones.md',
    'fundamentos-08': '08-arrays.md',
    'fundamentos-09': '09-objetos.md',
    'fundamentos-10': '10-dom.md',
    'fundamentos-11': '11-eventos-botones.md',
    'fundamentos-12': '12-inputs-formularios.md',
    'fundamentos-13': '13-listas-dom.md',
    'fundamentos-14': '14-proyecto-lista-tareas.md',
    'fundamentos-15': '15-depuracion.md',
    'fundamentos-16': '16-metodos-documentacion.md',
    'fundamentos-17': '17-pseudocodigo-diagramas.md',
    'fundamentos-18': '18-patrones-algoritmos.md',
    'fundamentos-19': '19-buscar-filtrar-transformar.md',
    'fundamentos-20': '20-casos-pruebas.md',
    'fundamentos-21': '21-estado-flujo.md',
    'fundamentos-22': '22-responsabilidades-modulos.md',
    'fundamentos-23': '23-arquitectura.md',
    'fundamentos-24': '24-proyecto-final.md',
  };
  const orderedScrims = FUNDAMENTOS_COURSE.modules.flatMap((module) =>
    module.items.filter((item) => item.type === 'scrim'),
  );

  it('enseña cada requisito antes de utilizarlo', () => {
    const learned = new Set<string>();

    for (const item of orderedScrims) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      expect(lesson, `Falta la cinta ${item.scrimDataId}`).toBeTruthy();

      const missing = lesson.skillsRequired.filter((skill) => !learned.has(skill));
      expect(missing, `${lesson.id} usa conocimientos todavía no enseñados`).toEqual([]);

      lesson.skillsIntroduced.forEach((skill) => learned.add(skill));
    }
  });

  it('mantiene el orden numérico y reserva las APIs del navegador para la lección 10', () => {
    const browserApi = /document\s*\.|getElementById|querySelector|addEventListener|createElement|appendChild|\.value\b/;

    expect(orderedScrims.map((item) => item.id)).toEqual(
      Array.from({ length: 24 }, (_, index) => `fundamentos-${String(index + 1).padStart(2, '0')}`),
    );

    for (const item of orderedScrims.slice(0, 9)) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      const initialSource = Object.values(lesson.initialWorkspace.files)
        .filter((file) => file.language === 'javascript' || file.language === 'typescript')
        .map((file) => file.content)
        .join('\n');
      const writtenSource = lesson.events
        .filter((event) => event.type === 'code-change')
        .flatMap((event) => [event.fullContent ?? '', ...event.changes.map((change) => change.text)])
        .join('\n');

      expect(initialSource, `${lesson.id} introduce una API del navegador antes de explicarla`).not.toMatch(browserApi);
      expect(writtenSource, `${lesson.id} escribe una API del navegador antes de explicarla`).not.toMatch(browserApi);
    }

    for (const practice of DEBUG_EXERCISES.slice(0, 9)) {
      const practiceSource = Object.values(practice.initialWorkspace.files)
        .filter((file) => file.language === 'javascript' || file.language === 'typescript')
        .map((file) => file.content)
        .join('\n');
      expect(practiceSource, `${practice.id} introduce una API del navegador antes de explicarla`).not.toMatch(browserApi);
    }
  });

  it('usa salida lógica en fundamentos puros y mini-browser solo cuando existe una interfaz', () => {
    const logicIds = [
      ...Array.from({ length: 9 }, (_, index) => `fundamentos-${String(index + 1).padStart(2, '0')}`),
      ...Array.from({ length: 9 }, (_, index) => `fundamentos-${index + 15}`),
    ];
    const browserIds = [
      ...Array.from({ length: 5 }, (_, index) => `fundamentos-${index + 10}`),
      'fundamentos-24',
    ];

    expect(logicIds.map((id) => FUNDAMENTOS_SCRIMS[id].executionMode)).toEqual(logicIds.map(() => 'logic'));
    expect(browserIds.map((id) => FUNDAMENTOS_SCRIMS[id].executionMode)).toEqual(browserIds.map(() => 'browser'));

    for (const exercise of DEBUG_EXERCISES) {
      const lesson = FUNDAMENTOS_SCRIMS[exercise.relatedLessonId!];
      expect(exercise.executionMode, `${exercise.id} no respeta el tipo de ejecución de su lección`).toBe(lesson.executionMode);
    }
  });

  it('no introduce for...of antes de explicarlo', () => {
    for (const id of ['fundamentos-13', 'fundamentos-14']) {
      const lesson = FUNDAMENTOS_SCRIMS[id];
      const source = [
        ...Object.values(lesson.initialWorkspace.files).map((file) => file.content),
        ...lesson.events
          .filter((event) => event.type === 'code-change')
          .flatMap((event) => [event.fullContent ?? '', ...event.changes.map((change) => change.text)]),
      ].join('\n');

      expect(source, `${id} usa for...of sin haberlo enseñado`).not.toMatch(/for\s*\([^;)]*\bof\b/);
      expect(lesson.audioTrack?.narrationScript.map((cue) => cue.text).join(' ')).not.toMatch(/for of/i);
    }
  });

  it('el proyecto final integra únicamente formas de sintaxis ya practicadas', () => {
    const lesson = FUNDAMENTOS_SCRIMS['fundamentos-24'];
    const source = [
      ...Object.values(lesson.initialWorkspace.files).map((file) => file.content),
      ...lesson.events
        .filter((event) => event.type === 'code-change')
        .flatMap((event) => [event.fullContent ?? '', ...event.changes.map((change) => change.text)]),
    ].join('\n');

    expect(source).not.toMatch(/\bNumber\s*\(/);
    expect(source).not.toMatch(/addEventListener\s*\([^,]+,\s*function\b/);
    expect(source).not.toMatch(/if\s*\(\s*!\s*esPlanValido/);
  });

  it('no incluye temas avanzados en el recorrido activo de principiantes', () => {
    const activeCourseCopy = FUNDAMENTOS_COURSE.modules
      .flatMap((module) => [module.title, module.description, ...module.items.map((item) => `${item.title} ${item.description}`)])
      .join('\n');

    expect(activeCourseCopy).not.toMatch(/closure|b[uú]squeda binaria|big\s*o|paradigma|pila|cola|mapa hash/i);
  });

  it('cada clase declara objetivos y errores comunes para una persona principiante', () => {
    for (const item of orderedScrims) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      expect(lesson.learningObjectives.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.commonMistakes.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.skillsIntroduced.length, lesson.id).toBeGreaterThan(0);
    }
  });

  it('las 24 clases incluyen modelo mental, dudas, representación, transferencia y dominio observable', () => {
    for (const item of orderedScrims) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      expect(lesson.mentalModel?.length, `${lesson.id} no tiene modelo mental`).toBeGreaterThan(20);
      expect(lesson.frequentQuestions?.length, `${lesson.id} no responde dudas frecuentes`).toBeGreaterThanOrEqual(3);
      expect(lesson.representations?.length, `${lesson.id} no tiene representación`).toBeGreaterThan(0);
      expect(lesson.transferPrompt?.length, `${lesson.id} no propone transferencia`).toBeGreaterThan(20);
      expect(lesson.masteryChecks?.length, `${lesson.id} no define evidencia de dominio`).toBeGreaterThanOrEqual(2);
    }
  });

  it('cada clase conduce a lectura y práctica de depuración antes de la siguiente clase', () => {
    for (const module of FUNDAMENTOS_COURSE.modules) {
      for (let index = 0; index < module.items.length; index += 1) {
        const item = module.items[index];
        if (item.type !== 'scrim') continue;

        const reading = module.items[index + 1];
        const possibleReasoning = module.items[index + 2];
        const practice = possibleReasoning?.type === 'reasoning' ? module.items[index + 3] : possibleReasoning;

        expect(reading?.type, `${item.id} no tiene lectura inmediata`).toBe('reading');
        expect(reading && 'relatedLessonId' in reading ? reading.relatedLessonId : undefined).toBe(item.id);
        if (possibleReasoning?.type === 'reasoning') {
          expect(possibleReasoning.relatedLessonId).toBe(item.id);
        }
        expect(practice?.type, `${item.id} no tiene práctica inmediata`).toBe('debugging');
        expect(practice && 'relatedLessonId' in practice ? practice.relatedLessonId : undefined).toBe(item.id);
      }
    }
  });

  it('las lecturas preparan la práctica con ejemplos y errores comunes', () => {
    const readings = FUNDAMENTOS_COURSE.modules.flatMap((module) =>
      module.items.filter((item) => item.type === 'reading'),
    );

    expect(readings).toHaveLength(orderedScrims.length);
    for (const reading of readings) {
      expect(reading.sections.some((section) => Boolean(section.example)), reading.id).toBe(true);
      expect(
        reading.sections.some((section) => /error|evita|cuidado/i.test(section.title)),
        `${reading.id} no explica errores comunes`,
      ).toBe(true);
      expect(reading.keyPoints.length, reading.id).toBeGreaterThanOrEqual(3);
      expect(reading.frequentQuestions?.length, `${reading.id} no responde dudas frecuentes`).toBeGreaterThanOrEqual(3);
      expect(reading.transferPrompt?.length, `${reading.id} no propone transferencia`).toBeGreaterThan(20);
    }
  });

  it('explica la memoria por capas sin adelantar referencias ni detalles del motor', () => {
    const readings = FUNDAMENTOS_COURSE.modules
      .flatMap((module) => module.items)
      .filter((item) => item.type === 'reading');
    const readingOf = (lessonId: string) => readings.find((reading) => reading.relatedLessonId === lessonId)!;
    const curiosityText = (lessonId: string) => readingOf(lessonId).sections
      .filter((section) => section.kind === 'curiosity')
      .map((section) => `${section.title} ${section.content} ${section.example ?? ''}`)
      .join('\n');

    const lesson03Core = readingOf('fundamentos-03').sections
      .filter((section) => section.kind !== 'curiosity')
      .map((section) => `${section.title} ${section.content} ${section.example ?? ''}`)
      .join('\n');
    const lesson03TeachingCopy = [
      ...FUNDAMENTOS_SCRIMS['fundamentos-03'].teachNotes.map((note) => `${note.title} ${note.body}`),
      ...FUNDAMENTOS_SCRIMS['fundamentos-03'].frequentQuestions.map((entry) => `${entry.question} ${entry.answer}`),
      ...FUNDAMENTOS_SCRIMS['fundamentos-03'].audioTrack.narrationScript.map((cue) => cue.text),
    ].join('\n');

    expect(lesson03Core).toMatch(/nombre.+valor|valor.+nombre/i);
    expect(lesson03Core).toMatch(/string|texto/i);
    expect(lesson03Core).toMatch(/reasign/i);
    expect(lesson03Core).not.toMatch(/array|objeto|referencia|stack|heap|pila/i);
    expect(lesson03TeachingCopy).not.toMatch(/array|objeto|referencia|stack|heap|pila/i);

    expect(curiosityText('fundamentos-03')).toMatch(/motor.+memoria/i);
    expect(curiosityText('fundamentos-03')).toMatch(/no.+direcci[oó]n|direcci[oó]n.+no/i);
    expect(curiosityText('fundamentos-09')).toMatch(/referencia/i);
    expect(curiosityText('fundamentos-09')).toMatch(/mismo objeto|mismo dato compuesto/i);
    expect(curiosityText('fundamentos-21')).toMatch(/recolector de basura/i);
    expect(curiosityText('fundamentos-21')).toMatch(/pila|stack/i);
    expect(curiosityText('fundamentos-21')).toMatch(/simplific|no garantiza/i);
  });

  it('el reto de variables plantea el objetivo sin entregar las declaraciones', () => {
    const challenge = FUNDAMENTOS_SCRIMS['fundamentos-03'].challenges.find((candidate) => candidate.id === 'reto-tres-datos')!;
    const exposedHelp = [
      challenge.instructions,
      ...challenge.tests.flatMap((test) => [test.description, test.errorMessage ?? '', test.hintTip ?? '']),
      ...challenge.hints.map((hint) => hint.text),
      ...FUNDAMENTOS_SCRIMS['fundamentos-03'].audioTrack.narrationScript
        .filter((cue) => cue.timestamp >= 96_000)
        .map((cue) => cue.text),
    ].join('\n');

    expect(exposedHelp).not.toMatch(/const\s+nombre\s*=|let\s+edad\s*=|(?:const|let)\s+listo\s*=/i);
    expect(exposedHelp).not.toMatch(/nombre\s+con\s+const|edad\s+con\s+let/i);
    expect(challenge.instructions).toMatch(/texto|n[uú]mero|boolean/i);
  });

  it('las prácticas de reglas rechazan respuestas constantes y recorren sus ramas', async () => {
    const challengeAttempts: Array<[string, string]> = [
      ['fundamentos-20', 'function esEdadValida(edad) { return edad !== 121; }'],
      ['fundamentos-21', 'function actualizarCantidad(actual, accion) { if (accion === "sumar") return actual + 1; return 0; }'],
    ];

    for (const [lessonId, source] of challengeAttempts) {
      const lesson = FUNDAMENTOS_SCRIMS[lessonId];
      const challenge = lesson.challenges[0];
      const workspace = reconstructWorkspaceAt(
        lesson.initialWorkspace,
        lesson.events,
        lesson.snapshots,
        challenge.timestamp,
      ).workspace;
      workspace.files['app.js'].content = source;
      const result = await runChallengeValidation(challenge, workspace);
      expect(result.allPassed, `${lessonId} aceptó una regla incompleta`).toBe(false);
    }

    const debugAttempts: Array<[string, string]> = [
      ['fundamentos-16-debug', 'function terminaEnJs() { return true; }'],
      ['fundamentos-17-debug', 'function clasificarSaldo(saldo) { return saldo === 0 ? "cero" : "negativo"; }'],
      ['fundamentos-19-debug', 'function contieneNumero() { return true; }'],
      ['fundamentos-20-debug', 'function enRango() { return true; }'],
      ['fundamentos-24-debug', 'function prioridadValida() { return false; }'],
    ];

    for (const [exerciseId, source] of debugAttempts) {
      const exercise = DEBUG_EXERCISES.find((candidate) => candidate.id === exerciseId)!;
      const workspace = structuredClone(exercise.initialWorkspace);
      workspace.files['app.js'].content = source;
      const result = await runChallengeValidation({
        id: exercise.id,
        title: exercise.title,
        timestamp: 0,
        instructions: exercise.description,
        tests: exercise.tests,
        hints: [],
      }, workspace);
      expect(result.allPassed, `${exerciseId} aceptó una respuesta constante`).toBe(false);
    }
  });

  it('cada lección del segundo nivel exige construir un modelo en Piensa', () => {
    const secondLevelIds = Array.from({ length: 10 }, (_, index) => `fundamentos-${index + 15}`);
    const reasoningIds = FUNDAMENTOS_COURSE.modules
      .flatMap((module) => module.items)
      .filter((item) => item.type === 'reasoning')
      .map((item) => item.relatedLessonId);

    expect(reasoningIds).toEqual(expect.arrayContaining(secondLevelIds));
  });

  it('todas las actividades Piensa tienen una solución alcanzable y referencias válidas', () => {
    const activities = FUNDAMENTOS_COURSE.modules
      .flatMap((module) => module.items)
      .filter((item) => item.type === 'reasoning');

    for (const item of activities) {
      const { activity } = item;
      let attempt: ReasoningAttempt;

      if (activity.kind === 'sequence') {
        expect(new Set(activity.steps.map((step) => step.id))).toEqual(new Set(activity.expectedOrder));
        attempt = { kind: 'sequence', order: activity.expectedOrder };
      } else if (activity.kind === 'trace-table') {
        const visibleCellIds = activity.rows.flatMap((row) => activity.columns.map((column) => `${row.id}.${column}`));
        expect(new Set(Object.keys(activity.expectedCells)), `${item.id} tiene celdas que la tabla no muestra`).toEqual(new Set(visibleCellIds));
        attempt = { kind: 'trace-table', cells: activity.expectedCells };
      } else if (activity.kind === 'decision-table') {
        expect(new Set(Object.keys(activity.expectedOutcomes))).toEqual(new Set(activity.cases.map((currentCase) => currentCase.id)));
        for (const currentCase of activity.cases) {
          expect(currentCase.options).toContain(activity.expectedOutcomes[currentCase.id]);
        }
        attempt = { kind: 'decision-table', outcomes: activity.expectedOutcomes };
      } else if (activity.kind === 'flowchart') {
        const optionKeys = new Set(activity.connectionOptions.map((connection) => JSON.stringify(connection)));
        activity.expectedConnections.forEach((connection) => expect(optionKeys).toContain(JSON.stringify(connection)));
        attempt = { kind: 'flowchart', connections: activity.expectedConnections };
      } else {
        const optionKeys = new Set(activity.dependencyOptions.map((connection) => JSON.stringify(connection)));
        activity.expectedDependencies.forEach((connection) => expect(optionKeys).toContain(JSON.stringify(connection)));
        attempt = { kind: 'dependency-map', dependencies: activity.expectedDependencies };
      }

      expect(validateReasoningAttempt(activity, attempt).allPassed, `${item.id} no puede resolverse desde su propia interfaz`).toBe(true);
    }
  });

  it('ninguna acción, reto o subtítulo queda fuera de la duración de su cinta', () => {
    for (const item of orderedScrims) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      const latestTimestamp = Math.max(
        0,
        ...lesson.events.map((event) => event.timestamp),
        ...lesson.challenges.map((challenge) => challenge.timestamp),
        ...(lesson.audioTrack?.narrationScript ?? []).map((cue) => cue.timestamp),
      );

      expect(latestTimestamp, `${lesson.id} contiene contenido después del final del audio`).toBeLessThanOrEqual(lesson.durationMs);
    }
  });

  it('cada guion coincide palabra por palabra con los subtítulos que generarán el audio', () => {
    for (const item of orderedScrims) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      const scriptPath = resolve('docs/guiones', scriptFileByLesson[lesson.id]);
      const spokenBody = readFileSync(scriptPath, 'utf8')
        .replace(/^---[\s\S]*?---\s*/, '')
        .trim()
        .replace(/\r\n/g, '\n');
      const captions = (lesson.audioTrack?.narrationScript ?? [])
        .map((cue) => cue.text)
        .join('\n\n');

      expect(spokenBody, `${lesson.id} tiene un guion distinto a sus subtítulos`).toBe(captions);
    }
  });

  it('cada guion identifica correctamente la lección y su audio generado', () => {
    for (const item of orderedScrims) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      const scriptPath = resolve('docs/guiones', scriptFileByLesson[lesson.id]);
      const script = readFileSync(scriptPath, 'utf8');
      const number = Number(lesson.id.slice(-2));
      const titleWithoutNumber = lesson.title.replace(/^\d+\.\s*/, '');

      expect(script, `${lesson.id} no declara su título correcto`).toContain(`titulo: "Lección ${number}: ${titleWithoutNumber}"`);
      expect(script, `${lesson.id} no declara el módulo`).toMatch(/^modulo:\s*.+$/m);
      expect(script, `${lesson.id} no declara el tipo`).toMatch(/^tipo:\s*scrim$/m);
      expect(script, `${lesson.id} no declara el audio`).toContain(`archivo: fundamentos-${String(number).padStart(2, '0')}.mp3`);
      expect(script, `${lesson.id} no marca que la voz fue generada`).toMatch(/^estado:\s*audio_generado$/m);
    }
  });

  it('las lecciones de segundo nivel tienen un guion específico y completo', () => {
    const seenParagraphs = new Set<string>();

    for (let number = 15; number <= 24; number += 1) {
      const id = `fundamentos-${number}`;
      const lesson = FUNDAMENTOS_SCRIMS[id];
      const captions = lesson.audioTrack?.narrationScript.map((cue) => cue.text) ?? [];
      expect(captions.length, `${id} tiene una explicación demasiado corta`).toBeGreaterThanOrEqual(10);

      for (const paragraph of captions) {
        expect(paragraph, `${id} conserva un encabezado de plantilla en lugar de una explicación hablada`).not.toMatch(/^(?:Puente con lo anterior|Problema real|Modelo mental|Representación|Ejemplo trabajado|Seguimiento|Error frecuente|Comprobación|Transferencia|Cierre)\./i);
        expect(paragraph.split(/\s+/).length, `${id} contiene una frase demasiado breve para explicar`).toBeGreaterThanOrEqual(8);
        expect(seenParagraphs.has(paragraph), `${id} repite un párrafo completo de otra lección`).toBe(false);
        seenParagraphs.add(paragraph);
      }
    }
  });

  it('cada lección carga el audio nuevo con su duración real', () => {
    for (const item of orderedScrims) {
      const lesson = FUNDAMENTOS_SCRIMS[item.scrimDataId];
      const number = lesson.id.slice(-2);
      const mp3 = resolve('public/audio', `fundamentos-${number}.mp3`);
      const metadataPath = resolve('public/audio', `fundamentos-${number}.json`);

      expect(lesson.audioTrack?.url, `${lesson.id} no carga el MP3 generado`).toBe(`/audio/fundamentos-${number}.mp3?v=gemini-20260824`);
      expect(existsSync(mp3), `${lesson.id} no tiene MP3`).toBe(true);
      expect(existsSync(metadataPath), `${lesson.id} no tiene metadatos de audio`).toBe(true);
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as { durationMs: number; engine: string; voice: string; script: string };
      expect(metadata.durationMs, `${lesson.id} no usa la duración medida`).toBe(lesson.durationMs);
      expect(metadata.engine, `${lesson.id} usa otro modelo de voz`).toBe('gemini-3.1-flash-tts-preview');
      expect(metadata.voice, `${lesson.id} usa otra voz`).toBe('Aoede');
      expect(metadata.script, `${lesson.id} no registra su guion`).toBe(`docs/guiones/${scriptFileByLesson[lesson.id]}`);
    }
  });

  it('las prácticas avanzadas usan más de un caso para evitar soluciones fijadas al ejemplo', () => {
    for (const exercise of DEBUG_EXERCISES.filter((item) => Number(item.relatedLessonId?.slice(-2)) >= 15)) {
      expect(exercise.tests.length, `${exercise.id} solo comprueba un ejemplo`).toBeGreaterThanOrEqual(2);
    }
  });
});
