import { describe, expect, it } from 'vitest';
import { createCellsAppPracticeWorkspace, createCellsAppWorkspace } from './cellsAppRecipes';
import { auditCellsApplication, auditCellsProject } from './cellsProjectAudit';

describe('auditoría de aplicación Cells', () => {
  it('el starter falla cleanup y navegación, no detalles de formato', () => {
    const audit = auditCellsApplication(createCellsAppPracticeWorkspace().snapshot);
    expect(audit.results.filter((result) => !result.passed).map((result) => result.id)).toEqual([
      'page-lifecycle', 'named-navigation',
    ]);
  });

  it.each([
    ['channels', ['channel-subscribe', 'channel-publish']],
    ['data', ['data-race', 'data-cleanup']],
    ['delivery', ['not-found-route', 'environment-config']],
  ] as const)('cada etapa %s retira solo sus dos contratos de práctica', (stage, expectedFailures) => {
    const audit = auditCellsApplication(createCellsAppPracticeWorkspace(stage).snapshot);
    expect(audit.results.filter((result) => !result.passed).map((result) => result.id)).toEqual(expectedFailures);
  });

  it('la app completa supera rutas, páginas, canales, datos y configuración', () => {
    const workspace = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
    const audit = auditCellsProject(workspace);
    expect(audit.results.every((result) => result.passed)).toBe(true);
    expect(audit.coverage.behaviors.percentage).toBe(100);
  });
});
