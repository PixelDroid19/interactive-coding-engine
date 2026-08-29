import { createCellsProjectWorkspace, type CellsAppProject } from '../../engine/cells/cellsAppRecipes';
import { createCellsCurriculumComponentWorkspace } from '../../engine/cells/cellsCurriculumRecipes';
import { createVersionedCellsWorkspace, writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { openCellsArtifactForLesson, openCellsProjectForLesson } from './lessonProjects';
import { advancedApplicationArtifactForLesson } from './advancedApplicationArtifacts';

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
  const base = project.workspaceKind === 'component'
    ? createCellsCurriculumComponentWorkspace(artifact)
    : createCellsProjectWorkspace(applicationProjectFor(number), artifact.id);
  const advanced = advancedApplicationArtifactForLesson(number);
  if (!advanced) return base;
  const withArtifact = writeCellsFile(base, advanced.path, advanced.source);
  return createVersionedCellsWorkspace({ ...withArtifact.snapshot, activeFilePath: advanced.path }, 0);
}
