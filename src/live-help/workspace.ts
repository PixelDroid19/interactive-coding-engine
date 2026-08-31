import type { WorkspaceFile, WorkspaceSnapshot } from '../types/scrim';
import { isLiveHelpWorkspacePath, type LiveHelpPatch } from './protocol';

export type PatchProposalOutcome = Readonly<{ outcome: 'blocked'; message: string }> | Readonly<{ outcome: 'conflict' }> | Readonly<{ outcome: 'applied'; revision: number }>;

const FNV_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const SAFE_INTEGER_MASK = (1n << 53n) - 1n;

function hashWorkspaceField(hash: bigint, value: string): bigint {
  const framed = `${value.length}:${value};`;
  let next = hash;
  for (let index = 0; index < framed.length; index += 1) {
    next ^= BigInt(framed.charCodeAt(index));
    next = BigInt.asUintN(64, next * FNV_PRIME);
  }
  return next;
}

export function liveHelpWorkspaceRevision(workspace: WorkspaceSnapshot): number {
  let hash = hashWorkspaceField(FNV_OFFSET_BASIS, workspace.activeFilePath);
  for (const path of Object.keys(workspace.files).sort()) {
    hash = hashWorkspaceField(hash, path);
    hash = hashWorkspaceField(hash, workspace.files[path].content);
  }
  return Number(hash & SAFE_INTEGER_MASK);
}

export function hasSameLiveHelpWorkspace(left: WorkspaceSnapshot, right: WorkspaceSnapshot): boolean {
  if (left.activeFilePath !== right.activeFilePath) return false;
  const leftPaths = Object.keys(left.files);
  const rightPaths = Object.keys(right.files);
  if (leftPaths.length !== rightPaths.length) return false;
  return leftPaths.every((path) => (
    Object.prototype.hasOwnProperty.call(right.files, path)
    && left.files[path].content === right.files[path].content
  ));
}

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
  validate?(next: WorkspaceSnapshot): string | null;
}>): PatchProposalOutcome {
  if (input.revision !== input.patch.baseRevision) return { outcome: 'conflict' };
  const next = applyLiveHelpPatch(input.workspace, input.patch);
  if (hasSameLiveHelpWorkspace(input.workspace, next)) {
    return { outcome: 'blocked', message: 'La propuesta no cambia el código actual.' };
  }
  const validationMessage = input.validate?.(next);
  if (validationMessage) return { outcome: 'blocked', message: validationMessage };
  input.commit(next);
  input.pause?.();
  return { outcome: 'applied', revision: liveHelpWorkspaceRevision(next) };
}
