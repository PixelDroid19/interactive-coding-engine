import { createCellsProjectWorkspace, type CellsAppProject } from '../../engine/cells/cellsAppRecipes';
import { createCellsCurriculumComponentWorkspace } from '../../engine/cells/cellsCurriculumRecipes';
import type { VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { openCellsArtifactForLesson, openCellsProjectForLesson } from './lessonProjects';

function applicationProjectFor(number: number): CellsAppProject {
  if (number <= 46) return 'store';
  if (number <= 54) return 'museum';
  if (number <= 58) return 'relay';
  if (number <= 62) return 'climate';
  return 'capstone';
}

export function createOpenCellsLessonWorkspace(number: number): VersionedCellsWorkspace {
  const project = openCellsProjectForLesson(number);
  const artifact = openCellsArtifactForLesson(number);
  return project.workspaceKind === 'component'
    ? createCellsCurriculumComponentWorkspace(artifact)
    : createCellsProjectWorkspace(applicationProjectFor(number), artifact.id);
}
