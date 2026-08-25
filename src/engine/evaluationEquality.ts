export function evaluationValuesEqual(received: unknown, expected: unknown): boolean {
  if (typeof received === 'number' && typeof expected === 'number') {
    if (Object.is(received, expected)) return true;
    if (!Number.isFinite(received) || !Number.isFinite(expected)) return false;
    const scale = Math.max(1, Math.abs(received), Math.abs(expected));
    return Math.abs(received - expected) <= Number.EPSILON * 16 * scale;
  }
  if (Array.isArray(received) && Array.isArray(expected)) {
    return received.length === expected.length && received.every((value, index) => evaluationValuesEqual(value, expected[index]));
  }
  if (received !== null && expected !== null && typeof received === 'object' && typeof expected === 'object') {
    const receivedKeys = Object.keys(received as Record<string, unknown>).sort();
    const expectedKeys = Object.keys(expected as Record<string, unknown>).sort();
    return evaluationValuesEqual(receivedKeys, expectedKeys)
      && receivedKeys.every((key) => evaluationValuesEqual(
        (received as Record<string, unknown>)[key],
        (expected as Record<string, unknown>)[key],
      ));
  }
  return Object.is(received, expected);
}
