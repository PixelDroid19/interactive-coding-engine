import type { WorkspaceFile } from '../../types/scrim';

export interface WorkspaceFileNode {
  kind: 'file';
  name: string;
  path: string;
  file: WorkspaceFile;
}

export interface WorkspaceFolderNode {
  kind: 'folder';
  name: string;
  path: string;
  children: WorkspaceTreeNode[];
}

export type WorkspaceTreeNode = WorkspaceFileNode | WorkspaceFolderNode;

interface MutableFolder {
  name: string;
  path: string;
  folders: Map<string, MutableFolder>;
  files: WorkspaceFileNode[];
}

function orderedChildren(folder: MutableFolder): WorkspaceTreeNode[] {
  const folders = [...folder.folders.values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map<WorkspaceFolderNode>((child) => ({
      kind: 'folder',
      name: child.name,
      path: child.path,
      children: orderedChildren(child),
    }));
  const files = folder.files.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return [...folders, ...files];
}

export function buildWorkspaceTree(files: Record<string, WorkspaceFile>): WorkspaceTreeNode[] {
  const root: MutableFolder = { name: '', path: '', folders: new Map(), files: [] };

  Object.values(files).forEach((file) => {
    const path = file.path.replace(/^\/+|\/+$/g, '');
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return;

    let parent = root;
    parts.slice(0, -1).forEach((part) => {
      const folderPath = parent.path ? `${parent.path}/${part}` : part;
      let folder = parent.folders.get(part);
      if (!folder) {
        folder = { name: part, path: folderPath, folders: new Map(), files: [] };
        parent.folders.set(part, folder);
      }
      parent = folder;
    });

    parent.files.push({ kind: 'file', name: parts.at(-1)!, path, file });
  });

  return orderedChildren(root);
}

export function workspaceFolderAncestors(path: string): string[] {
  const parts = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'));
}

export function filterWorkspaceTree(nodes: WorkspaceTreeNode[], query: string): WorkspaceTreeNode[] {
  const normalized = query.trim().toLocaleLowerCase('es');
  if (!normalized) return nodes;

  return nodes.flatMap<WorkspaceTreeNode>((node) => {
    if (node.kind === 'file') {
      return node.path.toLocaleLowerCase('es').includes(normalized) ? [node] : [];
    }
    const children = filterWorkspaceTree(node.children, normalized);
    return children.length ? [{ ...node, children }] : [];
  });
}

export function visibleWorkspaceFilePaths(nodes: WorkspaceTreeNode[], expandedPaths: ReadonlySet<string>): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'file') return [node.path];
    return expandedPaths.has(node.path) ? visibleWorkspaceFilePaths(node.children, expandedPaths) : [];
  });
}
