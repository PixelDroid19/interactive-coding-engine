import React, { useEffect, useState, useRef } from 'react';
import { STARTER_TEMPLATES } from '../../templates/starterTemplates';
import { WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { moveFocusInHorizontalTabStrip } from '../editor/horizontalTabNavigation';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
import { loadPlaygroundDraft, savePlaygroundDraft } from '../../engine/persistence';
import { TemplateDefinition } from '../../types/runtime';
import { CellsLearningLab } from '../runtime/CellsLearningLab';
import { ThemeToggle } from '../ThemeToggle';
import { LiveHelpWorkspaceBridge } from '../../live-help/LiveHelpWorkspaceBridge';
import type { LiveHelpContext } from '../../live-help/protocol';
import {
  ArrowLeft,
  FolderTree,
  RotateCcw,
  Code2
} from 'lucide-react';

interface PlaygroundViewProps {
  onBack: () => void;
  liveHelpContext?: LiveHelpContext;
}

const CELLS_TEMPLATES: Array<Pick<TemplateDefinition, 'id' | 'name'>> = [
  { id: 'cells-component', name: 'Componente Cells' },
  { id: 'cells-application', name: 'Aplicación Cells' },
];

function isCellsTemplate(id: TemplateDefinition['id']): id is 'cells-component' | 'cells-application' {
  return id === 'cells-component' || id === 'cells-application';
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ onBack, liveHelpContext }) => {
  const [initialDraft] = useState(() => loadPlaygroundDraft());
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateDefinition['id']>(initialDraft?.templateId ?? 'vanilla-js');
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => {
    if (initialDraft) return initialDraft.workspace;
    const tpl = STARTER_TEMPLATES['vanilla-js'];
    return {
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    };
  });
  const [showFileTree, setShowFileTree] = useState(initialDraft?.showFileTree ?? true);
  const [cellsResetKey, setCellsResetKey] = useState(0);
  const previewRef = useRef<PreviewPaneRef | null>(null);

  useEffect(() => {
    savePlaygroundDraft({ templateId: selectedTemplateId, workspace, showFileTree });
  }, [selectedTemplateId, showFileTree, workspace]);

  const handleSelectTemplate = (tplId: TemplateDefinition['id']) => {
    setSelectedTemplateId(tplId);
    if (isCellsTemplate(tplId)) return;
    const tpl = STARTER_TEMPLATES[tplId];
    setWorkspace({
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    });
  };

  const handleReset = () => {
    if (isCellsTemplate(selectedTemplateId)) {
      setCellsResetKey((current) => current + 1);
      return;
    }
    const tpl = STARTER_TEMPLATES[selectedTemplateId];
    setWorkspace({
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    });
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="playground-shell flex w-full flex-col">
      {/* Top Header */}
      <header className="playground-header playground-panel flex h-11 shrink-0 items-center justify-between px-4 bg-[#141416] border-b border-zinc-800/80 z-30">
        <div className="playground-controls flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[11px]">Roadmap</span>
          </button>

          <div className="h-3.5 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 text-xs font-semibold">
              <Code2 className="h-3.5 w-3.5" />
              <span>Playground independiente</span>
            </span>
          </div>
        </div>

        {/* Template Selector & Controls */}
        <div className="playground-actions flex items-center gap-3">
          <div
            className="playground-templates flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-xs"
            role="group"
            aria-label="Plantilla inicial"
            onKeyDown={moveFocusInHorizontalTabStrip}
          >
            {[...Object.values(STARTER_TEMPLATES), ...CELLS_TEMPLATES].map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                aria-pressed={selectedTemplateId === tpl.id}
                data-horizontal-tab
                title={tpl.name}
                className={`playground-scroll-tab px-2.5 py-1 rounded text-xs transition-colors ${
                  selectedTemplateId === tpl.id
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>

          <ThemeToggle compact />
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors"
            aria-label="Reiniciar código"
            title="Restaurar la plantilla inicial"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </header>

      {isCellsTemplate(selectedTemplateId) ? (
        <main className="playground-cells-shell playground-panel min-h-0 flex-1 overflow-auto" aria-label="Proyecto Cells independiente">
          <div className="playground-cells-shell__intro">
            <span>Proyecto Cells independiente</span>
            <p>Trabaja con el scaffold, los comandos, la vista previa, las pruebas y la exportación del runtime Cells del navegador.</p>
          </div>
          <CellsLearningLab
            key={`${selectedTemplateId}:${cellsResetKey}`}
            variant={selectedTemplateId === 'cells-application' ? 'application' : 'component'}
            liveHelpContext={liveHelpContext ? {
              ...liveHelpContext,
              lessonKey: `${liveHelpContext.lessonKey ?? 'playground'}:${selectedTemplateId}`,
            } : undefined}
          />
        </main>
      ) : (
      /* Main 3-Pane Workspace */
      <div className="playground-layout flex min-h-0 flex-1 w-full overflow-hidden">
        {/* File Tree */}
        {showFileTree && (
          <div className="playground-files playground-panel w-48 shrink-0 h-full border-r border-zinc-800/80 bg-[#121214]">
            <FileTree
              files={workspace.files}
              activeFilePath={workspace.activeFilePath}
              onFileSelect={(path) => setWorkspace((prev) => ({ ...prev, activeFilePath: path }))}
              onFileCreate={(file) =>
                setWorkspace((prev) => ({
                  ...prev,
                  files: { ...prev.files, [file.path]: file },
                  activeFilePath: file.path,
                }))
              }
              onFileDelete={(path) =>
                setWorkspace((prev) => {
                  const copy = { ...prev.files };
                  delete copy[path];
                  const remaining = Object.keys(copy);
                  return { ...prev, files: copy, activeFilePath: remaining[0] || '' };
                })
              }
              onFileRename={(oldPath, newPath) =>
                setWorkspace((prev) => {
                  const previousFile = prev.files[oldPath];
                  if (!previousFile || prev.files[newPath]) return prev;
                  const files = { ...prev.files };
                  delete files[oldPath];
                  files[newPath] = {
                    ...previousFile,
                    name: newPath.split('/').at(-1) || newPath,
                    path: newPath,
                  };
                  return {
                    ...prev,
                    files,
                    activeFilePath: prev.activeFilePath === oldPath ? newPath : prev.activeFilePath,
                  };
                })
              }
              readOnly={false}
            />
          </div>
        )}

        {/* Code Editor */}
        <div className="playground-editor playground-panel flex-1 flex flex-col h-full bg-[#18181b] border-r border-zinc-800/80">
          <div
            className="playground-file-tabs flex h-8 min-w-0 items-center gap-1 bg-[#141416] border-b border-zinc-800/80 px-2"
            role="group"
            aria-label="Archivos abiertos"
            onKeyDown={moveFocusInHorizontalTabStrip}
          >
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setShowFileTree(!showFileTree)}
                aria-label={showFileTree ? 'Ocultar archivos' : 'Mostrar archivos'}
                aria-expanded={showFileTree}
                className={`p-1 rounded text-zinc-400 hover:text-zinc-200 ${showFileTree ? 'bg-zinc-800 text-zinc-200' : ''}`}
              >
                <FolderTree className="h-3.5 w-3.5" />
              </button>

              {(Object.values(workspace.files) as WorkspaceFile[]).map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: f.path }))}
                  aria-current={f.path === workspace.activeFilePath ? 'page' : undefined}
                  data-horizontal-tab
                  title={f.name}
                  className={`playground-scroll-tab px-3 py-1 text-xs font-mono transition-colors ${
                    f.path === workspace.activeFilePath
                      ? 'bg-[#18181b] text-zinc-100 font-semibold border-t-2 border-zinc-400'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 w-full bg-[#18181b]">
            <CodeEditor
              file={activeFile}
              workspaceFiles={workspace.files}
              readOnly={false}
              onCodeChange={(newContent) => {
                setWorkspace((prev) => ({
                  ...prev,
                  files: {
                    ...prev.files,
                    [prev.activeFilePath]: {
                      ...prev.files[prev.activeFilePath],
                      content: newContent,
                    },
                  },
                }));
              }}
            />
          </div>
        </div>

        {/* Sandbox Preview */}
        <div className="playground-preview playground-panel w-[45%] shrink-0 h-full flex flex-col">
          <PreviewPane ref={previewRef} workspace={workspace} />
        </div>
      </div>
      )}
      {!isCellsTemplate(selectedTemplateId) && liveHelpContext && <LiveHelpWorkspaceBridge
        context={liveHelpContext}
        workspace={workspace}
        onWorkspaceChange={setWorkspace}
      />}
    </div>
  );
};
