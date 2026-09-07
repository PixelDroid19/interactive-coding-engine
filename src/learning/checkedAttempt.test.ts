import { expect, it } from 'vitest';
import { checkedAttemptResult } from './checkedAttempt';

it('solo puntúa comprobaciones ejecutadas y no inventa resultados a partir del score', () => {
  expect(checkedAttemptResult({ score: 100 })).toBeNull();
  expect(checkedAttemptResult({ diagnostics: { tests: [] } })).toBeNull();
  expect(checkedAttemptResult({ diagnostics: { tests: [{ passed: false, isEvaluationError: true }] } })).toBeNull();
  expect(checkedAttemptResult({ diagnostics: { tests: [{ passed: 'true' }] } })).toBeNull();
  expect(checkedAttemptResult({ diagnostics: { tests: [{ passed: true }], evaluation: 'ungraded' } })).toBeNull();
  expect(checkedAttemptResult({ diagnostics: { tests: [{ passed: false }] } })).toBe('failure');
  expect(checkedAttemptResult({ diagnostics: { tests: [{ passed: true }, { passed: false }] } })).toBe('partial');
  expect(checkedAttemptResult({ diagnostics: { result: { checks: [{ passed: true }] } } })).toBe('success');
});
