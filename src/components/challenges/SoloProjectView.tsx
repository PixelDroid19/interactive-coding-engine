import React, { useEffect, useState, useRef } from 'react';
import { SoloProjectItem } from '../../types/curriculum';
import { type CourseLanguage, WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { cloneWorkspace } from '../../engine/eventLog';
import { loadLanguageWorkspaceDraft, markItemCompleted, saveLanguageWorkspaceDraft } from '../../engine/persistence';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { LogicRunnerPanel } from '../preview/LogicRunnerPanel';
import { LanguageSelector } from '../runtime/LanguageSelector';
import {
  ArrowLeft,
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
import { PostSolveStudio } from '../learning/PostSolveStudio';
import { recordPostSolveEvidence } from '../../learning/curriculumEvidence';

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
  const [postSolveComplete, setPostSolveComplete] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [validationResult, setValidationResult] = useState<ChallengeValidationResult | null>(null);
  const [showFileTree, setShowFileTree] = useState(
    () => Object.keys(project.initialWorkspace.files).length > 1,
  );
  const [compactPane, setCompactPane] = useState<'brief' | 'code' | 'output'>('code');

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
  const progressPercent = Math.round((completedCount / (totalCount || 1)) * 100);

  const handleSubmitProject = () => {
    setIsCompleted(true);
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
      }, workspace);
      setValidationResult(result);
      if (result.allPassed && completedCount === totalCount) {
        setIsCompleted(true);
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
    setPostSolveComplete(false);
    setValidationResult(null);
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f0f11] text-zinc-200 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 px-3 bg-[#141416] border-b border-zinc-800/80 z-30">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            onClick={onBackToRoadmap || onBack}
            className="flex items-center gap-1.5 rounded bg-zinc-800/80 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 font-medium transition-colors"
            aria-label="Volver al roadmap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[11px]">Roadmap</span>
          </button>
          {onPrevious && (
            <button
              onClick={onPrevious}
              disabled={navigationState ? !navigationState.hasPrevious : false}
              className="flex items-center gap-1 rounded bg-zinc-800/80 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-300 disabled:opacity-40"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-[11px] hidden md:inline">Anterior</span>
            </button>
          )}

          <div className="hidden h-3.5 w-px bg-zinc-800 sm:block" />

          <span className="hidden sm:flex items-center gap-1 rounded bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 px-2 py-0.5 text-[11px] font-semibold">
            <Rocket className="h-3 w-3" />
            <span>Proyecto</span>
          </span>
          <h2 className="min-w-0 truncate text-xs font-semibold text-zinc-100">{project.title}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {project.languageVariants && onLanguageChange && (
            <LanguageSelector value={language} onChange={onLanguageChange} compact />
          )}

          {postSolveComplete && (
            <span className="flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completado</span>
            </span>
          )}

          {onNext && postSolveComplete && (
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
                className="flex items-center gap-1 rounded bg-zinc-800/80 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors"
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
          ['brief', 'Proyecto'],
          ['code', 'Código'],
          ['output', 'Consola'],
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

      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        {/* Left panel: brief, checklist and steps with a sticky action footer */}
        <aside
          className={`${compactPane === 'brief' ? 'flex' : 'hidden'} h-full w-full shrink-0 flex-col overflow-hidden border-r border-zinc-800/80 bg-[#141416] lg:flex lg:w-[350px]`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <section className="space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Objetivo</h4>
              <p className="text-[13px] leading-relaxed text-zinc-300 whitespace-pre-line">{project.brief}</p>
            </section>

            <section className="mt-7 space-y-3">
              <div className="flex items-baseline justify-between">
                <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  <ListTodo className="h-3.5 w-3.5" />
                  <span>Requisitos</span>
                </h4>
                <span className="text-[11px] font-semibold tabular-nums text-zinc-400">
                  {completedCount}/{totalCount}
                </span>
              </div>

              <div className="h-1 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de requisitos">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${progressPercent === 100 ? 'bg-emerald-400' : 'bg-yellow-300'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <ul className="divide-y divide-zinc-800/70">
                {project.requirements.map((req) => {
                  const isChecked = !!checkedRequirements[req.id];
                  return (
                    <li key={req.id}>
                      <button
                        type="button"
                        onClick={() => toggleRequirement(req.id)}
                        className="group flex w-full items-start gap-2.5 py-2.5 text-left transition-colors"
                        aria-pressed={isChecked}
                      >
                        {isChecked ? (
                          <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Square className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
                        )}
                        <span className="min-w-0">
                          <span className={`block text-[13px] font-medium leading-snug ${isChecked ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                            {req.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{req.description}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {project.suggestedSteps && project.suggestedSteps.length > 0 && (
              <section className="mt-7 space-y-2.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Etapas sugeridas</h4>
                <ol className="space-y-2">
                  {project.suggestedSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-400">
                      <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-semibold tabular-nums text-zinc-500">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Sticky action footer */}
          <div className="shrink-0 space-y-2.5 border-t border-zinc-800/80 bg-[#141416] px-5 py-4">
            {validationResult && (
              <div
                className={`rounded-lg border p-3 ${validationResult.allPassed ? 'border-emerald-800/70 bg-emerald-950/25' : 'border-rose-900/70 bg-rose-950/15'}`}
                aria-live="polite"
              >
                <p className="text-xs font-bold text-zinc-100">
                  {validationResult.passedCount} de {validationResult.totalCount} comprobaciones superadas
                </p>
                <ul className="mt-2 space-y-1">
                  {validationResult.tests.map((result) => (
                    <li key={result.id} className={`flex items-start gap-1.5 text-[11px] leading-snug ${result.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {result.passed ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <XCircle className="mt-0.5 h-3 w-3 shrink-0" />}
                      <span>{result.description}</span>
                    </li>
                  ))}
                </ul>
                {validationResult.allPassed && completedCount < totalCount && (
                  <p className="mt-2 border-t border-zinc-800 pt-2 text-[11px] text-amber-300">
                    El código funciona. Falta revisar la lista de requisitos antes de completar el proyecto.
                  </p>
                )}
              </div>
            )}

            {isCompleted && !postSolveComplete && (
              <PostSolveStudio
                itemId={project.id}
                title={project.title}
                instructions={project.brief}
                kind="project"
                continueLabel="Registrar dominio del proyecto"
                onComplete={async (readingAnswer, variationAnswer) => {
                  await recordPostSolveEvidence(project.id, readingAnswer, variationAnswer);
                  markItemCompleted(project.id);
                  setPostSolveComplete(true);
                }}
              />
            )}

            {project.tests?.length ? (
              <button
                onClick={handleValidateProject}
                disabled={isEvaluating}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-yellow-300 py-2 text-xs font-bold text-zinc-950 shadow-sm transition-colors hover:bg-yellow-200 disabled:opacity-50"
                aria-label="Comprobar proyecto"
              >
                {isEvaluating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                <span>{isEvaluating ? 'Comprobando…' : 'Comprobar proyecto'}</span>
              </button>
            ) : (
              <button
                onClick={handleSubmitProject}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 py-2 text-xs font-bold text-zinc-900 shadow-sm transition-colors hover:bg-white"
              >
                <Rocket className="h-3.5 w-3.5 fill-zinc-900" />
                <span>Marcar proyecto como completado</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-1.5 py-0.5 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restaurar plantilla inicial</span>
            </button>
          </div>
        </aside>

        {/* Center: editor */}
        <div className={`${compactPane === 'code' ? 'flex' : 'hidden'} min-w-0 flex-1 overflow-hidden lg:flex`}>
          {showFileTree && (
            <div className="h-full w-48 shrink-0 border-r border-zinc-800/80 bg-[#121214]">
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

          <div className="flex h-full min-w-0 flex-1 flex-col bg-[#18181b]">
            <div className="flex h-9 shrink-0 items-center gap-1 border-b border-zinc-800/80 bg-[#141416] px-2">
              <button
                onClick={() => setShowFileTree(!showFileTree)}
                title={showFileTree ? 'Ocultar archivos' : 'Mostrar archivos'}
                aria-label={showFileTree ? 'Ocultar archivos' : 'Mostrar archivos'}
                className={`rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 ${showFileTree ? 'bg-zinc-800 text-zinc-200' : ''}`}
              >
                <FolderTree className="h-3.5 w-3.5" />
              </button>

              {(Object.values(workspace.files) as WorkspaceFile[]).map((f) => (
                <button
                  key={f.path}
                  onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: f.path }))}
                  className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                    f.path === workspace.activeFilePath
                      ? 'rounded bg-[#18181b] font-semibold text-zinc-100'
                      : 'rounded text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div className="h-full min-h-0 w-full flex-1 bg-[#18181b]">
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

        {/* Right: execution console (these projects validate logic, not visuals) */}
        <div
          className={`${compactPane === 'output' ? 'flex' : 'hidden'} h-full w-full shrink-0 flex-col overflow-hidden border-l border-zinc-800/80 lg:flex lg:w-[380px] xl:w-[420px]`}
        >
          <LogicRunnerPanel
            workspace={workspace}
            language={language}
            packages={language === 'python' ? project.languageVariants?.python.packages : undefined}
          />
        </div>
      </div>
    </div>
  );
};
