class InMemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

// Vitest 4 + Node 25 exposes an unusable experimental localStorage global before
// happy-dom can replace it. Component suites expect the browser API on the test
// global, so install a deterministic in-memory implementation when needed.
const currentStorage = globalThis.localStorage;
if (!currentStorage || typeof currentStorage.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: new InMemoryStorage(),
  });
}

export {};
