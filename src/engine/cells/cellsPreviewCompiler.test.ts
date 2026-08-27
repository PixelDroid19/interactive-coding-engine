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
    expect(result.html).toContain('<academy-learning-card data-cells-demo-subject>');
    expect(result.html).toContain('workspace:/demo/demo.js');
    expect(result.html).toContain('__OPEN_CELLS_LOCALES__');
    expect(result.html).toContain('globalThis.IntlMsg');
    expect(result.html).toContain('Bienvenido');
    expect(result.html).not.toContain('data-cells-demo-shell');
    expect(result.html).not.toContain('cells-demo-topbar');
    expect(result.html).toContain("event.data.type === 'demo:set-case'");
    expect(result.html).toContain("type: 'component:event'");
    expect(result.html).toContain("this === document.querySelector('[data-cells-demo-subject]')");
    expect(result.html).toContain('data-cells-unresolved-element');
    expect(result.componentDemo).toMatchObject({
      tagName: 'academy-learning-card',
      packageName: '@open-cells-learning/academy-learning-card',
    });
    expect(result.componentDemo?.cases).toHaveLength(2);
    expect(result.componentDemo?.cases[0]).toMatchObject({
      id: 'current-code',
      label: 'Código actual',
      properties: {},
    });
    expect(result.componentDemo?.cases[0].markup).not.toContain('learner-name=');
    expect(result.componentDemo?.cases[1]).toMatchObject({
      id: 'basic',
      properties: { learnerName: 'Ada' },
    });
  });

  it('deriva el workbench del paquete, las demos y el manifiesto reales', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const files = { ...workspace.snapshot.files };
    const packageData = JSON.parse(files['package.json'].content);
    packageData.version = '2.4.1';
    files['package.json'] = { ...files['package.json'], content: `${JSON.stringify(packageData, null, 2)}\n` };

    const metadata = JSON.parse(files['custom-elements.json'].content);
    metadata.modules[0].declarations[0] = {
      ...metadata.modules[0].declarations[0],
      description: 'Muestra el estado real de una operación.',
      members: [
        { kind: 'field', name: 'statusLabel', attribute: 'status-label', type: { text: 'string' }, default: "'Pendiente'", description: 'Texto visible.' },
        { kind: 'field', name: 'disabled', attribute: 'disabled', type: { text: 'boolean' }, default: 'false', description: 'Bloquea la acción.' },
      ],
      events: [
        { name: 'academy-learning-card-change', type: { text: 'CustomEvent<{ status: string }>' }, description: 'Informa el estado elegido.' },
      ],
      slots: [{ name: '', description: 'Contenido complementario.' }],
      cssProperties: [{ name: '--status-accent', default: '#0f766e', description: 'Acento visual.' }],
    };
    files['custom-elements.json'] = { ...files['custom-elements.json'], content: `${JSON.stringify(metadata, null, 2)}\n` };
    delete files['demo/basic.html'];
    files['demo/compact.html'] = {
      path: 'demo/compact.html',
      name: 'compact.html',
      language: 'html',
      content: '<!doctype html><title>Estado compacto</title><academy-learning-card status-label="Preparado" disabled><span>Detalle</span></academy-learning-card>',
    };

    const result = buildCellsPreviewDocument({ ...workspace.snapshot, files });

    expect(result.componentDemo).toMatchObject({
      packageName: '@open-cells-learning/academy-learning-card',
      packageVersion: '2.4.1',
      locales: ['en', 'es'],
      cases: [
        {
          id: 'current-code',
          label: 'Código actual',
          properties: {},
        },
        {
          id: 'compact',
          label: 'Estado compacto',
          sourcePath: 'demo/compact.html',
          properties: { statusLabel: 'Preparado', disabled: true },
        },
      ],
      documentation: {
        description: 'Muestra el estado real de una operación.',
        properties: [
          expect.objectContaining({ name: 'statusLabel', attribute: 'status-label' }),
          expect.objectContaining({ name: 'disabled', type: 'boolean' }),
        ],
        events: [expect.objectContaining({ name: 'academy-learning-card-change' })],
        slots: [expect.objectContaining({ name: 'default' })],
        cssProperties: [expect.objectContaining({ name: '--status-accent' })],
      },
    });
    expect(result.componentDemo?.cases[1].markup).toContain('<span>Detalle</span>');
    expect(result.componentDemo?.documentation?.properties?.some((property) => property.name === 'learnerName')).toBe(false);
    expect(result.componentDemo?.documentation?.events?.some((event) => event.name.endsWith('-continue'))).toBe(false);
  });

  it('evita duplicar eventos que ya captura el runtime genérico', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const result = buildCellsPreviewDocument(workspace.snapshot);

    expect(result.html).not.toContain("document.addEventListener('academy-learning-card-continue'");
  });

  it('mantiene las aplicaciones como render completo sin el marco de demo de componentes', () => {
    const workspace = createCellsAppWorkspace({ name: 'academy-store-app' });
    const result = buildCellsPreviewDocument(workspace.snapshot);

    expect(result.html).not.toContain('data-cells-demo-shell');
    expect(result.html).toContain('<main id="app"');
  });

  it('deja la interfaz de demostración fuera del documento ejecutable', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const result = buildCellsPreviewDocument(workspace.snapshot);

    expect(result.html).toContain('<academy-learning-card data-cells-demo-subject');
    expect(result.html).not.toContain('Caso de demostración');
    expect(result.html).not.toContain('Ocultar interfaz');
  });

  it('compila el módulo editado por el estudiante y no una representación fija', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const sourcePath = 'src/academy-learning-card.js';
    const editedSource = workspace.snapshot.files[sourcePath].content
      .replace("learnerName = 'Alex';", "learnerName = 'NombreDesdeElEditor';")
      .replace('class="learning-card"', 'class="componente-editado-en-vivo"');
    const changed = writeCellsFile(workspace, sourcePath, editedSource);

    const result = buildCellsPreviewDocument(changed.snapshot);

    expect(result.componentDemo?.source).toBe(editedSource);
    expect(result.html).toContain(encodeURIComponent("learnerName = 'NombreDesdeElEditor';"));
    expect(result.html).toContain(encodeURIComponent('class="componente-editado-en-vivo"'));
    expect(result.html).not.toContain(encodeURIComponent("learnerName = 'Alex';"));
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
    expect(result.html).toContain("querySelector('academy-type-text')");
    expect(result.html).toContain('titleHost?.shadowRoot?.textContent');
    expect(result.html).toContain('constructor.scopedElements');
    expect(result.html).toContain("__OPEN_CELLS_LOCALE__ = 'es'");
    expect(result.html).toContain("__OPEN_CELLS_LOCALE__ = 'en'");
    expect(result.html).toContain('__OPEN_CELLS_CONTRACT_TESTS__ = true');
    expect(result.html).toContain('.click()');
    expect(result.html).toContain('event?.detail');
  });
});
