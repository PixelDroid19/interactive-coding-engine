import { describe, expect, it } from 'vitest';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';
import { auditCellsProject } from './cellsProjectAudit';
import { createCellsAppPracticeWorkspace, createCellsAppWorkspace, type CellsAppPracticeStage } from './cellsAppRecipes';
import { createCellsComponentWorkspace, createCellsPracticeWorkspace, type CellsComponentPracticeStage } from './cellsRecipes';

const componentStages: Array<[CellsComponentPracticeStage, string[]]> = [
  ['scaffold', ['package-contract']],
  ['api', ['public-property', 'public-event']],
  ['composition', ['scoped-components', 'public-event']],
  ['styles', ['style-pair']],
  ['i18n', ['locale-parity', 'locale-placeholders']],
  ['demo', ['demo-public-entry', 'demo-controls-property']],
  ['tests', ['test-public-event']],
  ['delivery', ['metadata-contract', 'readme-consumer-path']],
];

const appStages: Array<[CellsAppPracticeStage, string[]]> = [
  ['lifecycle', ['page-lifecycle', 'named-navigation']],
  ['channels', ['channel-subscribe', 'channel-publish', 'native-boundary']],
  ['data', ['data-race', 'data-cleanup']],
  ['delivery', ['not-found-route', 'environment-config']],
];

describe('matriz integral de prácticas Cells', () => {
  it.each(componentStages)('el laboratorio de componente %s abre roto solo por su misión', (stage, expectedFailures) => {
    const starter = createCellsPracticeWorkspace(stage).snapshot;
    const preview = buildCellsPreviewDocument(starter);
    const failures = auditCellsProject(starter).results.filter((result) => !result.passed).map((result) => result.id);

    expect(preview.componentDemo).toBeDefined();
    expect(failures).toEqual(expectedFailures);
  });

  it.each(appStages)('el laboratorio de aplicación %s abre roto solo por su misión', (stage, expectedFailures) => {
    const starter = createCellsAppPracticeWorkspace(stage).snapshot;
    const preview = buildCellsPreviewDocument(starter);
    const failures = auditCellsProject(starter).results.filter((result) => !result.passed).map((result) => result.id);

    expect(preview.componentDemo).toBeUndefined();
    expect(failures).toEqual(expectedFailures);
  });

  it('cada solución completa de componente supera el mismo evaluador del laboratorio', () => {
    const complete = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
    expect(auditCellsProject(complete).results.every((result) => result.passed)).toBe(true);
    expect(() => buildCellsPreviewDocument(complete)).not.toThrow();
  });

  it('cada solución completa de aplicación supera el mismo evaluador del laboratorio', () => {
    const complete = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
    expect(auditCellsProject(complete).results.every((result) => result.passed)).toBe(true);
    expect(() => buildCellsPreviewDocument(complete)).not.toThrow();
  });
});
