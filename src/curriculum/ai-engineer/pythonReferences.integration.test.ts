import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { evaluationValuesEqual } from '../../engine/evaluationEquality';
import { AI_SPECS } from './modules';

function execute(source: string, functionName: string, args: unknown[][]) {
  const cases = JSON.stringify(args).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
  const harness = `
import json as __aula_json
__aula_values = []
for __aula_args in __aula_json.loads('${cases}'):
    try:
        __aula_values.append({"ok": True, "value": globals()["${functionName}"](*__aula_args)})
    except Exception as __aula_error:
        __aula_values.append({"ok": False, "error": str(__aula_error)})
print(__aula_json.dumps(__aula_values, ensure_ascii=False, allow_nan=False))
`;
  const result = spawnSync('python3', ['-c', `${source}\n${harness}`], { encoding: 'utf8', timeout: 4_000 });
  if (result.status !== 0) return { error: result.stderr.trim(), values: [] as Array<{ ok: boolean; value?: unknown }> };
  const line = result.stdout.trim().split('\n').at(-1) ?? '';
  try {
    return { error: '', values: JSON.parse(line) as Array<{ ok: boolean; value?: unknown }> };
  } catch {
    return { error: `Salida no interpretable: ${line}`, values: [] as Array<{ ok: boolean; value?: unknown }> };
  }
}

describe('referencias Python del curso AI Engineer', () => {
  it('hace fallar cada starter y aprobar las 39 soluciones con los mismos casos', () => {
    for (const spec of AI_SPECS) {
      const args = spec.practice.cases.map((testCase) => testCase.args);
      const expected = spec.practice.cases.map((testCase) => testCase.expected);
      const starter = execute(spec.python.starter, spec.practice.functionName, args);
      const starterPasses = !starter.error
        && starter.values.length === expected.length
        && starter.values.every((result, index) => result.ok && evaluationValuesEqual(result.value, expected[index]));
      expect(starterPasses, `${spec.number} entrega la solución Python en el starter`).toBe(false);

      const solution = execute(spec.python.solution, spec.practice.functionName, args);
      expect(solution.error, `${spec.number} no ejecuta: ${solution.error}`).toBe('');
      expect(solution.values.length, `${spec.number} no devolvió todos los casos`).toBe(expected.length);
      solution.values.forEach((result, index) => {
        expect(result.ok && evaluationValuesEqual(result.value, expected[index]), `${spec.number}/${index + 1}: esperado ${JSON.stringify(expected[index])}, recibido ${JSON.stringify(result.value)}`).toBe(true);
      });
    }
  }, 20_000);

  it('hace fallar las 39 depuraciones Python y acepta la corrección de referencia', () => {
    for (const spec of AI_SPECS) {
      const args = spec.practice.cases.map((testCase) => testCase.args);
      const expected = spec.practice.cases.map((testCase) => testCase.expected);
      const broken = execute(spec.python.debugStarter, spec.practice.functionName, args);
      const brokenPasses = !broken.error
        && broken.values.length === expected.length
        && broken.values.every((result, index) => result.ok && evaluationValuesEqual(result.value, expected[index]));
      expect(brokenPasses, `${spec.number} entrega la depuración Python ya resuelta`).toBe(false);

      const corrected = execute(spec.python.solution, spec.practice.functionName, args);
      expect(corrected.error, `${spec.number} no ejecuta la corrección: ${corrected.error}`).toBe('');
      corrected.values.forEach((result, index) => {
        expect(result.ok && evaluationValuesEqual(result.value, expected[index]), `${spec.number}/${index + 1}: la depuración no acepta la corrección`).toBe(true);
      });
    }
  }, 20_000);
});
