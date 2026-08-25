import { describe, expect, it } from 'vitest';
import { typeScriptLibraries } from 'virtual:typescript-libraries';
import { Course, DebuggingExerciseItem } from '../types/curriculum';
import { ScrimLessonData, WorkspaceSnapshot } from '../types/scrim';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from '../curriculum/javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../curriculum/web-components-lit/course';
import { buildWorkspaceDomDeclarations, WORKSPACE_DOM_TYPES_PATH } from './workspaceTypeDeclarations';
import { TypeScriptLanguageService } from './typeScriptLanguageService';

const catalogs: Array<[Course, Record<string, ScrimLessonData>]> = [
  [FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS],
  [JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS],
  [COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS],
];

function expectValidWorkspace(id: string, workspace: WorkspaceSnapshot) {
  const files = Object.values(workspace.files);
  expect(files.length, `${id} no contiene archivos`).toBeGreaterThan(0);
  expect(workspace.files[workspace.activeFilePath], `${id} abre un archivo que no existe`).toBeDefined();
  expect(new Set(files.map((file) => file.path)).size, `${id} repite rutas de archivo`).toBe(files.length);
  for (const file of files) {
    expect(file.path.trim(), `${id} contiene una ruta vacía`).toBeTruthy();
    expect(['javascript', 'typescript', 'html', 'css', 'json'], `${id}/${file.path} usa un lenguaje incompatible con el editor`)
      .toContain(file.language);
  }
}

function diagnosticsFor(service: TypeScriptLanguageService, id: string, workspace: WorkspaceSnapshot) {
  const files = Object.values(workspace.files);
  const semanticFiles = files
    .filter((file) => ['javascript', 'typescript'].includes(file.language))
    .map(({ path, content }) => ({ path, content }));
  const domDeclarations = buildWorkspaceDomDeclarations(files);
  if (domDeclarations) semanticFiles.push({ path: WORKSPACE_DOM_TYPES_PATH, content: domDeclarations });
  service.replaceWorkspace(semanticFiles);

  return semanticFiles
    .filter((file) => !file.path.endsWith('.d.ts'))
    .flatMap((file) => service.diagnostics(file.path).map((diagnostic) => `${id}/${file.path}: ${diagnostic.message}`));
}

describe('auditoría integrada del editor en todos los cursos', () => {
  it('abre correctamente los workspaces de las 93 clases y de sus 93 laboratorios', () => {
    const lessons = catalogs.flatMap(([, catalog]) => Object.values(catalog));
    const labs = catalogs.flatMap(([course]) => course.modules.flatMap((module) => module.items))
      .filter((item): item is DebuggingExerciseItem => item.type === 'debugging');

    expect(lessons).toHaveLength(93);
    expect(labs).toHaveLength(93);
    lessons.forEach((lesson) => expectValidWorkspace(lesson.id, lesson.initialWorkspace));
    labs.forEach((lab) => expectValidWorkspace(lab.id, lab.initialWorkspace));
  });

  it('las 93 clases parten sin falsos errores de JavaScript o TypeScript', () => {
    const service = new TypeScriptLanguageService(typeScriptLibraries);
    const diagnostics = catalogs.flatMap(([, catalog]) => Object.values(catalog))
      .flatMap((lesson) => diagnosticsFor(service, lesson.id, lesson.initialWorkspace));

    expect(diagnostics, diagnostics.join('\n')).toEqual([]);
  });
});
