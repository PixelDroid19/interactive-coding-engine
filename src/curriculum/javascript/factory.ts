import { compileLesson, file, workspaceOf } from '../../engine/lessonCompiler';
import { DebuggingExerciseItem, ReadingItem, ScrimCurriculumItem } from '../../types/curriculum';
import { ScrimLessonData, WorkspaceSnapshot } from '../../types/scrim';
import { JavaScriptLessonSpec } from './types';
import { JAVASCRIPT_AUDIO_BY_LESSON } from './audioManifest';
import { withGuidedChallenges } from '../challengeGuidance';

function readingDiagram(number: number) {
  if (number === 18) return {
    src: '/diagrams/eventloop.html',
    alt: 'Secuencia entre tarea actual, temporizador y siguiente turno del bucle de eventos',
    caption: 'Lee cada carril de izquierda a derecha. La tarea actual termina antes de que la callback del temporizador pase al siguiente turno.',
    readingQuestion: '¿Por qué B aparece después de C aunque el retraso solicitado sea cero?',
  };
  if (number === 14) return {
    src: '/diagrams/domevents.html',
    alt: 'Flujo desde un evento del navegador hasta la actualización del DOM',
    caption: 'Sigue el clic hasta el manejador; después separa la modificación del estado de la actualización visual.',
    readingQuestion: '¿Qué problema aparece si lees el valor del input antes de que ocurra el evento?',
  };
  return undefined;
}

const BASE_HTML = (title: string, moduleScript = false) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="style.css">
    <title>${title}</title>
  </head>
  <body>
    <main>
      <p class="eyebrow">Curso de JavaScript</p>
      <h1>${title}</h1>
      <p id="salida">Abre la consola o ejecuta el programa para observar el resultado.</p>
      <ul id="lista"></ul>
      <button id="accion" type="button">Probar</button>
    </main>
    <script${moduleScript ? ' type="module"' : ''} src="app.js"></script>
  </body>
</html>`;

const BASE_CSS = `html,
body {
  min-height: 100%;
  margin: 0;
  background: #11151d;
  color: #f4f4f5;
  font-family: system-ui, sans-serif;
}

body {
  padding: 30px;
}

main {
  max-width: 680px;
  margin: auto;
}

h1 {
  padding-bottom: 15px;
  border-bottom: 1px solid #394150;
  font-size: 30px;
}

