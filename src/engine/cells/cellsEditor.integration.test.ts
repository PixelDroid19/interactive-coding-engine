import { describe, expect, it } from 'vitest';
import { typeScriptLibraries } from 'virtual:typescript-libraries';
import { TypeScriptLanguageService } from '../../editor/typeScriptLanguageService';
import { createCellsComponentWorkspace } from './cellsRecipes';
import { createCellsAppWorkspace } from './cellsAppRecipes';

describe('inteligencia del editor Cells', () => {
  it('reconoce los paquetes del scaffold sin marcar imports válidos como errores', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    service.replaceWorkspace(Object.values(workspace.files)
      .filter((file) => file.language === 'javascript' || file.language === 'typescript')
      .map(({ path, content }) => ({ path, content })));

    const diagnostics = service.diagnostics('src/academy-learning-card.js');
    expect(diagnostics, diagnostics.map((diagnostic) => diagnostic.message).join('\n')).toEqual([]);
  });

  it('muestra en español el contrato de emitEvent', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    service.replaceWorkspace(Object.values(workspace.files)
      .filter((file) => file.language === 'javascript' || file.language === 'typescript')
      .map(({ path, content }) => ({ path, content })));
    const source = workspace.files['src/academy-learning-card.js'].content;
    const position = source.indexOf('emitEvent') + 3;
    const hover = service.hover('src/academy-learning-card.js', position);
    expect(hover?.documentation).toContain('Emite un evento público');
  });

  it('entiende imports locales y APIs de páginas Cells en una app completa', () => {
    const workspace = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    service.replaceWorkspace(Object.values(workspace.files)
      .filter((file) => file.language === 'javascript' || file.language === 'typescript')
      .map(({ path, content }) => ({ path, content })));
    const files = Object.values(workspace.files).filter((file) => file.language === 'javascript' && file.path.startsWith('app/'));
    const diagnostics = files.flatMap((file) => service.diagnostics(file.path).map((entry) => `${file.path}: ${entry.message}`));
    expect(diagnostics, diagnostics.join('\n')).toEqual([]);

    const page = workspace.files['app/pages/academy-home-page/academy-home-page.js'].content;
    const hover = service.hover('app/pages/academy-home-page/academy-home-page.js', page.indexOf('navigate') + 3);
    expect(hover?.documentation).toContain('Navega usando el nombre estable');
  });
});
