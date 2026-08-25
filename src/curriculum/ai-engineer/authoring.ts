import type { ReasoningActivity } from '../../types/curriculum';
import type { AISourceId, AIEngineerLessonSpec, AILanguageCode, AIPracticeCase } from './types';

interface AuthoredReading {
  core: string;
  mechanics: string;
  decisions: string;
  errors: string;
  keyPoints: [string, string, ...string[]];
  question: string;
  answer: string;
  transfer: string;
  sources: [AISourceId, AISourceId, ...AISourceId[]];
  mechanicsExample?: string;
}

interface AuthoredReasoning {
  activity: ReasoningActivity;
  explanation: string;
  hints: [string, string, ...string[]];
}

interface AuthoredLesson {
  number: number;
  module: number;
  title: string;
  summary: string;
  concepts: Array<[label: string, description: string]>;
  requires?: string[];
  skill: string;
  mentalModel: string;
  script: [string, string, string, string];
  javascript: AILanguageCode;
  python: AILanguageCode;
  practice: {
    title: string;
    instructions: string;
    functionName: string;
    cases: [AIPracticeCase, AIPracticeCase, ...AIPracticeCase[]];
    hints: [string, string, string];
  };
  reading: AuthoredReading;
  reasoning: AuthoredReasoning;
  debug: {
    title: string;
    expected: string;
    observed: string;
    hints: [string, string, string];
  };
}

export function authoredLesson(input: AuthoredLesson): AIEngineerLessonSpec {
  return {
    number: input.number,
    module: input.module,
    title: input.title,
    summary: input.summary,
    concepts: input.concepts.map(([label, desc]) => ({ label, desc })),
    skillsRequired: input.requires ?? [],
    skillsIntroduced: [input.skill],
    mentalModel: input.mentalModel,
    script: input.script,
    javascript: input.javascript,
    python: input.python,
    practice: input.practice,
    reading: {
      sections: [
        { title: 'La idea central', content: input.reading.core },
        {
          title: 'Cómo funciona por dentro',
          content: input.reading.mechanics,
          ...(input.reading.mechanicsExample
            ? { example: input.reading.mechanicsExample, exampleCaption: 'Predice el resultado antes de ejecutar.' }
            : {}),
        },
        { title: 'Cómo tomar decisiones', content: input.reading.decisions },
        { title: 'Errores comunes', content: input.reading.errors },
      ],
      keyPoints: input.reading.keyPoints,
      questions: [{ question: input.reading.question, answer: input.reading.answer }],
      transfer: input.reading.transfer,
      sourceIds: input.reading.sources,
    },
    reasoning: input.reasoning,
    debug: input.debug,
  };
}

export function sequenceActivity(prompt: string, labels: Array<[id: string, label: string]>): ReasoningActivity {
  return {
    kind: 'sequence',
    prompt,
    steps: labels.map(([id, label]) => ({ id, label })),
    expectedOrder: labels.map(([id]) => id),
  };
}

export function decisionActivity(
  prompt: string,
  cases: Array<[id: string, label: string, options: string[], expected: string]>,
): ReasoningActivity {
  return {
    kind: 'decision-table',
    prompt,
    cases: cases.map(([id, label, options]) => ({ id, label, options })),
    expectedOutcomes: Object.fromEntries(cases.map(([id, _label, _options, expected]) => [id, expected])),
  };
}

export function flowActivity(
  prompt: string,
  nodes: Array<[id: string, label: string, role: 'start' | 'process' | 'decision' | 'output' | 'end']>,
  connections: Array<[from: string, to: string, label?: string]>,
): ReasoningActivity {
  return {
    kind: 'flowchart',
    prompt,
    nodes: nodes.map(([id, label, role]) => ({ id, label, role })),
    connectionOptions: connections.map(([from, to, label]) => ({ from, to, ...(label ? { label } : {}) })),
    expectedConnections: connections.map(([from, to, label]) => ({ from, to, ...(label ? { label } : {}) })),
  };
}
