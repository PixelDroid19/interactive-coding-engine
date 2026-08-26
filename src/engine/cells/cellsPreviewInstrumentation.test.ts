import { describe, expect, it } from 'vitest';
import { instrumentCellsSource } from './cellsPreviewInstrumentation';

describe('instrumentCellsSource', () => {
  it('genera coverage ejecutable para módulos sin APIs de Node ni evaluación dinámica', async () => {
    const result = instrumentCellsSource('export function greet(name) { if (name) return `Hola ${name}`; return "Hola"; }', 'src/greet.js');

    expect(result).toContain('__cellsCoverage__');
    expect(result).toContain('src/greet.js');
    expect(result).toContain('globalThis');
    expect(result).toContain('__cellsFile.f');
    expect(result).toContain('__cellsBranch');
    expect(result).not.toMatch(/\bprocess\b|new Function/);

    const module = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(result)}#${Date.now()}`);
    expect(module.greet('Ana')).toBe('Hola Ana');
    expect(module.greet('')).toBe('Hola');
    const coverage = (globalThis as typeof globalThis & {
      __cellsCoverage__?: Record<string, {
        s: Record<string, number>;
        f: Record<string, number>;
        b: Record<string, number[]>;
      }>;
    }).__cellsCoverage__;
    expect(Object.values(coverage?.['src/greet.js'].s ?? {}).some((count) => count > 0)).toBe(true);
    expect(Object.values(coverage?.['src/greet.js'].f ?? {}).some((count) => count === 2)).toBe(true);
    expect(coverage?.['src/greet.js'].b['0']).toEqual([1, 1]);
  });
});
