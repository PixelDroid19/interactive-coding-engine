import { describe, expect, it } from 'vitest';
import { auditCellsProject } from './cellsProjectAudit';
import { createCellsAppWorkspace } from './cellsAppRecipes';
import { createCellsComponentWorkspace } from './cellsRecipes';
import { writeCellsFile } from './cellsVirtualFileSystem';

describe('soluciones equivalentes de las prácticas Cells', () => {
  it('accepts class-based scoped composition and a shared-style getter', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const path = 'src/academy-learning-card.js';
    const source = workspace.snapshot.files[path].content
      .replace(/static get scopedElements\(\) \{[\s\S]*?\n  \}/, `static get scopedElements() {
    const dependencies = [AcademyTypeText, AcademyActionButton, ...this.configurationScopedElements()];
    return this.scopedElementsFromClasses(dependencies);
  }`)
      .replace('static styles = styles;', `static get styles() { return [styles, getComponentSharedStyles('academy-learning-card-shared-styles')]; }`);
    const revised = writeCellsFile(workspace, path, source);
    const failed = auditCellsProject(revised.snapshot).results.filter((result) => !result.passed);
    expect(failed).toEqual([]);
    const missing = writeCellsFile(revised, path, source.replace('AcademyTypeText, AcademyActionButton,', 'AcademyTypeText,'));
    expect(auditCellsProject(missing.snapshot).results.find((result) => result.id === 'scoped-components')?.passed).toBe(false);
  });

  it('acepta una API de componente correcta aunque cambien orden, variables y payload intermedio', () => {
    let workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const sourcePath = 'src/academy-learning-card.js';
    const source = workspace.snapshot.files[sourcePath].content
      .replace("learnerName: { type: String, attribute: 'learner-name' }", "learnerName: { attribute: 'learner-name', type: String }")
      .replace("import styles from './academy-learning-card.css.js';", "import cardStyles from './academy-learning-card.css.js';")
      .replace('static styles = styles;', 'static styles = cardStyles;')
      .replace("this.emitEvent('continue', { learnerName: this.learnerName });", "const payload = { learnerName: this.learnerName };\n    this.emitEvent('continue', payload);");
    workspace = writeCellsFile(workspace, sourcePath, source);

    const demoPath = 'demo/demo.js';
    const demo = workspace.snapshot.files[demoPath].content
      .replace('const card =', 'const component =')
      .replace(/(?<![-\w])card(?=[?.])/g, 'component')
      .replace("(event) => {\n  component.learnerName = event.target.value;", "(inputEvent) => {\n  component.learnerName = inputEvent.target.value;");
    workspace = writeCellsFile(workspace, demoPath, demo);

    const testPath = 'test/unit/academy-learning-card.test.js';
    const tests = workspace.snapshot.files[testPath].content
      .replace('const event = await received;', 'const receivedEvent = await received;')
      .replaceAll('expect(event.', 'expect(receivedEvent.');
    workspace = writeCellsFile(workspace, testPath, tests);

    expect(auditCellsProject(workspace.snapshot).results.filter((result) => !result.passed)).toEqual([]);
  });

  it('acepta una app correcta aunque el estudiante use otros identificadores y comparaciones equivalentes', () => {
    let workspace = createCellsAppWorkspace({ name: 'academy-store-app' });
    const pagePath = 'app/pages/academy-home-page/academy-home-page.js';
    const page = workspace.snapshot.files[pagePath].content
      .replace('const product = event.detail;', 'const selectedProduct = event.detail;')
      .replace('this.publish(PRODUCT_SELECTED_CHANNEL, product);', 'this.publish(PRODUCT_SELECTED_CHANNEL, selectedProduct);')
      .replace("this.navigate('product-detail', { id: product.id });", "this.navigate('product-detail', { id: selectedProduct.id });");
    workspace = writeCellsFile(workspace, pagePath, page);

    const managerPath = 'app/data/academy-product-data-manager.js';
    const manager = workspace.snapshot.files[managerPath].content
      .replace('if (requestId !== this.requestId) return;', 'if (this.requestId !== requestId) return;')
      .replace('disconnect() { this.controller?.abort(); }', 'disconnect() { if (this.controller) this.controller.abort(); }');
    workspace = writeCellsFile(workspace, managerPath, manager);

    const cardPath = 'app/components/academy-product-card/academy-product-card.js';
    const card = workspace.snapshot.files[cardPath].content
      .replace("this.emitEvent('select', { ...this.product });", "const selected = { ...this.product }; this.emitEvent('select', selected);");
    workspace = writeCellsFile(workspace, cardPath, card);

    const bridgePath = 'app/bridge/native-adapter.js';
    const bridge = workspace.snapshot.files[bridgePath].content
      .replace("if (!message || typeof message.type !== 'string') return false;", "if (typeof message?.type !== 'string') return false;")
      .replace('publish(APP_LIFECYCLE_CHANNEL, { state: message.state });', 'const lifecycle = { state: message.state }; publish(APP_LIFECYCLE_CHANNEL, lifecycle);');
    workspace = writeCellsFile(workspace, bridgePath, bridge);

    expect(auditCellsProject(workspace.snapshot).results.filter((result) => !result.passed)).toEqual([]);
  });
});
