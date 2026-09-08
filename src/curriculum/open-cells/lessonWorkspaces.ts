import { createCellsProjectWorkspace, type CellsAppProject } from '../../engine/cells/cellsAppRecipes';
import { createCellsCurriculumComponentWorkspace } from '../../engine/cells/cellsCurriculumRecipes';
import { createVersionedCellsWorkspace, writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { openCellsArtifactForLesson, openCellsProjectForLesson } from './lessonProjects';
import { advancedApplicationArtifactForLesson } from './advancedApplicationArtifacts';
import { connectPendingChangesWorkspace } from './pendingChangesWorkspace';
import { connectDelegatedRoutesWorkspace } from './delegatedRoutesWorkspace';
import { connectPageRetentionWorkspace } from './pageRetentionWorkspace';
import { connectFeatureFlagsWorkspace } from './featureFlagsWorkspace';
import { connectOfflineShellWorkspace } from './offlineShellWorkspace';
import { connectTraceWorkspace } from './traceWorkspace';
import { connectAnalyticsWorkspace } from './analyticsWorkspace';
import { connectPerformanceWorkspace } from './performanceWorkspace';
import { connectReleaseWorkspace } from './releaseWorkspace';

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
  const artifactWorkspace = writeCellsFile(base, advanced.path, advanced.source);
  const withArtifact = number === 75 ? connectPendingChangesWorkspace(artifactWorkspace)
    : number === 76 ? connectDelegatedRoutesWorkspace(artifactWorkspace)
    : number === 77 ? connectPageRetentionWorkspace(artifactWorkspace)
    : number === 78 ? connectFeatureFlagsWorkspace(artifactWorkspace)
    : number === 79 ? connectOfflineShellWorkspace(artifactWorkspace)
    : number === 80 ? connectTraceWorkspace(artifactWorkspace)
    : number === 81 ? connectAnalyticsWorkspace(artifactWorkspace)
    : number === 82 ? connectPerformanceWorkspace(artifactWorkspace)
    : number === 83 ? connectReleaseWorkspace(artifactWorkspace) : artifactWorkspace;
  return createVersionedCellsWorkspace({ ...withArtifact.snapshot, activeFilePath: advanced.path }, 0);
}
