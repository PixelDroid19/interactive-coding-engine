import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen } from 'lucide-react';
import type { WorkspaceFile } from '../../types/scrim';
import { buildWorkspaceTree, filterWorkspaceTree, workspaceFolderAncestors, type WorkspaceTreeNode } from './workspaceTreeModel';

interface WorkspaceTreeProps {
  files: Record<string, WorkspaceFile>;
  activeFilePath: string;
  onFileSelect: (path: string) => void;
  query?: string;
  expandedPaths?: string[];
  onExpandedPathsChange?: (paths: string[]) => void;
  renderFileIcon?: (file: WorkspaceFile) => React.ReactNode;
  renderFileActions?: (file: WorkspaceFile) => React.ReactNode;
  className?: string;
}

export const WorkspaceTree: React.FC<WorkspaceTreeProps> = ({
  files,
  activeFilePath,
  onFileSelect,
  query = '',
  expandedPaths,
  onExpandedPathsChange,
  renderFileIcon,
  renderFileActions,
  className = '',
}) => {
  const activeAncestors = useMemo(() => workspaceFolderAncestors(activeFilePath), [activeFilePath]);
  const [internalExpanded, setInternalExpanded] = useState<string[]>(activeAncestors);
  const controlled = expandedPaths !== undefined;
  const effectiveExpanded = controlled ? expandedPaths : internalExpanded;
  const tree = useMemo(() => filterWorkspaceTree(buildWorkspaceTree(files), query), [files, query]);
  const searchFolders = useMemo(() => {
    if (!query.trim()) return [];
    const collect = (nodes: WorkspaceTreeNode[]): string[] => nodes.flatMap((node) => (
      node.kind === 'folder' ? [node.path, ...collect(node.children)] : []
    ));
    return collect(tree);
  }, [query, tree]);
  const openPaths = useMemo(() => new Set([...effectiveExpanded, ...activeAncestors, ...searchFolders]), [activeAncestors, effectiveExpanded, searchFolders]);

  useEffect(() => {
    const merged = [...new Set([...effectiveExpanded, ...activeAncestors])];
    if (merged.length === effectiveExpanded.length) return;
    if (controlled) onExpandedPathsChange?.(merged);
    else setInternalExpanded(merged);
  }, [activeAncestors, controlled, effectiveExpanded, onExpandedPathsChange]);

  const toggle = (path: string) => {
    const next = openPaths.has(path)
      ? effectiveExpanded.filter((candidate) => candidate !== path)
      : [...new Set([...effectiveExpanded, path])];
    if (controlled) onExpandedPathsChange?.(next);
    else setInternalExpanded(next);
  };

  const renderNodes = (nodes: WorkspaceTreeNode[], depth = 0): React.ReactNode => nodes.map((node) => {
    if (node.kind === 'folder') {
      const open = openPaths.has(node.path);
      return (
        <li key={node.path} role="treeitem" aria-expanded={open} className="workspace-tree__node workspace-tree__node--folder">
          <button
            type="button"
            className="workspace-tree__row workspace-tree__folder"
            style={{ '--tree-depth': depth } as React.CSSProperties}
            onClick={() => toggle(node.path)}
            aria-label={`${open ? 'Contraer' : 'Expandir'} carpeta ${node.name}`}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {open ? <FolderOpen size={15} /> : <Folder size={15} />}
            <span>{node.name}</span>
          </button>
          {open && <ul role="group">{renderNodes(node.children, depth + 1)}</ul>}
        </li>
      );
    }

    const active = node.path === activeFilePath;
    return (
      <li key={node.path} role="treeitem" aria-selected={active} className="workspace-tree__node workspace-tree__node--file" data-file-row>
        <div className={`workspace-tree__row workspace-tree__file ${active ? 'is-active' : ''}`} style={{ '--tree-depth': depth } as React.CSSProperties}>
          <button type="button" onClick={() => onFileSelect(node.path)} aria-label={`Abrir ${node.name}`} aria-current={active ? 'page' : undefined} title={node.path}>
            {renderFileIcon?.(node.file) ?? <FileCode2 size={14} />}
            <span>{node.name}</span>
          </button>
          {renderFileActions?.(node.file)}
        </div>
      </li>
    );
  });

  return (
    <div className={`workspace-tree ${className}`.trim()}>
      {tree.length > 0
        ? <ul role="tree" aria-label="Estructura del proyecto">{renderNodes(tree)}</ul>
        : <p className="workspace-tree__empty">No hay archivos que coincidan.</p>}
    </div>
  );
};