.eyebrow {
  color: #ffe600;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

p,
li {
  color: #cbd5e1;
  line-height: 1.6;
}

button {
  padding: 9px 14px;
  border: 1px solid #111;
  border-radius: 8px;
  background: #ffe600;
  font-weight: 800;
}`;

function workspace(spec: JavaScriptLessonSpec, content: string): WorkspaceSnapshot {
  return workspaceOf('app.js', {
    'index.html': file('index.html', spec.html ?? BASE_HTML(spec.title, spec.number === 19)),
    'style.css': file('style.css', BASE_CSS),
    'app.js': file('app.js', content),
  });
}

export function buildLesson(spec: JavaScriptLessonSpec): ScrimLessonData {
  const id = `javascript-${String(spec.number).padStart(2, '0')}`;
  const audio = JAVASCRIPT_AUDIO_BY_LESSON[id];
  const cues = audio?.cues;
  const cueEnds = audio?.ends;
  return withGuidedChallenges(compileLesson({
    id,
    title: `${spec.number}. ${spec.title}`,
    description: spec.summary,
    executionMode: spec.executionMode ?? 'logic',
    initialWorkspace: workspace(spec, '// La clase comenzará con un ejemplo pequeño.\n'),
    concepts: spec.concepts.map((concept) => concept.label),
    skillsRequired: spec.skillsRequired,
    skillsIntroduced: spec.skillsIntroduced,
    learningObjectives: [spec.summary, 'Explicar el resultado antes de ejecutar.', 'Consultar el contrato de una API sin memorizarla.'],
    commonMistakes: [spec.reading.commonErrors],
    mentalModel: spec.reading.definition,
    frequentQuestions: spec.reading.questions,
    transferPrompt: spec.reading.transfer,
    representations: [spec.reading.walkthrough],
    masteryChecks: spec.reading.keyPoints,
    teachNotes: [
      { title: 'Idea central', body: spec.reading.definition },
      { title: 'Cómo investigarlo', body: spec.reading.investigation },
      { title: 'Error frecuente', body: spec.reading.commonErrors },
    ],
    author: { name: 'Kit', role: 'Instructor de JavaScript' },
    audioUrl: audio?.url,
    durationMs: audio?.durationMs,
    fitTimelineToDuration: Boolean(audio && !cues),
    beats: [
      { type: 'chapter', title: 'La idea antes de la sintaxis' },
      { type: 'speak', text: spec.script[0], ...(cues ? { at: cues[0] } : {}) },
      { type: 'speak', text: spec.script[1], ...(cues ? { at: cues[1] } : {}) },
      { type: 'chapter', title: 'Ejemplo trabajado', ...(cues ? { at: Math.max(0, cues[2] - 1200) } : {}) },
      { type: 'write', filePath: 'app.js', content: spec.example, mode: 'replace', ...(cues ? { at: Math.max(0, cues[2] - 900) } : {}) },
      { type: 'speak', text: spec.script[2], ...(cues ? { at: cues[2] } : {}) },
      { type: 'run', ...(cues ? { at: Math.min(audio.durationMs - 500, cues[2] + 900) } : {}) },
      { type: 'chapter', title: 'Tu turno', ...(cues ? { at: Math.max(0, cues[3] - 1200) } : {}) },
      { type: 'write', filePath: 'app.js', content: spec.starter, mode: 'replace', ...(cues ? { at: Math.max(0, cues[3] - 900) } : {}) },
      { type: 'speak', text: spec.script[3], ...(cues ? { at: cues[3] } : {}) },
      {
        type: 'challenge',
        ...(cues ? { at: Math.min(audio.durationMs - 20, (cueEnds?.[3] ?? audio.durationMs - 220) + 100) } : {}),
        challenge: {
          id: `${id}-reto`,
          title: spec.challengeTitle,
          instructions: spec.challengeInstructions,
          tests: spec.tests,
          hints: spec.hints.map((text, index) => ({ level: index + 1, title: ['Vuelve al modelo', 'Traza un caso', 'Consulta el contrato'][index], text })),
          solutionExplanation: 'Compara tu resultado con cada requisito y explica por qué funciona con datos distintos al ejemplo.',
        },
      },
    ],
  }));
}

export function lessonItem(lesson: ScrimLessonData): ScrimCurriculumItem {
  return { id: lesson.id, title: lesson.title, type: 'scrim', estimatedMinutes: Math.max(4, Math.ceil(lesson.durationMs / 60000)), description: lesson.description, scrimDataId: lesson.id };
}

export function buildReading(spec: JavaScriptLessonSpec): ReadingItem {
  const id = `javascript-${String(spec.number).padStart(2, '0')}`;
  return {
    id: `${id}-lectura`, relatedLessonId: id, practiceItemId: `${id}-debug`, title: `Lectura: ${spec.title}`, type: 'reading', estimatedMinutes: 8,
    description: 'Refuerza el modelo, aprende a consultar documentación y prepárate para practicar.', summary: spec.summary,
    sections: [
      { title: 'El concepto en palabras sencillas', content: spec.reading.definition, diagram: readingDiagram(spec.number) },
      { title: 'Otro ejemplo, paso a paso', content: spec.reading.walkthrough, example: spec.reading.secondExample, exampleCaption: 'Predice el resultado antes de ejecutarlo.' },
      { title: 'Cómo investigarlo por tu cuenta', content: spec.reading.investigation },
      { title: 'Errores comunes', content: spec.reading.commonErrors },
    ],
    keyPoints: spec.reading.keyPoints, frequentQuestions: spec.reading.questions, transferPrompt: spec.reading.transfer, sources: spec.reading.sources,
  };
}

export function buildDebug(spec: JavaScriptLessonSpec): DebuggingExerciseItem {
  const id = `javascript-${String(spec.number).padStart(2, '0')}`;
  return {
    id: `${id}-debug`, relatedLessonId: id, title: spec.debug.title, type: 'debugging', executionMode: spec.executionMode ?? 'logic', estimatedMinutes: 8,
    description: 'Reproduce el fallo, explica la primera diferencia y corrige una causa.', templateId: 'vanilla-js', initialWorkspace: workspace(spec, spec.debug.starter),
    expectedBehavior: spec.debug.expected, observedBehavior: spec.debug.observed, tests: spec.debug.tests,
    hints: spec.debug.hints.map((text, index) => ({ level: index + 1, text })),
    troubleshootingTips: ['Predice un caso antes de editar.', 'Cambia una causa y comprueba también otro dato.'],
  };
}
