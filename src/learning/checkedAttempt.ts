import type { ExerciseCompletion } from '../services/learningSync';
import type { EvidenceResult } from './types';

/** Local provenance marker, not server-side proof or an authorization boundary. */
export function isCheckedPracticeEvidence(id: string, source: string): boolean {
  return id.startsWith('checked:') && ['challenge', 'debugging', 'reasoning', 'project'].includes(source);
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** A completion checkbox, written response or evaluator error is not a grade. */
export function checkedAttemptResult(completion: ExerciseCompletion): EvidenceResult | null {
  if (completion.diagnostics?.evaluation === 'ungraded') return null;
  const diagnostics = completion.diagnostics;
  const checks = diagnostics?.tests ?? (object(diagnostics?.result) ? diagnostics.result.checks : undefined);
  if (!Array.isArray(checks) || !checks.length || checks.some(check => !object(check) || typeof check.passed !== 'boolean' || check.isEvaluationError === true)) return null;
  const passed = checks.filter(check => check.passed === true).length;
  return passed === checks.length ? 'success' : passed ? 'partial' : 'failure';
}
