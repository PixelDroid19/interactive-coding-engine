import { describe, expect, it } from 'vitest';
import type { DebuggingExerciseItem, SoloProjectItem } from '../../types/curriculum';
import type { LanguageVariants, ScrimLessonData } from '../../types/scrim';
import { resolveDebuggingLanguage, resolveLessonLanguage, resolveProjectLanguage } from './languageVariants';

const variants: LanguageVariants = {
  javascript: {
    workspace: { activeFilePath: 'app.js', files: { 'app.js': { name: 'app.js', path: 'app.js', language: 'javascript', content: 'console.log(1)' } } },
    tests: [{ id: 'js', description: 'JS', validatorType: 'source-regex', regexPattern: 'console' }],
  },
  python: {
    workspace: { activeFilePath: 'main.py', files: { 'main.py': { name: 'main.py', path: 'main.py', language: 'python', content: 'print(1)' } } },
    tests: [{ id: 'py', description: 'Python', validatorType: 'source-regex', regexPattern: 'print' }],
    packages: ['numpy'],
    lessonTape: {
      events: [{ id: 'py-write', timestamp: 100, type: 'file-switch', filePath: 'main.py' }],
      snapshots: [],
      challenges: [],
      durationMs: 2_000,
    },
  },
};

it('resuelve una clase y su primer reto sin mutar el original', () => {
  const lesson = {
    id: 'ai-01',
    initialWorkspace: variants.javascript.workspace,
    languageVariants: variants,
    challenges: [{ id: 'reto', tests: variants.javascript.tests }],
  } as ScrimLessonData;

  const resolved = resolveLessonLanguage(lesson, 'python');

  expect(resolved.initialWorkspace.activeFilePath).toBe('main.py');
  expect(resolved.challenges[0].tests[0].id).toBe('py');
  expect(resolved.runtimePackages).toEqual(['numpy']);
  expect(resolved.events[0]).toMatchObject({ filePath: 'main.py' });
  expect(resolved.durationMs).toBe(2_000);
  expect(lesson.initialWorkspace.activeFilePath).toBe('app.js');
});

describe('variantes de prácticas', () => {
  it('resuelve depuración y proyecto con archivos propios', () => {
    const debugging = { initialWorkspace: variants.javascript.workspace, tests: variants.javascript.tests, languageVariants: variants } as DebuggingExerciseItem;
    const project = { initialWorkspace: variants.javascript.workspace, languageVariants: variants } as SoloProjectItem;

    expect(resolveDebuggingLanguage(debugging, 'python').tests[0].id).toBe('py');
    expect(resolveProjectLanguage(project, 'python').initialWorkspace.activeFilePath).toBe('main.py');
  });
});
