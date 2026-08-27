import { describe, expect, it } from 'vitest';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';
import { auditCellsProject } from './cellsProjectAudit';
import { createCellsAppPracticeWorkspace, createCellsAppWorkspace, type CellsAppPracticeStage } from './cellsAppRecipes';
import { createCellsComponentWorkspace, createCellsPracticeWorkspace, type CellsComponentPracticeStage } from './cellsRecipes';
import { CellsRuntimeSession } from './cellsRuntimeSession';
import type { CellsWorkerRequest, CellsWorkerResponse } from './cellsWorkerProtocol';
import type { WorkspaceSnapshot } from '../../types/scrim';

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

function request<T extends CellsWorkerRequest['type']>(
  type: T,
  payload: Extract<CellsWorkerRequest, { type: T }>['payload'],
): Extract<CellsWorkerRequest, { type: T }> {
  return { type, payload, generation: 0, requestId: `matrix-${type}`, sessionId: 'matrix-session' } as Extract<CellsWorkerRequest, { type: T }>;
}

async function runWorkspaceThroughRuntime(workspace: WorkspaceSnapshot): Promise<{
  preview: Extract<CellsWorkerResponse, { type: 'preview:built' }>;
  tests: Extract<CellsWorkerResponse, { type: 'tests:completed' }>;
  exported: Extract<CellsWorkerResponse, { type: 'project:exported' }>;
}> {
  const session = new CellsRuntimeSession('matrix-session');
  const loaded = await session.handle(request('project:load', { workspace }));
  expect(loaded.type).toBe('workspace:updated');
  const preview = await session.handle(request('preview:build', {}));
  const tests = await session.handle(request('tests:run', { coverage: true }));
  const exported = await session.handle(request('project:export', {}));
  expect(preview.type).toBe('preview:built');
  expect(tests.type).toBe('tests:completed');
  expect(exported.type).toBe('project:exported');
  return {
    preview: preview as Extract<CellsWorkerResponse, { type: 'preview:built' }>,
    tests: tests as Extract<CellsWorkerResponse, { type: 'tests:completed' }>,
    exported: exported as Extract<CellsWorkerResponse, { type: 'project:exported' }>,
  };
}

describe('matriz integral de prácticas Cells', () => {
  it.each(componentStages)('el laboratorio de componente %s abre roto solo por su misión', async (stage, expectedFailures) => {
    const starter = createCellsPracticeWorkspace(stage).snapshot;
    const preview = buildCellsPreviewDocument(starter);
    const failures = auditCellsProject(starter).results.filter((result) => !result.passed).map((result) => result.id);
    const runtime = await runWorkspaceThroughRuntime(starter);

    expect(preview.componentDemo).toBeDefined();
    expect(failures).toEqual(expectedFailures);
    expect(runtime.preview.payload.componentDemo).toBeDefined();
    expect(runtime.tests.payload.results.filter((result) => !result.passed).map((result) => result.id)).toEqual(expectedFailures);
    expect(Array.from(runtime.exported.payload.bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it.each(appStages)('el laboratorio de aplicación %s abre roto solo por su misión', async (stage, expectedFailures) => {
    const starter = createCellsAppPracticeWorkspace(stage).snapshot;
    const preview = buildCellsPreviewDocument(starter);
    const failures = auditCellsProject(starter).results.filter((result) => !result.passed).map((result) => result.id);
    const runtime = await runWorkspaceThroughRuntime(starter);

    expect(preview.componentDemo).toBeUndefined();
    expect(failures).toEqual(expectedFailures);
    expect(runtime.preview.payload.componentDemo).toBeUndefined();
    expect(runtime.tests.payload.results.filter((result) => !result.passed).map((result) => result.id)).toEqual(expectedFailures);
    expect(Array.from(runtime.exported.payload.bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
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
