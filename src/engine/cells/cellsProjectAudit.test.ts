import { describe, expect, it } from 'vitest';
import { auditCellsComponent } from './cellsProjectAudit';
import { createCellsComponentWorkspace, createCellsPracticeWorkspace } from './cellsRecipes';
import { writeCellsFile } from './cellsVirtualFileSystem';

describe('auditCellsComponent', () => {
  it.each([
    ['scaffold', ['package-contract']],
    ['api', ['public-property', 'public-event']],
    ['composition', ['scoped-components', 'public-event']],
    ['styles', ['style-pair']],
    ['i18n', ['locale-parity', 'locale-placeholders']],
    ['demo', ['demo-public-entry', 'demo-controls-property']],
    ['tests', ['test-public-event']],
    ['delivery', ['metadata-contract', 'readme-consumer-path']],
  ] as const)('cada starter %s falla solo en su misión de proyecto', (stage, expectedFailures) => {
    const audit = auditCellsComponent(createCellsPracticeWorkspace(stage).snapshot);
    expect(audit.results.filter((result) => !result.passed).map((result) => result.id)).toEqual(expectedFailures);
  });

  it('el proyecto completo supera todos los contratos', () => {
    const audit = auditCellsComponent(createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot);
    expect(audit.results.every((result) => result.passed)).toBe(true);
    expect(audit.coverage.behaviors.percentage).toBe(100);
  });

  it('rechaza un componente que conserva los archivos de estilo pero vuelve a incrustar css en la clase', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    const sourcePath = 'src/academy-learning-card.js';
    const source = workspace.snapshot.files[sourcePath].content
      .replace("import { LitElement, html } from 'lit';", "import { LitElement, css, html } from 'lit';")
      .replace("import styles from './academy-learning-card.css.js';\n", '')
      .replace('static styles = styles;', 'static styles = css`:host { display: block; }`;');
    const changed = writeCellsFile(workspace, sourcePath, source);

    expect(auditCellsComponent(changed.snapshot).results.find((result) => result.id === 'style-pair')?.passed).toBe(false);
  });
});
