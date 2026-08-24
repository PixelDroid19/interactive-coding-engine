import { compileLesson, file, workspaceOf } from '../../engine/lessonCompiler';
import { DebuggingExerciseItem, ReadingItem, ScrimCurriculumItem } from '../../types/curriculum';
import { ScrimLessonData, WorkspaceSnapshot } from '../../types/scrim';
import { BASE_CSS } from './helpers';
import { ComponentCourseLessonSpec } from './types';

function workspace(spec: ComponentCourseLessonSpec, content: string): WorkspaceSnapshot {
  return workspaceOf('app.js', {
    'index.html': file('index.html', spec.html),
    'style.css': file('style.css', BASE_CSS),
    'app.js': file('app.js', content),
  });
}

export function buildLesson(spec: ComponentCourseLessonSpec): ScrimLessonData {
  const id = `componentes-lit-${String(spec.number).padStart(2, '0')}`;
  return compileLesson({
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
    beats: [
      { type: 'chapter', title: 'Problema y contrato' },
      { type: 'speak', text: spec.script[0] },
      { type: 'speak', text: spec.script[1] },
      { type: 'chapter', title: 'Aplicación trabajada' },
      { type: 'write', filePath: 'app.js', content: spec.example, mode: 'replace' },
      { type: 'speak', text: spec.script[2] },
      { type: 'run' },
      { type: 'speak', text: spec.script[3] },
      { type: 'chapter', title: 'Decisiones y errores' },
      { type: 'speak', text: spec.script[4] },
      { type: 'chapter', title: 'Construye tu aplicación' },
      { type: 'write', filePath: 'app.js', content: spec.starter, mode: 'replace' },
      { type: 'speak', text: spec.script[5] },
      {
        type: 'challenge',
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
  });
}

export function lessonItem(lessonData: ScrimLessonData): ScrimCurriculumItem {
  return { id: lessonData.id, title: lessonData.title, type: 'scrim', estimatedMinutes: 18, description: lessonData.description, scrimDataId: lessonData.id };
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
  return {
    id: `${id}-debug`, relatedLessonId: id, title: spec.debug.title, type: 'debugging', executionMode: 'browser', estimatedMinutes: 14,
    description: 'Reproduce el fallo, explica la primera causa observable y corrige una decisión sin reescribir toda la aplicación.',
    templateId: 'vanilla-js', initialWorkspace: workspace(spec, spec.debug.starter), expectedBehavior: spec.debug.expected, observedBehavior: spec.debug.observed,
    tests: spec.debug.tests,
    hints: spec.debug.hints.map((text, index) => ({ level: index + 1, text })),
    troubleshootingTips: ['Ejecuta antes de editar y observa consola, DOM y eventos.', 'Formula una hipótesis concreta y cambia una sola causa.', 'Vuelve a probar el caso original y una variante.'],
  };
}
