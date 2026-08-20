import React, { useState, useRef } from 'react';
import { STARTER_TEMPLATES } from '../../templates/starterTemplates';
import { WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
import {
  ArrowLeft,
  FolderTree,
  RotateCcw,
  Sparkles,
  LayoutTemplate,
  Terminal,
  Code2
} from 'lucide-react';

interface PlaygroundViewProps {
  onBack: () => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ onBack }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<'vanilla-js' | 'js-only' | 'lit' | 'react'>('vanilla-js');
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => {
    const tpl = STARTER_TEMPLATES['vanilla-js'];
    return {
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    };
  });
  const [showFileTree, setShowFileTree] = useState(true);
  const previewRef = useRef<PreviewPaneRef | null>(null);

  const handleSelectTemplate = (tplId: 'vanilla-js' | 'js-only' | 'lit' | 'react') => {
    setSelectedTemplateId(tplId);
    const tpl = STARTER_TEMPLATES[tplId];
    setWorkspace({
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    });
  };

  const handleReset = () => {
    const tpl = STARTER_TEMPLATES[selectedTemplateId];
    setWorkspace({
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    });
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f0f11] text-zinc-200 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex h-11 items-center justify-between px-4 bg-[#141416] border-b border-zinc-800/80 z-30">
        <div className="flex items-center gap-3">
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
              <span>Independent Playground</span>
            </span>
          </div>
        </div>

        {/* Template Selector & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-xs">
            {Object.values(STARTER_TEMPLATES).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl.id as any)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  selectedTemplateId === tpl.id
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors"
            title="Reset code to clean template"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Main 3-Pane Workspace */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* File Tree */}
        {showFileTree && (
          <div className="w-48 shrink-0 h-full border-r border-zinc-800/80 bg-[#121214]">
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
              readOnly={false}
            />
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 flex flex-col h-full bg-[#18181b] border-r border-zinc-800/80">
          <div className="flex h-8 items-center justify-between bg-[#141416] border-b border-zinc-800/80 px-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFileTree(!showFileTree)}
                className={`p-1 rounded text-zinc-400 hover:text-zinc-200 ${showFileTree ? 'bg-zinc-800 text-zinc-200' : ''}`}
              >
                <FolderTree className="h-3.5 w-3.5" />
              </button>

              {(Object.values(workspace.files) as WorkspaceFile[]).map((f) => (
                <button
                  key={f.path}
                  onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: f.path }))}
                  className={`px-3 py-1 text-xs font-mono transition-colors ${
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

          <div className="flex-1 w-full h-full bg-[#18181b]">
            <CodeEditor
              file={activeFile}
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
        <div className="w-[45%] shrink-0 h-full flex flex-col">
          <PreviewPane ref={previewRef} workspace={workspace} />
        </div>
      </div>
    </div>
  );
};
