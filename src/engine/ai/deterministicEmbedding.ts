const DEFAULT_DIMENSIONS = 64;

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.hypot(...vector);
  if (!Number.isFinite(magnitude) || magnitude === 0) return vector.map(() => 0);
  return vector.map((value) => value / magnitude);
}

export function deterministicEmbedding(text: string, dimensions = DEFAULT_DIMENSIONS): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = text
    .normalize('NFKD')
    .toLocaleLowerCase('es')
    .match(/[\p{L}\p{N}]+/gu) ?? [];

  for (const token of tokens.length > 0 ? tokens : ['<vacío>']) {
    const hash = hashToken(token);
    const primary = hash % dimensions;
    const secondary = Math.imul(hash ^ 0x9e3779b9, 2654435761) >>> 0;
    vector[primary] += (hash & 1) === 0 ? 1 : -1;
    vector[secondary % dimensions] += (secondary & 1) === 0 ? 0.5 : -0.5;
  }

  return normalizeVector(vector);
}

export function deterministicEmbeddingBatch(texts: string[], dimensions = DEFAULT_DIMENSIONS): number[][] {
  return texts.map((text) => deterministicEmbedding(text, dimensions));
}
