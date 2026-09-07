/** A hint is one question that directs attention, never a code patch. */
export function parseTutorHint(text: string, knownMarkupReferences: ReadonlySet<string> = new Set(), learnerQuestion = ''): string {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('Devuelve únicamente el objeto JSON solicitado.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('La pista debe ser un objeto.');
  const hint = value as Record<string, unknown>;
  if (Object.keys(hint).join(',') !== 'question' || typeof hint.question !== 'string') {
    throw new Error('La pista necesita exactamente question como texto.');
  }
  const question = hint.question.trim();
  if (question.length < 12 || question.length > 240 || !question.startsWith('¿') || !question.endsWith('?') || question.split('?').length !== 2) {
    throw new Error('Escribe una sola pregunta breve entre ¿ y ?. Invita a comparar una parte concreta, no des la respuesta.');
  }
  const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}_$]+/gu, ' ').trim();
  if (learnerQuestion && ` ${normalize(learnerQuestion)} `.includes(` ${normalize(question)} `)) {
    throw new Error('No repitas la pregunta del alumno. Señala una parte concreta del código que pueda observar para avanzar.');
  }
  // Naming an existing bare tag is a reference, not a proposed HTML patch.
  // Closing tags, attributes, new tags and all executable syntax still fail.
  const combined = question.replace(/<[a-z][a-z\d-]*>/g, tag => knownMarkupReferences.has(tag) ? 'etiqueta existente' : tag);
  if (/\b(?:read_lesson|read_workspace|read_diagnostics|run_checks|write_file|save_reinforcement)\b/.test(combined)) {
    throw new Error('Habla del código del estudiante, no de herramientas internas.');
  }
  if (/[`{};]|=>|<\/?[a-z][^>]*>|\b[A-Za-z_$][\w.$]*\s*\([^)]*\)|\b(?:const|let|var)\s+\w+\s*=|\breturn\s+[^\s]+\s*[-+*/]/i.test(combined)) {
    throw new Error('No incluyas instrucciones ejecutables ni código corregido. Orienta con palabras sobre dónde mirar.');
  }
  return question;
}
