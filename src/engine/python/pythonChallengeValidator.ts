import type { ChallengeValidationResult, RuntimeExecutionResult, TestResultItem } from '../../types/runtime';
import type { ScrimChallenge, WorkspaceSnapshot } from '../../types/scrim';
import type { CourseRuntime } from '../runtime/courseRuntime';
import { PythonRuntimeClient } from './pythonRuntimeClient';
import { evaluationValuesEqual } from '../evaluationEquality';

const RESULT_PREFIX = '__AULA_PYTHON_TESTS__:';
let sharedRuntime: CourseRuntime | null = null;

interface PythonCaseResult {
  ok: boolean;
  value?: unknown;
  error?: string;
}

function pythonFiles(workspace: WorkspaceSnapshot) {
  return Object.values(workspace.files).filter((file) => file.language === 'python' || file.path.endsWith('.py'));
}

function harnessFor(challenge: ScrimChallenge): string {
  const cases = challenge.tests.map((test) => ({
    target: test.targetFunction,
    args: test.args ?? [],
  }));
  const encoded = JSON.stringify(cases).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
  return `
# Comprobaciones aisladas de Aula. Este bloque no modifica tu archivo.
import json as __aula_json
__aula_cases = __aula_json.loads('${encoded}')
__aula_results = []
for __aula_case in __aula_cases:
    try:
        __aula_target = globals().get(__aula_case["target"])
        if not callable(__aula_target):
            raise NameError("No encontramos la función " + str(__aula_case["target"]))
        __aula_value = __aula_target(*__aula_case["args"])
        __aula_results.append({"ok": True, "value": __aula_value})
    except Exception as __aula_error:
        __aula_results.append({"ok": False, "error": str(__aula_error)})
print('${RESULT_PREFIX}' + __aula_json.dumps(__aula_results, ensure_ascii=False, allow_nan=False))
`;
}

function workspaceWithHarness(challenge: ScrimChallenge, workspace: WorkspaceSnapshot): WorkspaceSnapshot {
  const files = pythonFiles(workspace);
  const active = workspace.files[workspace.activeFilePath];
  const ordered = active && files.includes(active) ? [active, ...files.filter((file) => file !== active)] : files;
  const source = `${ordered.map((file) => file.content).join('\n\n')}\n${harnessFor(challenge)}`;
  return {
    activeFilePath: '__aula_validation__.py',
    files: {
      '__aula_validation__.py': {
        name: '__aula_validation__.py',
        path: '__aula_validation__.py',
        language: 'python',
        content: source,
      },
    },
  };
}

function evaluationFailure(challenge: ScrimChallenge, message: string): ChallengeValidationResult {
  const tests: TestResultItem[] = challenge.tests.map((test) => ({
    id: test.id,
    description: test.description,
    passed: false,
    status: 'evaluation-error',
    isEvaluationError: true,
    errorMessage: `No pudimos evaluar el código Python: ${message}`,
    hint: test.hintTip,
  }));
  return {
    allPassed: false,
    passedCount: 0,
    totalCount: tests.length,
    tests,
    feedbackMessage: 'No pudimos evaluar el código Python. Corrige el error indicado y vuelve a pulsar Comprobar.',
  };
}

function parseResults(result: RuntimeExecutionResult): PythonCaseResult[] | null {
  const lines = result.consoleLogs
    .flatMap((entry) => entry.args.map(String))
    .filter((text) => text.startsWith(RESULT_PREFIX));
  const line = lines[lines.length - 1];
  if (!line) return null;
  try {
    return JSON.parse(line.slice(RESULT_PREFIX.length)) as PythonCaseResult[];
  } catch {
    return null;
  }
}

export async function runPythonChallengeValidation(
  challenge: ScrimChallenge,
  workspace: WorkspaceSnapshot,
  runtime?: CourseRuntime,
): Promise<ChallengeValidationResult> {
  if (challenge.tests.some((test) => test.validatorType !== 'function-call' || !test.targetFunction)) {
    return evaluationFailure(challenge, 'esta práctica usa un tipo de comprobación que todavía no está disponible en Python.');
  }
  if (pythonFiles(workspace).length === 0) return evaluationFailure(challenge, 'no encontramos ningún archivo .py.');

  const executor = runtime ?? (sharedRuntime ??= new PythonRuntimeClient());
  const result = await executor.run(workspaceWithHarness(challenge, workspace), { timeoutMs: 12_000 });
  if (!result.success) return evaluationFailure(challenge, result.error?.message ?? 'el entorno terminó sin resultado.');

  const values = parseResults(result);
  if (!values || values.length !== challenge.tests.length) {
    return evaluationFailure(challenge, 'el entorno no devolvió todas las comprobaciones.');
  }

  let passedCount = 0;
  const tests = challenge.tests.map<TestResultItem>((test, index) => {
    const received = values[index];
    if (!received.ok) {
      return {
        id: test.id,
        description: test.description,
        passed: false,
        status: 'failed',
        errorMessage: `La función lanzó un error: ${received.error}`,
        hint: test.hintTip,
      };
    }
    const passed = evaluationValuesEqual(received.value, test.expectedReturn);
    if (passed) passedCount++;
    return {
      id: test.id,
      description: test.description,
      passed,
      status: passed ? 'passed' : 'failed',
      receivedValue: received.value,
      expectedValue: test.expectedReturn,
      errorMessage: passed ? undefined : (test.errorMessage ?? `Esperábamos ${JSON.stringify(test.expectedReturn)} pero obtuvimos ${JSON.stringify(received.value)}.`),
      hint: test.hintTip,
    };
  });
  const allPassed = passedCount === tests.length && tests.length > 0;
  const firstFailure = tests.find((test) => !test.passed);
  return {
    allPassed,
    passedCount,
    totalCount: tests.length,
    tests,
    feedbackMessage: allPassed
      ? 'Muy bien. Pasaste las pruebas de Python. Sigue con la lección.'
      : `${firstFailure?.description ?? 'La solución todavía no cumple'}: ${firstFailure?.errorMessage ?? 'revisa el caso indicado.'}`,
  };
}
