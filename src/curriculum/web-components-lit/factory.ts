import { compileLesson, file, workspaceOf } from '../../engine/lessonCompiler';
import { DebuggingExerciseItem, ReadingItem, ScrimCurriculumItem } from '../../types/curriculum';
import { ScrimLessonData, WorkspaceSnapshot } from '../../types/scrim';
import { appHtml, BASE_CSS } from './helpers';
import { ComponentCourseLessonSpec } from './types';
import { COMPONENT_AUDIO_BY_LESSON } from './audioManifest';
import { withGuidedChallenges } from '../challengeGuidance';

function workspace(spec: ComponentCourseLessonSpec, content: string, html = spec.html): WorkspaceSnapshot {
  return workspaceOf('app.js', {
    'index.html': file('index.html', html),
    'style.css': file('style.css', BASE_CSS),
    'app.js': file('app.js', content),
    ...Object.fromEntries(
      Object.entries(spec.supportFiles || {}).map(([path, fileContent]) => [path, file(path, fileContent)]),
    ),
  });
}

function debugElementTag(spec: ComponentCourseLessonSpec): string {
  const browserContract = spec.debug.tests
    .find((test) => test.validatorType === 'browser-script')
    ?.customValidatorScript;
  const contractTag = browserContract?.match(/whenDefined\s*\(\s*['"]([^'"]+)/)?.[1];
  if (contractTag) return contractTag;

  const registeredTags = [...spec.debug.starter.matchAll(
    /customElements\.define\s*\(\s*['"]([^'"]+)/g,
  )].map((match) => match[1]);
  const registeredTag = registeredTags.at(-1);
  if (!registeredTag) throw new Error(`El laboratorio ${spec.number} no declara qué componente debe montar.`);
  return registeredTag;
}

function examplePage(spec: ComponentCourseLessonSpec): string {
  const registeredTags = [...spec.example.matchAll(
    /customElements\.define\s*\(\s*['"]([^'"]+)/g,
  )].map((match) => match[1]);
  const elementTag = registeredTags.at(-1);
  const markup = elementTag
    ? `<${elementTag}></${elementTag}>`
    : '<p>Abre la consola para seguir la salida del ejemplo.</p>';
  return appHtml(`Demostración: ${spec.title}`, markup);
}

export function buildLesson(spec: ComponentCourseLessonSpec): ScrimLessonData {
  const id = `componentes-lit-${String(spec.number).padStart(2, '0')}`;
  const audio = COMPONENT_AUDIO_BY_LESSON[id];
  const cues = audio?.cues;
  const ends = audio?.ends;
  const demoPage = examplePage(spec);
  return withGuidedChallenges(compileLesson({
    id,
    title: `${spec.number}. ${spec.title}`,
    description: spec.summary,
    templateId: 'lit',
    executionMode: 'browser',
    initialWorkspace: workspace(spec, '// La explicación comenzará con un modelo y después construirá otra aplicación.\n'),
    concepts: spec.concepts.map((concept) => concept.label),
    skillsRequired: spec.skillsRequired,
    skillsIntroduced: spec.skillsIntroduced,
    learningObjectives: [spec.summary, `Construir ${spec.appName} sin copiar el ejemplo.`, 'Explicar el contrato público y comprobarlo en el navegador.'],
    commonMistakes: [spec.reading.commonErrors],
    mentalModel: spec.reading.mentalModel,
    frequentQuestions: spec.reading.questions,
    representations: [spec.reading.diagram],
    transferPrompt: spec.reading.transfer,
    masteryChecks: spec.reading.keyPoints,
    teachNotes: [
      { title: 'Modelo mental', body: spec.reading.mentalModel },
      { title: 'Cuándo usarlo', body: spec.reading.whenToUse },
      { title: 'Buena práctica', body: spec.reading.bestPractices },
    ],
    author: { name: 'Kit', role: 'Mentor de componentes web' },
    audioUrl: audio?.url,
    durationMs: audio?.durationMs,
    fitTimelineToDuration: Boolean(audio && !cues),
    beats: [
      { type: 'chapter', title: 'Problema y contrato', ...(cues ? { at: Math.max(0, cues[0] - 350) } : {}) },
      { type: 'speak', text: spec.script[0], ...(cues ? { at: cues[0] } : {}) },
      { type: 'speak', text: spec.script[1], ...(cues ? { at: cues[1] } : {}) },
      { type: 'chapter', title: 'Aplicación trabajada', ...(cues ? { at: Math.max(0, cues[2] - 1_200) } : {}) },
      { type: 'write', filePath: 'index.html', content: demoPage, mode: 'replace', ...(cues ? { at: Math.max(0, cues[2] - 1_100) } : {}) },
      { type: 'write', filePath: 'app.js', content: spec.example, mode: 'replace', ...(cues ? { at: Math.max(0, cues[2] - 900) } : {}) },
      { type: 'speak', text: spec.script[2], ...(cues ? { at: cues[2] } : {}) },
      { type: 'run', ...(cues ? { at: Math.max(cues[2] + 500, (ends?.[2] ?? cues[3]) - 700) } : {}) },
      { type: 'speak', text: spec.script[3], ...(cues ? { at: cues[3] } : {}) },
      { type: 'chapter', title: 'Decisiones y errores', ...(cues ? { at: Math.max(0, cues[4] - 1_200) } : {}) },
      { type: 'speak', text: spec.script[4], ...(cues ? { at: cues[4] } : {}) },
      { type: 'chapter', title: 'Construye tu aplicación', ...(cues ? { at: Math.max(0, cues[5] - 1_200) } : {}) },
      { type: 'write', filePath: 'index.html', content: spec.html, mode: 'replace', ...(cues ? { at: Math.max(0, cues[5] - 1_100) } : {}) },
      { type: 'write', filePath: 'app.js', content: spec.starter, mode: 'replace', ...(cues ? { at: Math.max(0, cues[5] - 900) } : {}) },
      { type: 'speak', text: spec.script[5], ...(cues ? { at: cues[5] } : {}) },
      {
        type: 'challenge',
        ...(cues ? { at: Math.min(audio.durationMs - 20, (ends?.[5] ?? audio.durationMs - 220) + 100) } : {}),
        challenge: {
          id: `${id}-app`,
          title: spec.challengeTitle,
          instructions: spec.challengeInstructions,
          tests: spec.tests,
          hints: spec.hints.map((text, index) => ({ level: index + 1, title: ['Vuelve al contrato', 'Traza el ciclo', 'Comprueba en el navegador'][index], text })),
          solutionExplanation: 'Compara el comportamiento con el contrato, prueba otra entrada y explica por qué tu componente sigue funcionando.',
        },
      },
    ],
  }));
}

export function lessonItem(lessonData: ScrimLessonData): ScrimCurriculumItem {
  return { id: lessonData.id, title: lessonData.title, type: 'scrim', estimatedMinutes: Math.max(4, Math.ceil(lessonData.durationMs / 60_000)), description: lessonData.description, scrimDataId: lessonData.id };
}

export function buildReading(spec: ComponentCourseLessonSpec): ReadingItem {
  const id = `componentes-lit-${String(spec.number).padStart(2, '0')}`;
  return {
    id: `${id}-lectura`, relatedLessonId: id, practiceItemId: `${id}-debug`, title: `Lectura: ${spec.title}`, type: 'reading', estimatedMinutes: 14,
    description: `Profundiza antes de construir ${spec.appName}.`, summary: spec.summary,
    sections: [
      { title: 'Modelo mental y contrato', content: spec.reading.mentalModel },
      { title: 'Otro caso, paso a paso', content: spec.reading.walkthrough, example: spec.reading.secondExample, exampleCaption: 'Predice el flujo antes de ejecutar.' },
      { title: 'Cuándo usarlo y cuándo no', content: spec.reading.whenToUse },
      { title: 'Buenas prácticas de trabajo', content: spec.reading.bestPractices },
      { title: 'Cómo investigarlo', content: spec.reading.investigation },
      { title: 'Errores frecuentes', content: spec.reading.commonErrors },
      { title: 'Diagrama para razonar', content: spec.reading.diagram },
    ],
    keyPoints: spec.reading.keyPoints,
    frequentQuestions: spec.reading.questions,
    transferPrompt: spec.reading.transfer,
    sources: spec.reading.sources,
  };
}

export function buildDebug(spec: ComponentCourseLessonSpec): DebuggingExerciseItem {
  const id = `componentes-lit-${String(spec.number).padStart(2, '0')}`;
  const elementTag = debugElementTag(spec);
  const debugPage = appHtml(`Depura: ${spec.debug.title}`, `<${elementTag}></${elementTag}>`);
  return {
    id: `${id}-debug`, relatedLessonId: id, title: spec.debug.title, type: 'debugging', executionMode: 'browser', estimatedMinutes: 14,
    description: 'Reproduce el fallo, explica la primera causa observable y corrige una decisión sin reescribir toda la aplicación.',
    templateId: 'vanilla-js', initialWorkspace: workspace(spec, spec.debug.starter, debugPage), expectedBehavior: spec.debug.expected, observedBehavior: spec.debug.observed,
    tests: spec.debug.tests,
    hints: spec.debug.hints.map((text, index) => ({ level: index + 1, text })),
    troubleshootingTips: ['Ejecuta antes de editar y observa consola, DOM y eventos.', 'Formula una hipótesis concreta y cambia una sola causa.', 'Vuelve a probar el caso original y una variante.'],
  };
}
