import { describe, expect, it } from 'vitest';
import { typeScriptLibraries } from 'virtual:typescript-libraries';
import { TypeScriptLanguageService } from '../../editor/typeScriptLanguageService';
import { buildWorkspaceSemanticFiles } from '../../editor/workspaceSemanticFiles';
import { createCellsComponentWorkspace } from './cellsRecipes';
import { createCellsAppWorkspace } from './cellsAppRecipes';
import { createOpenCellsLessonWorkspace } from '../../curriculum/open-cells/lessonWorkspaces';

function replaceWorkspace(service: TypeScriptLanguageService, workspace: ReturnType<typeof createCellsComponentWorkspace>['snapshot']): void {
  service.replaceWorkspace(buildWorkspaceSemanticFiles(Object.values(workspace.files)));
}

describe('inteligencia del editor Cells', () => {
  it('reconoce los paquetes del scaffold sin marcar imports válidos como errores', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    replaceWorkspace(service, workspace);

    const diagnostics = service.diagnostics('src/academy-learning-card.js');
    expect(diagnostics, diagnostics.map((diagnostic) => diagnostic.message).join('\n')).toEqual([]);
  });

  it('muestra en español el contrato de emitEvent', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    replaceWorkspace(service, workspace);
    const source = workspace.files['src/academy-learning-card.js'].content;
    const position = source.indexOf('emitEvent') + 3;
    const hover = service.hover('src/academy-learning-card.js', position);
    expect(hover?.documentation).toContain('Emite un evento público');
  });

  it('no inventa errores en los componentes variados ni en sus pruebas públicas', () => {
    for (const lesson of [1, 3, 6, 10, 16, 21, 23, 37]) {
      const workspace = createOpenCellsLessonWorkspace(lesson).snapshot;
      const service = new TypeScriptLanguageService(typeScriptLibraries);
      replaceWorkspace(service, workspace);
      const protagonist = Object.values(workspace.files).find((file) => /^src\/[^/]+\.js$/.test(file.path) && file.content.includes('WidgetMixin('));
      const testFile = Object.values(workspace.files).find((file) => /^test\/unit\/[^/]+\.test\.js$/.test(file.path));
      const diagnostics = [protagonist, testFile]
        .filter((file): file is NonNullable<typeof file> => Boolean(file))
        .flatMap((file) => service.diagnostics(file.path).map((entry) => `${file.path}: ${entry.message}`));
      expect(diagnostics, `lección ${lesson}\n${diagnostics.join('\n')}`).toEqual([]);
    }
  });

  it('reconoce los globals de Vitest declarados por el proyecto Cells', () => {
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    replaceWorkspace(service, workspace);

    const diagnostics = service.diagnostics('test/unit/academy-learning-card.test.js');
    expect(diagnostics, diagnostics.map((diagnostic) => diagnostic.message).join('\n')).toEqual([]);
  });

  it('entiende imports locales y APIs de páginas Cells en una app completa', () => {
    const workspace = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    replaceWorkspace(service, workspace);
    const files = Object.values(workspace.files).filter((file) => file.language === 'javascript' && file.path.startsWith('app/'));
    const diagnostics = files.flatMap((file) => service.diagnostics(file.path).map((entry) => `${file.path}: ${entry.message}`));
    expect(diagnostics, diagnostics.join('\n')).toEqual([]);

    const page = workspace.files['app/pages/academy-home-page/academy-home-page.js'].content;
    const hover = service.hover('app/pages/academy-home-page/academy-home-page.js', page.indexOf('navigate') + 3);
    expect(hover?.documentation).toContain('Navega usando el nombre estable');
  });
});
