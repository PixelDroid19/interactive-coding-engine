const SPANISH_MARKERS = new Set([
  'al', 'como', 'con', 'de', 'del', 'el', 'en', 'es', 'esta', 'este', 'la', 'las', 'los',
  'para', 'por', 'porque', 'puede', 'que', 'se', 'sin', 'su', 'una', 'usar', 'y', 'otra',
  'datos', 'funcion', 'resultado', 'texto', 'paso', 'problema', 'decision',
]);

function words(text: string) {
  return text.toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-zñ]+/g) ?? [];
}

function isValidStructuredJson(text: string) {
  const candidate = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!candidate.startsWith('{') && !candidate.startsWith('[')) return false;
  try {
    const parsed = JSON.parse(candidate);
    return parsed !== null && typeof parsed === 'object';
  } catch {
    return false;
  }
}

function hasLowInformationRun(text: string): boolean {
  const visible = text
    .normalize('NFKC')
    .toLocaleLowerCase('es')
    .replace(/[\p{Cc}\p{Cf}\p{Z}\p{P}\p{S}]/gu, '');
  if (visible.length < 24) return false;
  const counts = new Map<string, number>();
  for (const character of visible) counts.set(character, (counts.get(character) ?? 0) + 1);
  const dominant = Math.max(...counts.values());
  return counts.size <= 2 || dominant / visible.length >= 0.82;
}

export interface LocalGenerationQualityIssue {
  severity: 'warning' | 'unsafe';
  message: string;
}

export function assessSpanishGeneration(text: string): LocalGenerationQualityIssue | null {
  const normalized = text.trim();
  const hasReplacementCharacter = normalized.includes('�');
  const hasPunctuationRun = /([!?$#*])\1{7,}/.test(normalized);
  const hasRepeatedChunk = /(\p{L}{2,})\1{2,}/iu.test(normalized);
  const hasDegenerateRun = hasLowInformationRun(normalized);
  const hasUnexpectedScripts = /[\u3400-\u9fff]|[řœšž]/iu.test(normalized);
  const tokens = words(normalized);
  const spanishSignals = tokens.filter((token) => SPANISH_MARKERS.has(token)).length;
  const wrongLanguageForSpanishLab = normalized.length > 40 && spanishSignals < 2 && !isValidStructuredJson(normalized);

  if (hasReplacementCharacter || hasPunctuationRun || hasRepeatedChunk || hasDegenerateRun || hasUnexpectedScripts) {
    return {
      severity: 'unsafe',
      message: 'La inferencia local produjo una salida numéricamente inestable en este equipo. No se mostrará como una respuesta válida. Revisa el controlador gráfico o prueba otro dispositivo compatible con WebGPU.',
    };
  }
  if (wrongLanguageForSpanishLab) {
    return {
      severity: 'warning',
      message: 'El modelo no respetó el idioma o el formato solicitado. Compara la salida con el contrato, haz la instrucción más explícita o reduce la tarea.',
    };
  }
  if (normalized.length < 12 || words(normalized).length < 3) {
    return {
      severity: 'warning',
      message: 'El modelo devolvió una respuesta incompleta. Úsala como evidencia del límite y vuelve a intentarlo con una tarea más pequeña o una instrucción más precisa.',
    };
  }
  return null;
}

export function validateSpanishGeneration(text: string): string | null {
  return assessSpanishGeneration(text)?.message ?? null;
}
