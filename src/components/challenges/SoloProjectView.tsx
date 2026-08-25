import React, { useEffect, useState, useRef } from 'react';
import { SoloProjectItem } from '../../types/curriculum';
import { type CourseLanguage, WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { cloneWorkspace } from '../../engine/eventLog';
import { loadLanguageWorkspaceDraft, markItemCompleted, saveLanguageWorkspaceDraft } from '../../engine/persistence';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
import { LogicRunnerPanel } from '../preview/LogicRunnerPanel';
import { LanguageSelector } from '../runtime/LanguageSelector';
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
  ChevronLeft,
  LoaderCircle,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NavigationState } from '../../engine/navigation';
import { runChallengeValidation } from '../../engine/testRunner';
import type { ChallengeValidationResult } from '../../types/runtime';

interface SoloProjectViewProps {
  project: SoloProjectItem;
  courseTitle?: string;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  navigationState?: NavigationState;
  language?: CourseLanguage;
  onLanguageChange?: (language: CourseLanguage) => void;
}

export const SoloProjectView: React.FC<SoloProjectViewProps> = ({
  project,
  courseTitle = 'JavaScript Events',
  onBack,
  onBackToRoadmap,
  onPrevious,
  onNext,
  navigationState,
  language = 'javascript',
  onLanguageChange,
}) => {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() =>
    loadLanguageWorkspaceDraft(project.id, language) ?? cloneWorkspace(project.initialWorkspace),
  );
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [validationResult, setValidationResult] = useState<ChallengeValidationResult | null>(null);
  const [showFileTree, setShowFileTree] = useState(true);
  const [compactPane, setCompactPane] = useState<'brief' | 'code' | 'output'>('code');
  const previewRef = useRef<PreviewPaneRef | null>(null);

  useEffect(() => {
    saveLanguageWorkspaceDraft(project.id, language, workspace);
  }, [language, project.id, workspace]);

  const toggleRequirement = (reqId: string) => {
    setCheckedRequirements((prev) => ({
      ...prev,
      [reqId]: !prev[reqId],
    }));
    setIsCompleted(false);
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

  const handleValidateProject = async () => {
    if (!project.tests?.length || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const result = await runChallengeValidation({
        id: project.id,
        title: project.title,
        timestamp: 0,
        instructions: project.brief,
        tests: project.tests,
        hints: [],
      }, workspace, previewRef.current?.getIframeElement());
      setValidationResult(result);
      if (result.allPassed && completedCount === totalCount) {
        setIsCompleted(true);
        markItemCompleted(project.id);
        const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduced) confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setWorkspace(cloneWorkspace(project.initialWorkspace));
    setCheckedRequirements({});
    setIsCompleted(false);
    setValidationResult(null);
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
              <span>Proyecto</span>
            </span>
            <h2 className="hidden max-w-72 truncate text-xs font-semibold text-zinc-100 xl:block">{project.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {project.languageVariants && onLanguageChange && (
            <LanguageSelector value={language} onChange={onLanguageChange} compact />
          )}
          <div className="text-xs font-mono text-zinc-400">
            Requisitos: <span className="text-zinc-200 font-bold">{completedCount}/{totalCount}</span>
          </div>

          {isCompleted && (
            <span className="flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completado</span>
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

      <nav className="grid h-10 shrink-0 grid-cols-3 border-b border-zinc-800 bg-[#111113] p-1 lg:hidden" aria-label="Paneles del proyecto">
        {([
          ['brief', 'Requisitos'],
          ['code', 'Código'],
          ['output', 'Salida'],
        ] as const).map(([pane, label]) => (
          <button
            key={pane}
            type="button"
            className={`rounded px-2 text-xs font-semibold transition-colors ${
              compactPane === pane ? 'bg-yellow-300 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
            aria-pressed={compactPane === pane}
            onClick={() => setCompactPane(pane)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Main 3-Column Split */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Drawer: Project Brief & Requirements Checklist */}
        <div className={`${compactPane === 'brief' ? 'flex' : 'hidden'} h-full w-full shrink-0 flex-col space-y-4 overflow-y-auto border-r border-zinc-800/80 bg-[#141416] p-4 text-xs lg:flex lg:w-80`}>
          {/* Brief */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Objetivo del proyecto</h4>
            <div className="rounded-lg bg-zinc-900/80 p-3 border border-zinc-800 text-zinc-300 leading-relaxed font-sans text-xs whitespace-pre-line">
              {project.brief}
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1">
                <ListTodo className="h-3.5 w-3.5 text-zinc-400" />
                <span>Lista de requisitos</span>
              </h4>
              <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                {Math.round((completedCount / (totalCount || 1)) * 100)}%
              </span>
            </div>

            <div className="space-y-1.5">
              {project.requirements.map((req) => {
                const isChecked = !!checkedRequirements[req.id];

                return (
                  <button
                    type="button"
                    key={req.id}
                    onClick={() => toggleRequirement(req.id)}
                    className={`w-full p-2.5 rounded-lg border cursor-pointer text-left transition-colors ${
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggested Implementation Steps */}
          {project.suggestedSteps && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Etapas sugeridas</h4>
              <ul className="space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                {project.suggestedSteps.map((step, idx) => (
                  <li key={idx} className="bg-zinc-900/60 p-2 rounded border border-zinc-800">{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 space-y-2 mt-auto">
            {validationResult && (
              <div className={`rounded-lg border p-3 ${validationResult.allPassed ? 'border-emerald-700 bg-emerald-950/30' : 'border-rose-800 bg-rose-950/20'}`} aria-live="polite">
                <p className="font-bold text-zinc-100">{validationResult.passedCount} de {validationResult.totalCount} comprobaciones superadas</p>
                <ul className="mt-2 space-y-1.5">
                  {validationResult.tests.map((result) => (
                    <li key={result.id} className={`flex items-start gap-1.5 text-[11px] ${result.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {result.passed ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <XCircle className="mt-0.5 h-3 w-3 shrink-0" />}
                      <span>{result.description}</span>
                    </li>
                  ))}
                </ul>
                {validationResult.allPassed && completedCount < totalCount && (
                  <p className="mt-2 border-t border-amber-900 pt-2 text-[11px] text-amber-200">
                    El código funciona. Falta revisar la lista de requisitos antes de completar el proyecto.
                  </p>
                )}
              </div>
            )}

            {project.tests?.length ? (
              <button
                onClick={handleValidateProject}
                disabled={isEvaluating}
                className="w-full flex items-center justify-center gap-2 rounded bg-yellow-300 hover:bg-yellow-200 py-2 text-zinc-950 font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                aria-label="Comprobar proyecto"
              >
                {isEvaluating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                <span>{isEvaluating ? 'Comprobando…' : 'Comprobar proyecto'}</span>
              </button>
            ) : (
              <button
                onClick={handleSubmitProject}
                className="w-full flex items-center justify-center gap-2 rounded bg-zinc-100 hover:bg-white py-2 text-zinc-900 font-bold text-xs shadow-sm transition-colors"
              >
                <Rocket className="h-3.5 w-3.5 fill-zinc-900" />
                <span>Marcar proyecto como completado</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1 text-zinc-400 hover:text-zinc-200 py-1 text-[11px] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restaurar plantilla inicial</span>
            </button>
          </div>
        </div>

        {/* Center: File Tree & Code Editor */}
        <div className={`${compactPane === 'code' ? 'flex' : 'hidden'} flex-1 overflow-hidden lg:flex`}>
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
                  setValidationResult(null);
                  setIsCompleted(false);
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
        <div className={`${compactPane === 'output' ? 'flex' : 'hidden'} h-full w-full shrink-0 flex-col lg:flex lg:w-[45%]`}>
          {language === 'python' ? (
            <LogicRunnerPanel
              workspace={workspace}
              language="python"
              packages={project.languageVariants?.python.packages}
            />
          ) : (
            <PreviewPane ref={previewRef} workspace={workspace} />
          )}
        </div>
      </div>
    </div>
  );
};
