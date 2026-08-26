import { describe, expect, it } from 'vitest';
import { createCellsCoverageReport, createIstanbulCoverageReport, mergeCellsCoverageReports } from './cellsCoverage';

const source = `export class Card {
  constructor() {
    this.name = 'Ada';
  }

  handleContinue() {
    this.emitEvent('continue', { name: this.name });
  }

  render() {
    return html\`<p>\${this.name}</p>\`;
  }

  disabledLabel() {
    if (this.disabled) return 'No disponible';
    return 'Continuar';
  }
}`;

describe('createCellsCoverageReport', () => {
  it('calcula ejecución por archivo y enumera líneas no cubiertas', () => {
    const report = createCellsCoverageReport('src/card.js', source, ['constructor', 'render', 'handleContinue']);

    expect(report.functions).toMatchObject({ covered: 3, total: 4, percentage: 75 });
    expect(report.lines.covered).toBeGreaterThan(0);
    expect(report.lines.covered).toBeLessThan(report.lines.total);
    expect(report.branches).toMatchObject({ covered: 0, total: 2, percentage: 0 });
    expect(report.files[0].uncoveredLines).toContain(15);
    expect(report.files[0].path).toBe('src/card.js');
  });

  it('no inventa porcentajes cuando el archivo no contiene funciones analizables', () => {
    const report = createCellsCoverageReport('src/config.js', 'export const config = { production: true };', []);

    expect(report.files[0].available).toBe(false);
    expect(report.files[0].unavailableReason).toContain('coverage no disponible');
  });

  it('combina archivos sin promediar porcentajes con denominadores distintos', () => {
    const first = createCellsCoverageReport('src/card.js', source, ['constructor', 'render']);
    const second = createCellsCoverageReport('src/other.js', source, ['constructor', 'render', 'handleContinue', 'disabledLabel']);
    const merged = mergeCellsCoverageReports([first, second]);

    expect(merged.files).toHaveLength(2);
    expect(merged.functions).toMatchObject({ covered: 6, total: 8, percentage: 75 });
    expect(merged.statements.total).toBe(first.statements.total + second.statements.total);
  });

  it('convierte contadores Istanbul reales en métricas y líneas no cubiertas', () => {
    const report = createIstanbulCoverageReport({
      'src/card.js': {
        path: 'src/card.js',
        statementMap: {
          0: { start: { line: 2 }, end: { line: 2 } },
          1: { start: { line: 3 }, end: { line: 3 } },
        },
        fnMap: { 0: { loc: { start: { line: 1 }, end: { line: 4 } } } },
        branchMap: { 0: { locations: [{ start: { line: 2 }, end: { line: 2 } }, { start: { line: 3 }, end: { line: 3 } }] } },
        s: { 0: 2, 1: 0 },
        f: { 0: 1 },
        b: { 0: [2, 0] },
      },
    });

    expect(report?.statements).toEqual({ covered: 1, total: 2, percentage: 50 });
    expect(report?.branches).toEqual({ covered: 1, total: 2, percentage: 50 });
    expect(report?.functions).toEqual({ covered: 1, total: 1, percentage: 100 });
    expect(report?.files?.[0].uncoveredLines).toEqual([3]);
  });
});
