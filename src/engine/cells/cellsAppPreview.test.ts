import { describe, expect, it } from 'vitest';
import { createCellsAppWorkspace } from './cellsAppRecipes';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';

describe('preview de aplicación Cells', () => {
  it('resuelve el grafo local completo dentro del iframe', () => {
    const workspace = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
    const result = buildCellsPreviewDocument(workspace);
    expect(result.html).toContain('workspace:/app/scripts/app.js');
    expect(result.html).toContain('workspace%3A%2Fapp%2Fscripts%2Fapp-routes.js');
    expect(result.html).toContain('workspace%3A%2Fapp%2Fpages%2Facademy-home-page%2Facademy-home-page.js');
    expect(result.html).toContain('"@open-cells/page-mixin":"data:text/javascript');
    expect(result.html).toContain('"@open-cells/core":"data:text/javascript');
    expect(result.html).not.toContain('@open-cells-learning/app-runtime');
    expect(result.html).toContain('<main id="app" aria-live="polite"></main>');
    expect(result.html).toContain('await globalThis.__OPEN_CELLS_APP_READY__');
  });

  it('inyecta una historia vertical real cuando se solicitan pruebas de contrato', () => {
    const workspace = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
    const result = buildCellsPreviewDocument(workspace, { runContractTests: true, testRunId: 'run-app' });

    expect(result.html).toContain("'app-navigation'");
    expect(result.html).toContain("'app-cleanup'");
    expect(result.html).toContain("'app-data-states'");
    expect(result.html).toContain("'app-data-cleanup'");
    expect(result.html).toContain("workspace:/app/data/academy-product-data-manager.js");
    expect(result.html).toContain("academy:store:product:selected");
    expect(result.html).toContain("source: 'open-cells-tests'");
  });
});
