interface LearnerHintInput {
  text: string;
  index: number;
  total: number;
  criteria: string[];
}

/**
 * The final hint is deliberately generated from observable criteria instead
 * of curriculum solution text. Authors can keep a private diagnosis in the
 * source material, but the learner never receives a copyable last step.
 */
export function learnerHintText({ text, index, total, criteria }: LearnerHintInput): string {
  if (index < total - 1) return text;
  const target = criteria.some((criterion) => criterion.trim())
    ? 'el primer criterio que todavía falla'
    : 'el comportamiento esperado';
  return `Contrasta dos entradas distintas con ${target}. Identifica qué dato o decisión cambia el resultado, modifica una sola causa y vuelve a comprobar.`;
}
