import React, { useCallback, useRef, useState } from 'react';
import { WorkspaceFile } from '../../types/scrim';
import { InstructorCursor } from '../player/InstructorCursor';
import { Plus, FilePlus, Trash2, Edit2, Check, X, Box } from 'lucide-react';

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
}) => {
  const fileStackRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [isAddingDep, setIsAddingDep] = useState(false);
  const [depName, setDepName] = useState('');
  const [depsList, setDepsList] = useState<string[]>(dependencies);

  const getFileBadge = (filename: string) => {
    if (filename.endsWith('.html')) return <span className="badge-html">5</span>;
    if (filename.endsWith('.css')) return <span className="badge-css">3</span>;
    if (filename.endsWith('.json')) return <span className="badge-js">{'{}'}</span>;
    return <span className="badge-js">JS</span>;
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

  const mapFilesPointer = useCallback((x: number, y: number) => {
    const root = fileStackRef.current;
    if (!root) return { x, y };
    const rows = root.querySelectorAll<HTMLElement>('[data-file-row]');
    if (rows.length === 0) return { x, y };
    const height = root.offsetHeight || 1;
    const centers: number[] = [];
    rows.forEach((row) => {
      centers.push(((row.offsetTop + row.offsetHeight / 2) / height) * 100);
    });
    const t = (y - 16) / 8;
    const last = centers.length - 1;
    let mappedY: number;
    if (t <= 0) mappedY = centers[0];
    else if (t >= last) mappedY = centers[last];
    else {
      const i0 = Math.floor(t);
      const local = t - i0;
      const smooth = local * local * (3 - 2 * local);
      mappedY = centers[i0] + (centers[i0 + 1] - centers[i0]) * smooth;
    }
    return {
      x: Math.min(86, Math.max(22, x)),
      y: mappedY,
    };
  }, []);

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
    <div className="files-tree-panel relative h-full w-full overflow-hidden">
      <div className="tree-header">
        <span className="tree-title">Archivos</span>
        {!readOnly && onFileCreate && (
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setIsCreating(true)} className="round-icon-btn" aria-label="Nuevo archivo" title="Nuevo archivo" style={{ width: 28, height: 28 }}>
              <FilePlus size={13} />
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
            aria-label="Nombre del archivo"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-zinc-950 px-1.5 py-0.5 text-zinc-200 border border-zinc-700 rounded text-xs outline-none focus:border-zinc-500 font-mono"
          />
          <button type="submit" className="text-emerald-400 hover:text-emerald-300" aria-label="Crear archivo">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewFileName('');
            }}
            className="text-zinc-400 hover:text-zinc-200"
            aria-label="Cancelar creación"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {/* Files List */}
      <div className="files-list relative flex-1 overflow-y-auto min-h-[140px]">
        <div ref={fileStackRef} className="relative">
        {(Object.values(files) as WorkspaceFile[])
          .slice()
          .sort((a, b) => {
            const rank = (name: string) =>
              name.endsWith('.html') ? 0 : name.endsWith('.css') ? 1 : name.endsWith('.js') || name.endsWith('.ts') ? 2 : 3;
            return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
          })
          .map((file) => {
          const isActive = file.path === activeFilePath;
          const isRenaming = renamingPath === file.path;

          if (isRenaming) {
            return (
              <div key={file.path} data-file-row className="flex items-center gap-1 px-3 py-1 bg-zinc-900">
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  aria-label={`Nuevo nombre para ${file.name}`}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(file.path);
                    if (e.key === 'Escape') setRenamingPath(null);
                  }}
                  className="w-full bg-zinc-950 px-1.5 py-0.5 text-zinc-200 border border-zinc-600 rounded text-xs outline-none font-mono"
                />
                <button onClick={() => handleRenameSubmit(file.path)} className="text-emerald-400" aria-label="Guardar nombre">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setRenamingPath(null)} className="text-zinc-400" aria-label="Cancelar cambio de nombre">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={file.path}
              data-file-row
              className={`file-item-btn group w-full ${isActive ? 'file-item-btn-active' : ''}`}
            >
              <button
                type="button"
                onClick={() => onFileSelect(file.path)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-label={`Abrir ${file.name}`}
                aria-current={isActive ? 'true' : undefined}
              >
                {getFileBadge(file.name)}
                <span>{file.name}</span>
              </button>

              {!readOnly && (
                <div className="hidden items-center gap-1 group-hover:flex group-focus-within:flex">
                  {onFileRename && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingPath(file.path);
                        setRenameValue(file.name);
                      }}
                      className="p-0.5 text-zinc-400 hover:text-zinc-200"
                      aria-label={`Renombrar ${file.name}`}
                      title={`Renombrar ${file.name}`}
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
                      aria-label={`Eliminar ${file.name}`}
                      title={`Eliminar ${file.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <InstructorCursor containerType="files" mapPosition={mapFilesPointer} />
        </div>
      </div>

      {depsList.length > 0 && (
      <div className="border-t border-zinc-800/80 bg-[#121214]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">
          <span>Dependencias</span>
          {!readOnly && (
            <button
              onClick={() => setIsAddingDep(true)}
              className="rounded p-1 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label="Añadir dependencia"
              title="Añadir dependencia"
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
              aria-label="Nombre de la dependencia"
              value={depName}
              onChange={(e) => setDepName(e.target.value)}
              className="w-full bg-zinc-950 px-1.5 py-0.5 text-zinc-200 border border-zinc-700 rounded text-xs outline-none focus:border-zinc-500 font-mono"
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300" aria-label="Confirmar dependencia">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingDep(false);
                setDepName('');
              }}
              className="text-zinc-400 hover:text-zinc-200"
              aria-label="Cancelar dependencia"
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
    </div>
  );
};
