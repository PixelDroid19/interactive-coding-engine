import { describe, expect, it } from 'vitest';
import { createCellsComponentWorkspace } from './cellsRecipes';
import { createCellsAppWorkspace } from './cellsAppRecipes';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';
import { writeCellsFile } from './cellsVirtualFileSystem';

describe('buildCellsPreviewDocument', () => {
  it('construye una vista previa aislada con el runtime Cells permitido', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const result = buildCellsPreviewDocument(workspace.snapshot);
    expect(result.warnings).toEqual([]);
    expect(result.html).not.toContain('<iframe');
    expect(result.html).toContain('Content-Security-Policy');
    expect(result.html).toContain('"lit":"https://esm.sh/lit@3.3.3"');
    expect(result.html).toContain('workspace%3A%2Fsrc%2Fmixins%2FWidgetMixin.js');
    expect(result.html).toContain('https%3A%2F%2Fesm.sh%2F%40webcomponents%2Fscoped-custom-element-registry%400.0.10');
    expect(result.html).toContain('https%3A%2F%2Fesm.sh%2F%40open-wc%2Fscoped-elements%403.0.6%2Flit-element.js');
    expect(result.html).toContain('<academy-learning-card data-cells-demo-subject learner-name="Ada"');
    expect(result.html).toContain('workspace:/demo/demo.js');
    expect(result.html).toContain('__OPEN_CELLS_LOCALES__');
    expect(result.html).toContain('globalThis.IntlMsg');
    expect(result.html).toContain('Bienvenido');
    expect(result.html).toContain('data-cells-demo-shell');
    expect(result.html).toContain('Visual');
    expect(result.html).toContain('Código');
    expect(result.html).toContain('Documentación');
    expect(result.html).toContain('Móvil');
    expect(result.html).toContain('Eventos');
    expect(result.html).toContain('Ocultar interfaz');
  });

  it('mantiene las aplicaciones como render completo sin el marco de demo de componentes', () => {
    const workspace = createCellsAppWorkspace({ name: 'academy-store-app' });
    const result = buildCellsPreviewDocument(workspace.snapshot);

    expect(result.html).not.toContain('data-cells-demo-shell');
    expect(result.html).toContain('<main id="app"');
  });

  it('rechaza paquetes que no están en la allowlist', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const changed = writeCellsFile(
      workspace,
      'src/academy-learning-card.js',
      `${workspace.snapshot.files['src/academy-learning-card.js'].content}\nimport x from 'paquete-desconocido';`,
    );
    expect(() => buildCellsPreviewDocument(changed.snapshot)).toThrow(/paquete-desconocido/);
  });

  it('rechaza scripts remotos introducidos por el proyecto', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const changed = writeCellsFile(workspace, 'demo/index.html', '<script src="https://evil.example/run.js"></script>');
    expect(() => buildCellsPreviewDocument(changed.snapshot)).toThrow(/scripts remotos/);
  });

  it('puede incorporar un runner conductual que prueba render, idioma, scopedElements y evento', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const result = buildCellsPreviewDocument(workspace.snapshot, { runContractTests: true, testRunId: 'run-component' });

    expect(result.html).toContain("source: 'open-cells-tests'");
    expect(result.html).toContain('await element.updateComplete');
    expect(result.html).toContain("querySelector('bbva-type-text')");
    expect(result.html).toContain('titleHost?.shadowRoot?.textContent');
    expect(result.html).toContain('constructor.scopedElements');
    expect(result.html).toContain("__OPEN_CELLS_LOCALE__ = 'es'");
    expect(result.html).toContain("__OPEN_CELLS_LOCALE__ = 'en'");
    expect(result.html).toContain('__OPEN_CELLS_CONTRACT_TESTS__ = true');
    expect(result.html).toContain('.click()');
    expect(result.html).toContain('event?.detail');
  });
});
