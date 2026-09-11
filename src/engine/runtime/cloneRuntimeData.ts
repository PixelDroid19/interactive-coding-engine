/** Copy mutable curriculum data while retaining trusted executable test callbacks. */
export function cloneRuntimeData<T>(value: T, seen = new Map<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as T;

  if (Array.isArray(value)) {
    const copy: unknown[] = new Array(value.length);
    seen.set(value, copy);
    value.forEach((item, index) => { copy[index] = cloneRuntimeData(item, seen); });
    return copy as T;
  }
  if (Object.getPrototypeOf(value) === Object.prototype) {
    const copy = {} as Record<string, unknown>;
    seen.set(value, copy);
    for (const [key, item] of Object.entries(value)) {
      Object.defineProperty(copy, key, {
        value: cloneRuntimeData(item, seen), enumerable: true, writable: true, configurable: true,
      });
    }
    return copy as T;
  }
  return structuredClone(value);
}
