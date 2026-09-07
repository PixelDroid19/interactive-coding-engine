import { describe, expect, it } from 'vitest';
import { OPEN_CELLS_ARTIFACTS } from '../../curriculum/open-cells/lessonProjects';
import { createCellsCurriculumComponentWorkspace, createCellsCurriculumPracticeWorkspace } from './cellsCurriculumRecipes';
import { auditCellsProject } from './cellsProjectAudit';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';

describe('original account-detail feature workspace', () => {
  it('exports connected pages, shared variants, fixtures and locale resources without a required data manager', () => {
    expect(OPEN_CELLS_ARTIFACTS['account-detail']).toBeDefined();
    const workspace = createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS['account-detail']).snapshot;
    expect(workspace.files['src/pages/academy-account-summary.js']).toBeDefined();
    expect(workspace.files['src/pages/academy-movement-list.js']).toBeDefined();
    expect(workspace.files['src/config/demo-data.js']).toBeDefined();
    expect(Object.keys(workspace.files).some((path) => path.includes('data-manager'))).toBe(false);
    expect(auditCellsProject(workspace).results.filter((result) => !result.passed)).toEqual([]);
    expect(buildCellsPreviewDocument(workspace).componentDemo?.tagName).toBe('academy-account-detail');
    const catalog = JSON.parse(workspace.files['demo/locales/locales.json'].content);
    expect(catalog.es['account.movements.empty']).toBe('No hay movimientos que coincidan con tu búsqueda.');
    expect(Object.keys(catalog.es).sort()).toEqual(Object.keys(catalog.en).sort());
  });

  it('starts the feature composition exercise with two missing contracts, not a finished solution', () => {
    expect(OPEN_CELLS_ARTIFACTS['account-detail']).toBeDefined();
    const workspace = createCellsCurriculumPracticeWorkspace(OPEN_CELLS_ARTIFACTS['account-detail']).snapshot;
    expect(auditCellsProject(workspace).results.filter((result) => !result.passed).map((result) => result.id)).toEqual(['scoped-components', 'public-event']);
  });
});
