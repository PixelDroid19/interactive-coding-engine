import { compileLesson, file, workspaceOf } from '../../engine/lessonCompiler';
import type {
  DebuggingExerciseItem,
  ReadingItem,
  ReasoningExerciseItem,
  ScrimCurriculumItem,
} from '../../types/curriculum';
import type {
  ChallengeTest,
  CourseLanguage,
  LanguageVariants,
  ScrimLessonData,
  WorkspaceSnapshot,
} from '../../types/scrim';
import { withGuidedChallenges } from '../challengeGuidance';
import { AI_INTERACTIVE_LABS } from './interactiveLabs';
import { sourcesFor } from './sources';
import type { AIEngineerLessonSpec, AILanguageCode } from './types';

export interface AILessonBundle {
  lesson: ScrimLessonData;
  item: ScrimCurriculumItem;
  reading: ReadingItem;
  reasoning: ReasoningExerciseItem;
  debug: DebuggingExerciseItem;
  solutions: { javascript: string; python: string };
}

function lessonId(number: number) {
  return `ai-engineer-${String(number).padStart(2, '0')}`;
}

function workspace(language: CourseLanguage, content: string): WorkspaceSnapshot {
  const path = language === 'python' ? 'main.py' : 'app.js';
  return workspaceOf(path, {
    [path]: file(path, content, language === 'python' ? 'python' : 'javascript'),
  });
}

function testsFor(spec: AIEngineerLessonSpec): ChallengeTest[] {
  return spec.practice.cases.map((testCase, index) => ({
    id: `${lessonId(spec.number)}-caso-${index + 1}`,
    description: testCase.description,
    validatorType: 'function-call',
    targetFunction: spec.practice.functionName,
    args: structuredClone(testCase.args),
    expectedReturn: structuredClone(testCase.expected),
    errorMessage: `La función debe cumplir este caso sin depender de los valores del ejemplo: ${testCase.description}.`,
    hintTip: spec.practice.hints[Math.min(index, spec.practice.hints.length - 1)],
  }));
}

function compileLanguageLesson(
  spec: AIEngineerLessonSpec,
  language: CourseLanguage,
  code: AILanguageCode,
): ScrimLessonData {
  const id = lessonId(spec.number);
  const path = language === 'python' ? 'main.py' : 'app.js';
  const comment = language === 'python'
    ? '# La explicación construirá un ejemplo pequeño.\n'
    : '// La explicación construirá un ejemplo pequeño.\n';
  return compileLesson({
    id,
    title: `${spec.number}. ${spec.title}`,
    description: spec.summary,
    executionMode: 'logic',
    initialWorkspace: workspace(language, comment),
    concepts: spec.concepts.map((concept) => concept.label),
    skillsRequired: spec.skillsRequired,
    skillsIntroduced: spec.skillsIntroduced,
    learningObjectives: [
      spec.summary,
      'Predecir el resultado de un caso antes de ejecutar.',
      'Explicar qué parte pertenece al modelo y qué parte controla el programa.',
      ...(spec.capacidad ? [`Integrar ${spec.capacidad.nombre} en el chat del curso.`] : []),
    ],
    commonMistakes: [spec.reading.sections[3].content],
    mentalModel: spec.mentalModel,
    frequentQuestions: spec.reading.questions,
    transferPrompt: spec.reading.transfer,
    representations: [spec.reasoning.activity.prompt],
    masteryChecks: spec.reading.keyPoints,
    teachNotes: spec.reading.sections.map((section) => ({ title: section.title, body: section.content })),
    author: { name: 'Kit', role: 'Instructor de ingeniería de IA' },
    beats: [
      { type: 'chapter', title: 'La idea antes del código' },
      { type: 'speak', text: spec.script[0] },
      { type: 'speak', text: spec.script[1] },
      { type: 'chapter', title: 'Ejemplo trabajado' },
      { type: 'write', filePath: path, content: code.example, mode: 'replace' },
      { type: 'speak', text: spec.script[2] },
      { type: 'run' },
      { type: 'chapter', title: 'Tu turno' },
      { type: 'write', filePath: path, content: code.starter, mode: 'replace' },
      { type: 'speak', text: spec.script[3] },
      {
        type: 'challenge',
        challenge: {
          id: `${id}-reto`,
          title: spec.practice.title,
          instructions: spec.practice.instructions,
          tests: testsFor(spec),
          hints: spec.practice.hints.map((text, index) => ({
            level: index + 1,
            title: ['Vuelve al contrato', 'Traza dos casos', 'Revisa el tipo de retorno'][index],
            text,
          })),
          solutionExplanation: 'La comprobación llama tu función con valores distintos. Una solución correcta usa los argumentos y conserva el contrato observable.',
        },
      },
    ],
  });
}

function variantFromLesson(
  lesson: ScrimLessonData,
  tests: ChallengeTest[],
  packages: string[] | undefined,
) {
  return {
    workspace: structuredClone(lesson.initialWorkspace),
    tests: structuredClone(tests),
    ...(packages ? { packages: [...packages] } : {}),
    lessonTape: {
      events: structuredClone(lesson.events),
      snapshots: structuredClone(lesson.snapshots),
      challenges: structuredClone(lesson.challenges),
      chapters: structuredClone(lesson.chapters ?? []),
      durationMs: lesson.durationMs,
    },
  };
}

