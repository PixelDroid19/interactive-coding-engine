import React, { useState, useRef } from 'react';
import { SoloProjectItem } from '../../types/curriculum';
import { WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { cloneWorkspace } from '../../engine/eventLog';
import { markItemCompleted } from '../../engine/persistence';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Rocket,
  FolderTree,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NavigationState } from '../../engine/navigation';

interface SoloProjectViewProps {
  project: SoloProjectItem;
  courseTitle?: string;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  navigationState?: NavigationState;
}

export const SoloProjectView: React.FC<SoloProjectViewProps> = ({
  project,
  courseTitle = 'JavaScript Events',
  onBack,
  onBackToRoadmap,
  onPrevious,
  onNext,
  navigationState,
}) => {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => cloneWorkspace(project.initialWorkspace));
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const previewRef = useRef<PreviewPaneRef | null>(null);

  const toggleRequirement = (reqId: string) => {
    setCheckedRequirements((prev) => ({
      ...prev,
      [reqId]: !prev[reqId],
    }));
  };

  const completedCount = Object.values(checkedRequirements).filter(Boolean).length;
  const totalCount = project.requirements.length;

  const handleSubmitProject = () => {
    setIsCompleted(true);
    markItemCompleted(project.id);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  const handleReset = () => {
    setWorkspace(cloneWorkspace(project.initialWorkspace));
    setCheckedRequirements({});
    setIsCompleted(false);
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f0f11] text-zinc-200 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex h-11 items-center justify-between px-4 bg-[#141416] border-b border-zinc-800/80 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRoadmap || onBack}
            className="flex items-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 font-medium transition-colors"
            aria-label="Volver al roadmap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[11px]">Roadmap</span>
          </button>
          {onPrevious && (
            <button
              onClick={onPrevious}
              disabled={navigationState ? !navigationState.hasPrevious : false}
              className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-300 disabled:opacity-40"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-[11px] hidden sm:inline">Anterior</span>
            </button>
          )}

          <div className="h-3.5 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 px-2 py-0.5 text-xs font-semibold">
              <Rocket className="h-3.5 w-3.5" />
              <span>Solo Project</span>
            </span>
            <h2 className="text-xs font-semibold text-zinc-100 truncate">{project.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-zinc-400">
            Requirements: <span className="text-zinc-200 font-bold">{completedCount}/{totalCount}</span>
          </div>

          {isCompleted && (
            <span className="flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed</span>
            </span>
          )}

          {onNext && (
            navigationState?.isLast ? (
              <button
                onClick={onBackToRoadmap || onBack}
                className="flex items-center gap-1 rounded bg-emerald-800 hover:bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white"
                aria-label="Finalizar"
              >
                <span>Finalizar</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={onNext}
                className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors"
                aria-label="Siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>
      </header>

      {/* Main 3-Column Split */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Drawer: Project Brief & Requirements Checklist */}
        <div className="w-80 shrink-0 h-full bg-[#141416] border-r border-zinc-800/80 flex flex-col overflow-y-auto p-4 space-y-4 text-xs">
          {/* Brief */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Project Brief</h4>
            <div className="rounded-lg bg-zinc-900/80 p-3 border border-zinc-800 text-zinc-300 leading-relaxed font-sans text-xs whitespace-pre-line">
              {project.brief}
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1">
                <ListTodo className="h-3.5 w-3.5 text-zinc-400" />
                <span>Requirements Checklist</span>
              </h4>
              <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                {Math.round((completedCount / (totalCount || 1)) * 100)}%
              </span>
            </div>

            <div className="space-y-1.5">
              {project.requirements.map((req) => {
                const isChecked = !!checkedRequirements[req.id];

                return (
                  <div
                    key={req.id}
                    onClick={() => toggleRequirement(req.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-100'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className={`font-semibold ${isChecked ? 'line-through text-zinc-400' : 'text-zinc-200'}`}>
                          {req.title}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{req.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Implementation Steps */}
          {project.suggestedSteps && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Suggested Milestones</h4>
              <ul className="space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                {project.suggestedSteps.map((step, idx) => (
                  <li key={idx} className="bg-zinc-900/60 p-2 rounded border border-zinc-800">{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 space-y-2 mt-auto">
            <button
              onClick={handleSubmitProject}
              className="w-full flex items-center justify-center gap-2 rounded bg-zinc-100 hover:bg-white py-2 text-zinc-900 font-bold text-xs shadow-sm transition-colors"
            >
              <Rocket className="h-3.5 w-3.5 fill-zinc-900" />
              <span>Submit & Mark Complete</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1 text-zinc-400 hover:text-zinc-200 py-1 text-[11px] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset starter template</span>
            </button>
          </div>
        </div>

        {/* Center: File Tree & Code Editor */}
        <div className="flex-1 flex overflow-hidden">
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

          <div className="flex-1 flex flex-col h-full bg-[#18181b] border-r border-zinc-800/80">
            {/* Tabs */}
            <div className="flex h-8 items-center gap-1 bg-[#141416] border-b border-zinc-800/80 px-2">
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

            <div className="flex-1 w-full h-full bg-[#18181b]">
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
        </div>

        {/* Right: Live Preview & Runtime Console */}
        <div className="w-[45%] shrink-0 h-full flex flex-col">
          <PreviewPane ref={previewRef} workspace={workspace} />
        </div>
      </div>
    </div>
  );
};
