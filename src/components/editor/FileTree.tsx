import React, { useState } from 'react';
import { WorkspaceFile } from '../../types/scrim';
import { InstructorCursor } from '../player/InstructorCursor';
import { FileCode, FileText, FileJson, Plus, FolderPlus, FilePlus, Trash2, Edit2, Check, X, Package, Box } from 'lucide-react';

interface FileTreeProps {
  files: Record<string, WorkspaceFile>;
  activeFilePath: string;
  onFileSelect: (path: string) => void;
  onFileCreate?: (file: WorkspaceFile) => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  readOnly?: boolean;
  dependencies?: string[];
  onAddDependency?: (pkg: string) => void;
  instructorPointer?: { x: number; y: number; clicked?: boolean; targetArea: 'editor' | 'preview' | 'files' | 'global' };
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFilePath,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  readOnly = false,
  dependencies = [],
  onAddDependency,
  instructorPointer,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [isAddingDep, setIsAddingDep] = useState(false);
  const [depName, setDepName] = useState('');
  const [depsList, setDepsList] = useState<string[]>(dependencies);

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return <FileCode className="h-3.5 w-3.5 text-orange-400 shrink-0" />;
    if (filename.endsWith('.css')) return <FileText className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
    if (filename.endsWith('.json')) return <FileJson className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
    return <FileCode className="h-3.5 w-3.5 text-amber-300 shrink-0" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFileName.trim();
    if (!name || files[name]) return;

    let language: 'javascript' | 'html' | 'css' | 'typescript' | 'json' = 'javascript';
    if (name.endsWith('.html')) language = 'html';
    else if (name.endsWith('.css')) language = 'css';
    else if (name.endsWith('.json')) language = 'json';

    onFileCreate?.({
      name,
      path: name,
      language,
      content: '',
    });

    setNewFileName('');
    setIsCreating(false);
  };

  const handleRenameSubmit = (oldPath: string) => {
    const newName = renameValue.trim();
    if (newName && newName !== oldPath && !files[newName]) {
      onFileRename?.(oldPath, newName);
    }
    setRenamingPath(null);
  };

  const handleAddDepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = depName.trim();
    if (!pkg || depsList.includes(pkg)) return;
    setDepsList([...depsList, pkg]);
    onAddDependency?.(pkg);
    setDepName('');
    setIsAddingDep(false);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[#141416] border-r border-zinc-800/80 text-xs font-mono select-none overflow-hidden">
      {/* FILES Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">
        <span>Archivos</span>
        {!readOnly && onFileCreate && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCreating(true)}
              className="rounded p-1 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="New File"
            >
              <FilePlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="rounded p-1 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="New Folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
          <input
            autoFocus
            type="text"
            placeholder="filename.js"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-zinc-950 px-1.5 py-0.5 text-zinc-200 border border-zinc-700 rounded text-xs outline-none focus:border-zinc-500 font-mono"
          />
          <button type="submit" className="text-emerald-400 hover:text-emerald-300">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewFileName('');
            }}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 min-h-[140px]">
        {(Object.values(files) as WorkspaceFile[]).map((file) => {
          const isActive = file.path === activeFilePath;
          const isRenaming = renamingPath === file.path;

          if (isRenaming) {
            return (
              <div key={file.path} className="flex items-center gap-1 px-3 py-1 bg-zinc-900">
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(file.path);
                    if (e.key === 'Escape') setRenamingPath(null);
                  }}
                  className="w-full bg-zinc-950 px-1.5 py-0.5 text-zinc-200 border border-zinc-600 rounded text-xs outline-none font-mono"
                />
                <button onClick={() => handleRenameSubmit(file.path)} className="text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setRenamingPath(null)} className="text-zinc-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={file.path}
              onClick={() => onFileSelect(file.path)}
              className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(file.name)}
                <span className="truncate text-[12px]">{file.name}</span>
              </div>

              {!readOnly && (
                <div className="hidden group-hover:flex items-center gap-1">
                  {onFileRename && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingPath(file.path);
                        setRenameValue(file.name);
                      }}
                      className="p-0.5 text-zinc-400 hover:text-zinc-200"
                      title="Rename"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                  {onFileDelete && Object.keys(files).length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileDelete(file.path);
                      }}
                      className="p-0.5 text-zinc-400 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {depsList.length > 0 && (
      <div className="border-t border-zinc-800/80 bg-[#121214]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">
          <span>Dependencies</span>
          {!readOnly && (
            <button
              onClick={() => setIsAddingDep(true)}
              className="rounded p-1 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Add Dependency"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isAddingDep && (
          <form onSubmit={handleAddDepSubmit} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
            <input
              autoFocus
              type="text"
              placeholder="package@version"
              value={depName}
              onChange={(e) => setDepName(e.target.value)}
              className="w-full bg-zinc-950 px-1.5 py-0.5 text-zinc-200 border border-zinc-700 rounded text-xs outline-none focus:border-zinc-500 font-mono"
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingDep(false);
                setDepName('');
              }}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        <div className="py-1 space-y-0.5 px-1 max-h-36 overflow-y-auto">
          {depsList.map((dep) => (
            <div
              key={dep}
              className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/5 rounded font-mono"
            >
              <Box className="h-3 w-3 text-cyan-400/80 shrink-0" />
              <span className="truncate">{dep}</span>
            </div>
          ))}
        </div>
      </div>
      )}
      {instructorPointer && (
        <InstructorCursor pointer={instructorPointer} containerType="files" />
      )}
    </div>
  );
};
