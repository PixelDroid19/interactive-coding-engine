import type { WorkspaceFile, WorkspaceSnapshot } from '../types/scrim';
import { isLiveHelpWorkspacePath, type LiveHelpPatch } from './protocol';

export type PatchProposalOutcome = Readonly<{ outcome: 'conflict' }> | Readonly<{ outcome: 'applied'; revision: number }>;

function languageForPath(path: string): WorkspaceFile['language'] {
  const extension = path.split('.').at(-1)?.toLowerCase();
  if (extension === 'html') return 'html';
  if (extension === 'css') return 'css';
  if (extension === 'ts' || extension === 'tsx') return 'typescript';
  if (extension === 'json') return 'json';
  if (extension === 'py') return 'python';
  if (extension === 'md') return 'markdown';
  return 'javascript';
}

export function applyLiveHelpPatch(workspace: WorkspaceSnapshot, patch: LiveHelpPatch): WorkspaceSnapshot {
  const files = Object.assign(Object.create(null), workspace.files) as Record<string, WorkspaceFile>;
  for (const update of patch.files) {
    if (!isLiveHelpWorkspacePath(update.path)) throw new Error('Ruta de archivo de ayuda en vivo inválida.');
    const current = Object.prototype.hasOwnProperty.call(files, update.path) ? files[update.path] : undefined;
    files[update.path] = current
      ? { ...current, content: update.content }
      : { path: update.path, name: update.path.split('/').at(-1) || update.path, language: languageForPath(update.path), content: update.content };
  }
  if (patch.activeFile && !isLiveHelpWorkspacePath(patch.activeFile)) throw new Error('Ruta de archivo de ayuda en vivo inválida.');
  const activeFilePath = patch.activeFile && Object.prototype.hasOwnProperty.call(files, patch.activeFile) ? patch.activeFile : workspace.activeFilePath;
  return { ...workspace, files, activeFilePath };
}

export function applyPatchProposal(input: Readonly<{
  workspace: WorkspaceSnapshot;
  revision: number;
  patch: LiveHelpPatch;
  commit(next: WorkspaceSnapshot): void;
  pause?(): void;
}>): PatchProposalOutcome {
  if (input.revision !== input.patch.baseRevision) return { outcome: 'conflict' };
  const next = applyLiveHelpPatch(input.workspace, input.patch);
  input.pause?.();
  input.commit(next);
  return { outcome: 'applied', revision: input.revision + 1 };
}