export function buildAiLessonBundle(spec: AIEngineerLessonSpec): AILessonBundle {
  const id = lessonId(spec.number);
  const tests = testsFor(spec);
  const jsLesson = compileLanguageLesson(spec, 'javascript', spec.javascript);
  const pythonLesson = compileLanguageLesson(spec, 'python', spec.python);
  const languageVariants: LanguageVariants = {
    javascript: variantFromLesson(jsLesson, tests, spec.javascript.packages),
    python: variantFromLesson(pythonLesson, tests, spec.python.packages),
  };
  const readingSections = structuredClone(spec.reading.sections);
  if (!readingSections.some((section) => Boolean(section.example?.trim()))) {
    const workedCase = spec.practice.cases[0];
    const renderedArgs = workedCase.args.map((argument) => JSON.stringify(argument)).join(', ');
    const exampleSection = readingSections[Math.min(1, readingSections.length - 1)];
    exampleSection.example = `${spec.practice.functionName}(${renderedArgs})\n→ ${JSON.stringify(workedCase.expected)}`;
    exampleSection.exampleCaption = `Caso trabajado: ${workedCase.description}. Predice el resultado antes de ejecutar.`;
  }
  const frequentQuestions = structuredClone(spec.reading.questions);
  if (frequentQuestions.length < 2) {
    frequentQuestions.push({
      question: `¿Cómo compruebo que entendí ${spec.title.toLocaleLowerCase('es')}?`,
      answer: `Predice qué devolverá ${spec.practice.functionName} con al menos dos entradas distintas, explica qué regla produce cada resultado y después contrasta tu predicción con la ejecución.`,
    });
  }
  const reasoningActivity = structuredClone(spec.reasoning.activity);
  if (reasoningActivity.prompt.trim().length <= 35) {
    reasoningActivity.prompt = `Representa el problema antes de programar: ${reasoningActivity.prompt}`;
  }
  const reasoningExplanation = spec.reasoning.explanation.trim().length > 55
    ? spec.reasoning.explanation
    : `${spec.reasoning.explanation} Esta representación separa entradas, decisiones y resultados antes de ejecutar código.`;
  const reasoningHints = [...spec.reasoning.hints];
  if (reasoningHints.length < 3) {
    reasoningHints.push(`Contrasta cada decisión con este modelo mental: ${spec.mentalModel}`);
  }
  const lesson = withGuidedChallenges({
    ...jsLesson,
    narrationMode: 'silent',
    languageVariants,
    challenges: jsLesson.challenges.map((challenge) => ({
      ...challenge,
      languageVariants: {
        javascript: {
          workspace: workspace('javascript', spec.javascript.starter),
          tests: structuredClone(tests),
          ...(spec.javascript.packages ? { packages: [...spec.javascript.packages] } : {}),
        },
        python: {
          workspace: workspace('python', spec.python.starter),
          tests: structuredClone(tests),
          ...(spec.python.packages ? { packages: [...spec.python.packages] } : {}),
        },
      },
    })),
  });

  const reading: ReadingItem = {
    id: `${id}-lectura`,
    relatedLessonId: id,
    practiceItemId: `${id}-debug`,
    title: `Lectura: ${spec.title}`,
    type: 'reading',
    estimatedMinutes: 9,
    description: 'Amplía la explicación, responde dudas frecuentes y prepara el laboratorio.',
    summary: spec.summary,
    sections: readingSections,
    keyPoints: [...spec.reading.keyPoints],
    frequentQuestions,
    transferPrompt: spec.reading.transfer,
    sources: sourcesFor(spec.reading.sourceIds),
    ...(AI_INTERACTIVE_LABS[spec.number]
      ? { interactiveLab: structuredClone(AI_INTERACTIVE_LABS[spec.number]) }
      : {}),
    ...(spec.number === 18 ? { handsOnLab: 'embeddings-webgpu' as const } : {}),
  };

  const reasoning: ReasoningExerciseItem = {
    id: `${id}-razonamiento`,
    relatedLessonId: id,
    title: `Razonamiento: ${spec.title}`,
    type: 'reasoning',
    estimatedMinutes: 5,
    description: 'Representa el flujo antes de escribir código.',
    activity: reasoningActivity,
    hints: reasoningHints.map((text, index) => ({ level: index + 1, text })),
    explanation: reasoningExplanation,
  };

  const debugVariants: LanguageVariants = {
    javascript: {
      workspace: workspace('javascript', spec.javascript.debugStarter),
      tests: structuredClone(tests),
      ...(spec.javascript.packages ? { packages: [...spec.javascript.packages] } : {}),
    },
    python: {
      workspace: workspace('python', spec.python.debugStarter),
      tests: structuredClone(tests),
      ...(spec.python.packages ? { packages: [...spec.python.packages] } : {}),
    },
  };
  const debug: DebuggingExerciseItem = {
    id: `${id}-debug`,
    relatedLessonId: id,
    title: spec.debug.title,
    type: 'debugging',
    executionMode: 'logic',
    templateId: 'js-only',
    estimatedMinutes: 8,
    description: 'Reproduce el fallo con dos entradas, corrige una causa y vuelve a comprobar.',
    initialWorkspace: structuredClone(debugVariants.javascript.workspace),
    expectedBehavior: spec.debug.expected,
    observedBehavior: spec.debug.observed,
    hints: spec.debug.hints.map((text, index) => ({ level: index + 1, text })),
    tests: structuredClone(tests),
    troubleshootingTips: [
      'Ejecuta un caso que debería aprobar y otro que debería fallar.',
      'No cambies el nombre de la función ni codifiques un valor de la prueba.',
      'Comprueba de nuevo con datos distintos a los del ejemplo.',
    ],
    languageVariants: debugVariants,
  };

  return {
    lesson,
    item: {
      id,
      title: lesson.title,
      type: 'scrim',
      estimatedMinutes: Math.max(5, Math.ceil(lesson.durationMs / 60_000)),
      description: lesson.description,
      scrimDataId: id,
    },
    reading,
    reasoning,
    debug,
    solutions: { javascript: spec.javascript.solution, python: spec.python.solution },
  };
}
