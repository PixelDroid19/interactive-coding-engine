import { describe, expect, it } from 'vitest';
import { auditCellsComponent } from './cellsProjectAudit';
import { createCellsComponentWorkspace, createCellsPracticeWorkspace } from './cellsRecipes';

describe('auditCellsComponent', () => {
  it('el starter falla exactamente los dos contratos que debe resolver el estudiante', () => {
    const audit = auditCellsComponent(createCellsPracticeWorkspace().snapshot);
    expect(audit.results.filter((result) => result.passed)).toHaveLength(5);
    expect(audit.results.filter((result) => !result.passed).map((result) => result.id)).toEqual([
      'scoped-components',
      'public-event',
    ]);
  });

  it('el proyecto completo supera todos los contratos', () => {
    const audit = auditCellsComponent(createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot);
    expect(audit.results.every((result) => result.passed)).toBe(true);
    expect(audit.coverage.behaviors.percentage).toBe(100);
  });
});
