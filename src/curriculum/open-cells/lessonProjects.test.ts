import { describe, expect, it } from 'vitest';
import { OPEN_CELLS_ARTIFACTS, OPEN_CELLS_LESSON_PROJECTS } from './lessonProjects';

describe('matriz acumulativa de proyectos Open Cells', () => {
  it('asigna las 68 clases a artefactos diversos sin repetir una única card', () => {
    expect(OPEN_CELLS_LESSON_PROJECTS).toHaveLength(68);
    expect(new Set(OPEN_CELLS_LESSON_PROJECTS.map((entry) => entry.artifactId)).size).toBeGreaterThanOrEqual(15);

    let repeated = 1;
    for (let index = 1; index < OPEN_CELLS_LESSON_PROJECTS.length; index += 1) {
      repeated = OPEN_CELLS_LESSON_PROJECTS[index].artifactId === OPEN_CELLS_LESSON_PROJECTS[index - 1].artifactId
        ? repeated + 1
        : 1;
      expect(repeated, `se repite ${OPEN_CELLS_LESSON_PROJECTS[index].artifactId} demasiadas clases`).toBeLessThanOrEqual(2);
    }
  });

  it('solo reutiliza artefactos que ya aparecieron antes', () => {
    const firstUse = new Map<string, number>();
    for (const entry of OPEN_CELLS_LESSON_PROJECTS) {
      if (!firstUse.has(entry.artifactId)) firstUse.set(entry.artifactId, entry.lesson);
    }
    for (const artifact of Object.values(OPEN_CELLS_ARTIFACTS)) {
      for (const dependency of artifact.dependencies) {
        expect(firstUse.get(dependency), `${artifact.id} depende de ${dependency} sin lección`).toBeLessThan(artifact.firstLesson);
      }
    }
  });

  it('mantiene componentes neutrales y cambia a workspaces de aplicación desde la lección 39', () => {
    for (const entry of OPEN_CELLS_LESSON_PROJECTS) {
      expect(entry.artifactId).not.toMatch(/private|internal|corporate/i);
      expect(entry.workspaceKind).toBe(entry.lesson <= 38 ? 'component' : 'application');
    }
  });
});
