import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FolderTree,
  Lightbulb,
  Play,
  RotateCcw,
  XCircle,
  Eye,
  BookOpen,
  Undo2,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DebuggingExerciseItem } from '../../types/curriculum';
import { type CourseLanguage, ChallengeTest, WorkspaceFile, WorkspaceSnapshot } from '../../types/scrim';
import { ChallengeValidationResult } from '../../types/runtime';
import { cloneWorkspace } from '../../engine/eventLog';
import { createDebuggingDraftVersion, loadDebuggingDraft, markItemCompleted, markChallengeSkipped, markChallengeSolutionViewed, saveDebuggingDraft } from '../../engine/persistence';
import { runChallengeValidation } from '../../engine/testRunner';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
import { LogicRunnerPanel, LogicRunnerPanelRef } from '../preview/LogicRunnerPanel';
import { NavigationState } from '../../engine/navigation';
import { LanguageSelector } from '../runtime/LanguageSelector';
import { ThemeToggle } from '../ThemeToggle';
import { PostSolveStudio } from '../learning/PostSolveStudio';
import { recordPostSolveEvidence } from '../../learning/curriculumEvidence';

interface DebuggingViewProps {
  exercise: DebuggingExerciseItem;
  courseTitle?: string;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  navigationState?: NavigationState;
  language?: CourseLanguage;
  onLanguageChange?: (language: CourseLanguage) => void;
  onCompleted?: () => void;
}

function inferValidator(test: ChallengeTest): ChallengeTest['validatorType'] {
  if (test.validatorType) return test.validatorType;
  if (test.targetFunction) return 'function-call';
  if (test.domSelector) return 'dom-check';
  return 'source-regex';
}

function isLogicFile(file: WorkspaceFile): boolean {
  return file.language === 'javascript' || file.language === 'typescript' || file.language === 'json' || file.language === 'python';
}

function normalizeWorkspace(exercise: DebuggingExerciseItem, source: WorkspaceSnapshot): WorkspaceSnapshot {
  const next = cloneWorkspace(source);
  if (exercise.executionMode !== 'logic') return next;

  const firstLogicFile = Object.values(next.files).find(isLogicFile);
  if (firstLogicFile && !isLogicFile(next.files[next.activeFilePath])) {
    next.activeFilePath = firstLogicFile.path;
  }
  return next;
}

function hasMeaningfulDraft(exercise: DebuggingExerciseItem, draft: ReturnType<typeof loadDebuggingDraft>): boolean {
  if (!draft || draft.revealedHints > 0) return Boolean(draft?.revealedHints);
  const starter = exercise.initialWorkspace;
  const draftPaths = Object.keys(draft.workspace.files).sort();
  const starterPaths = Object.keys(starter.files).sort();
  if (draftPaths.join('\n') !== starterPaths.join('\n')) return true;
  return draftPaths.some((path) => draft.workspace.files[path].content !== starter.files[path].content);
}

export const DebuggingView: React.FC<DebuggingViewProps> = ({
  exercise,
  onBack,
  onBackToRoadmap,
  onPrevious,
  onNext,
  navigationState,
  language = 'javascript',
  onLanguageChange,
  onCompleted,
}) => {
  const draftKey = exercise.languageVariants ? `${exercise.id}:${language}` : exercise.id;
  const exerciseVersion = createDebuggingDraftVersion(exercise.initialWorkspace, exercise.tests);
  const [initialDraft] = useState(() => loadDebuggingDraft(draftKey, exerciseVersion));
  const [showDraftChoice, setShowDraftChoice] = useState(() => hasMeaningfulDraft(exercise, initialDraft));
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() =>
    normalizeWorkspace(exercise, initialDraft?.workspace ?? exercise.initialWorkspace),
  );
  const [validationResult, setValidationResult] = useState<ChallengeValidationResult | null>(null);
  const [revealedHints, setRevealedHints] = useState(initialDraft?.revealedHints ?? 0);
  const [showFileTree, setShowFileTree] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [activeTab, setActiveTab] = useState<'reto' | 'resultado' | 'preview'>('reto');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [postSolveComplete, setPostSolveComplete] = useState(false);
  const previewRef = useRef<PreviewPaneRef | null>(null);
  const logicRunnerRef = useRef<LogicRunnerPanelRef | null>(null);
  const resultSummaryRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    saveDebuggingDraft(draftKey, { workspace, revealedHints, exerciseVersion });
  }, [draftKey, exerciseVersion, revealedHints, workspace]);

  const handleValidate = async () => {
    if (isEvaluating) return 'Ya hay una comprobación en curso.';
    setIsEvaluating(true);
    const currentGen = ++generationRef.current;
    try {
      if (exercise.executionMode === 'logic' && language !== 'python') {
        await logicRunnerRef.current?.run();
      } else if (previewRef.current) {
        // Las prácticas DOM necesitan una vista recién ejecutada antes de evaluar.
        const maybePromise = (previewRef.current as any).reloadPreview?.();
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
          const currentIframe = previewRef.current?.getIframeElement();
          if (currentIframe) (currentIframe as HTMLIFrameElement & { __generation?: number }).__generation = currentGen;
        } else {
          // Fallback: small delay if reloadPreview doesn't return promise
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Ensure we are still on the same generation (no newer edit in between)
      if (generationRef.current !== currentGen) {
        return 'El código cambió durante la comprobación; vuelve a ejecutarla.';
      }

      const iframe = exercise.executionMode === 'browser' ? previewRef.current?.getIframeElement() : null;
      const tests = exercise.tests.map((test) => ({
        ...test,
        validatorType: inferValidator(test),
      }));

      // Check generation on iframe if available
      const iframeGen = iframe ? (iframe as any).__generation : undefined;
      if (iframe && iframeGen !== undefined && iframeGen !== currentGen) {
        // Preview belongs to previous workspace, treat as evaluation error
        setValidationResult({
          allPassed: false,
          passedCount: 0,
          totalCount: tests.length,
          tests: tests.map((t) => ({
            id: t.id,
            description: t.description,
            passed: false,
            status: 'evaluation-error' as const,
            isEvaluationError: true,
            errorMessage: 'Vista previa no lista. Vuelve a pulsar Comprobar.',
          })),
          feedbackMessage: 'No pudimos evaluar el código. La vista previa no estaba lista.',
        });
        setActiveTab('resultado');
        setTimeout(() => resultSummaryRef.current?.focus(), 50);
        return `0 de ${tests.length} comprobaciones superadas. La vista previa no estaba lista.`;
      }

      const result = await runChallengeValidation(
        {
          id: exercise.id,
          title: exercise.title,
          timestamp: 0,
          instructions: exercise.description || '',
          tests,
          hints: exercise.hints.map((hint) => ({
            level: hint.level,
            title: `Pista ${hint.level}`,
            text: hint.text,
          })),
        },
        workspace,
        iframe,
        currentGen
      );

      // Only apply if still current generation
      if (generationRef.current !== currentGen) return 'El código cambió durante la comprobación; el resultado se descartó.';

      setValidationResult(result);
      setActiveTab('resultado');
      // Move focus to result summary for accessibility
      setTimeout(() => resultSummaryRef.current?.focus(), 50);

      if (result.allPassed) {
        const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduced) confetti({ particleCount: 90, spread: 68, origin: { y: 0.62 } });
      }
      return `${result.passedCount} de ${result.totalCount} comprobaciones superadas. ${result.feedbackMessage}`;
    } finally {
      if (generationRef.current === currentGen) {
        setIsEvaluating(false);
      }
    }
  };

  const handleReset = () => {
    setWorkspace(normalizeWorkspace(exercise, exercise.initialWorkspace));
    setValidationResult(null);
    setShowResolution(false);
    setActiveTab('reto');
    setPostSolveComplete(false);
  };

  const handleStartFromScratch = () => {
    setWorkspace(normalizeWorkspace(exercise, exercise.initialWorkspace));
    setRevealedHints(0);
    setValidationResult(null);
    setShowResolution(false);
    setActiveTab('reto');
    setShowDraftChoice(false);
    setPostSolveComplete(false);
  };

  const handleSkipForNow = () => {
    markChallengeSkipped(exercise.id);
    handleRoadmap();
  };

  const handleViewSolution = () => {
    setShowResolution(true);
    markChallengeSolutionViewed(exercise.id);
  };

  const handleReturnToAttempt = () => {
    setShowResolution(false);
    setActiveTab('reto');
  };

  const handleExecutePreview = async () => {
    setActiveTab('preview');
    const gen = ++generationRef.current;
    if (exercise.executionMode === 'logic') {
      await logicRunnerRef.current?.run();
    } else if (previewRef.current) {
      const maybePromise = (previewRef.current as any).reloadPreview?.();
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
        // Tag generation
        const iframe = previewRef.current?.getIframeElement();
        if (iframe) (iframe as any).__generation = gen;
      }
    }
  };

  const visibleFiles = (Object.values(workspace.files) as WorkspaceFile[]).filter((file) =>
    exercise.executionMode === 'logic' ? isLogicFile(file) : true,
  );
  const visibleFileMap = Object.fromEntries(visibleFiles.map((file) => [file.path, file]));
  const activeFile = visibleFileMap[workspace.activeFilePath] || visibleFiles[0] || null;
  const testsFunctionDirectly = exercise.tests.some((test) => test.validatorType === 'function-call');

  const handleRoadmap = () => {
    if (onBackToRoadmap) onBackToRoadmap();
    else onBack();
  };
  const handlePrev = () => {
    if (onPrevious) onPrevious();
  };
  const handleNext = () => {
    if (onNext) onNext();
    else handleRoadmap();
  };

  const onTabKeyDown = (e: React.KeyboardEvent, current: 'reto'|'resultado'|'preview') => {
    const tabs: Array<'reto'|'resultado'|'preview'> = ['reto', 'resultado', 'preview'];
    const idx = tabs.indexOf(current);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      setActiveTab(next);
      document.getElementById(`tab-${next}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      setActiveTab(prev);
      document.getElementById(`tab-${prev}`)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab('reto');
      document.getElementById('tab-reto')?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab('preview');
      document.getElementById('tab-preview')?.focus();
    }
  };

  return (
    <div className="app-screen">
      {showDraftChoice && (
        <div className="fixed inset-0 z-[140] grid place-items-center bg-black/70 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="debug-draft-title"
            className="w-full max-w-md border-2 border-zinc-600 bg-zinc-950 p-6 text-zinc-100 shadow-[8px_8px_0_#000]"
          >
            <h2 id="debug-draft-title" className="text-xl font-bold">¿Continuar donde lo dejaste?</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Puedes continuar desde tu último intento o comenzar esta práctica desde cero.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" autoFocus onClick={() => setShowDraftChoice(false)} className="neu-pill-btn justify-center">
                Continuar donde lo dejé
              </button>
              <button type="button" onClick={handleStartFromScratch} className="neu-pill-btn justify-center">
                Comenzar desde cero
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="studio-card" inert={showDraftChoice ? true : undefined} aria-hidden={showDraftChoice || undefined}>
        <header className="window-topbar">
          <div className="window-titlebar-left min-w-0">
            <button type="button" onClick={handleRoadmap} className="neu-pill-btn shrink-0" aria-label="Volver al roadmap">
              <ArrowLeft size={15} />
              <span>Roadmap</span>
            </button>
            {onPrevious && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={navigationState ? !navigationState.hasPrevious : false}
                className="neu-pill-btn shrink-0 disabled:opacity-40"
                aria-label="Anterior"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}
            <div className="topbar-divider hidden sm:block" />
            <span className="category-tag">
              <Bug size={12} style={{ display: 'inline', marginRight: 4 }} />
              Depura
            </span>
            <span className="topbar-lesson-title truncate">{exercise.title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle compact />
            {exercise.languageVariants && onLanguageChange && (
              <LanguageSelector value={language} onChange={onLanguageChange} compact />
            )}
            {validationResult?.allPassed && (
              <span className="category-tag" style={{ background: 'var(--color-highlighter-mint)' }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                Resuelto
              </span>
            )}
            {onNext && postSolveComplete && (
              navigationState?.isLast ? (
                <button type="button" onClick={handleRoadmap} className="neu-pill-btn bg-emerald-100" aria-label="Finalizar">
                  <span>Finalizar</span>
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button type="button" onClick={handleNext} className="btn-next-lesson neu-pill-btn" aria-label="Siguiente">
                  <span>Siguiente</span>
                  <ChevronRight size={15} />
                </button>
              )
            )}
          </div>
        </header>

        <div className="debug-new-layout">
          {/* Editor area - dominant */}
          <div className="debug-editor-area">
            <div className="editor-window-wrapper" style={{ height: '100%' }}>
              <div className="editor-tabs-bar">
                <div className="editor-tabs-group">
                  <button
                    type="button"
                    onClick={() => setShowFileTree((open) => !open)}
                    className="editor-action-btn"
                    aria-label={showFileTree ? 'Ocultar explorador' : 'Mostrar explorador'}
                    aria-expanded={showFileTree}
                    title="Archivos"
                  >
                    <FolderTree className="h-3 w-3" />
                    <span className="hidden sm:inline ml-1">Archivos</span>
                  </button>
                  {visibleFiles.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: file.path }))}
                      className={`tab-btn ${file.path === workspace.activeFilePath ? 'tab-btn-active' : ''}`}
                      aria-selected={file.path === workspace.activeFilePath}
                      role="tab"
                    >
                      <span>{file.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleExecutePreview}
                    className="editor-action-btn debug-run-tab-button"
                    aria-label={exercise.executionMode === 'logic' ? 'Abrir salida y ejecutar' : 'Ejecutar vista previa'}
                    title={exercise.executionMode === 'logic' ? 'Ver salida' : 'Ver vista previa'}
                  >
                    {exercise.executionMode === 'logic' ? <Play className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{exercise.executionMode === 'logic' ? 'Salida' : 'Vista previa'}</span>
                  </button>
                </div>
              </div>
              <div className="editor-body relative min-h-0 overflow-hidden" style={{ flex: 1 }}>
                <CodeEditor
                  file={activeFile}
                  workspaceFiles={workspace.files}
                  readOnly={false}
                  lessonId={exercise.relatedLessonId}
                  onCodeChange={(content) => {
                    generationRef.current++;
                    // The previous result belongs to the previous source revision.
                    setValidationResult(null);
                    setWorkspace((prev) => ({
                      ...prev,
                      files: {
                        ...prev.files,
                        [prev.activeFilePath]: {
                          ...prev.files[prev.activeFilePath],
                          content,
                        },
                      },
                    }));
                  }}
                  onWorkspaceFileChange={(path, content) => {
                    generationRef.current++;
                    setValidationResult(null);
                    setWorkspace((prev) => prev.files[path] ? ({
                      ...prev,
                      files: { ...prev.files, [path]: { ...prev.files[path], content } },
                    }) : prev);
                  }}
                  onTutorRunChecks={async () => {
                    return await handleValidate();
                  }}
                  tutorRecentResult={validationResult ? `${validationResult.passedCount} de ${validationResult.totalCount} comprobaciones superadas. ${validationResult.feedbackMessage}` : undefined}
                />
                {/* File tree popover */}
                {showFileTree && (
                  <div className="debug-file-popover" role="dialog" aria-label="Explorador de archivos">
                    <div className="debug-file-popover-header">
                      <span className="font-bold text-xs">Archivos</span>
                      <button onClick={() => setShowFileTree(false)} className="p-1" aria-label="Cerrar explorador">
                        <XCircle size={14} />
                      </button>
                    </div>
                    <FileTree
                      files={visibleFileMap}
                      activeFilePath={workspace.activeFilePath}
                      onFileSelect={(path) => {
                        setWorkspace((prev) => ({ ...prev, activeFilePath: path }));
                        setShowFileTree(false);
                      }}
                      readOnly={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contextual panel - single visible at a time */}
          <div className="debug-panel">
            <div role="tablist" aria-label="Panel contextual" className="debug-panel-tabs" onKeyDown={(e) => {
              // Delegate to active tab's key handler via current activeTab
              onTabKeyDown(e, activeTab);
            }}>
              <button
                role="tab"
                id="tab-reto"
                aria-selected={activeTab === 'reto'}
                aria-controls="panel-reto"
                onClick={() => setActiveTab('reto')}
                className={`debug-panel-tab ${activeTab === 'reto' ? 'is-active' : ''}`}
              >
                Reto
              </button>
              <button
                role="tab"
                id="tab-resultado"
                aria-selected={activeTab === 'resultado'}
                aria-controls="panel-resultado"
                onClick={() => setActiveTab('resultado')}
                className={`debug-panel-tab ${activeTab === 'resultado' ? 'is-active' : ''}`}
              >
                Resultado {validationResult ? `(${validationResult.passedCount}/${validationResult.totalCount})` : ''}
              </button>
              <button
                role="tab"
                id="tab-preview"
                aria-selected={activeTab === 'preview'}
                aria-controls={exercise.executionMode === 'logic' ? 'panel-output' : 'panel-preview'}
                onClick={() => {
                  handleExecutePreview();
                }}
                className={`debug-panel-tab ${activeTab === 'preview' ? 'is-active' : ''}`}
              >
                {exercise.executionMode === 'logic' ? 'Salida' : 'Vista previa'}
              </button>
            </div>

            <div className="debug-panel-content">
              {activeTab === 'reto' && (
                <div id="panel-reto" role="tabpanel" aria-labelledby="tab-reto" className="debug-panel-pane">
                  <div className="debug-panel-scroll">
                    <h3 className="debug-panel-title">Objetivo</h3>
                    <p className="text-sm text-zinc-700">{exercise.description}</p>

                    <details className="debug-details" open>
                      <summary className="debug-summary">Esperado</summary>
                      <div className="debug-card is-expected mt-2">
                        <p>{exercise.expectedBehavior}</p>
                      </div>
                    </details>

                    <details className="debug-details">
                      <summary className="debug-summary">Lo que ocurre</summary>
                      <div className="debug-card is-observed mt-2">
                        <p>{exercise.observedBehavior}</p>
                      </div>
                    </details>

                    {testsFunctionDirectly && (
                      <p className="debug-hint mt-3">
                        Puedes probar la función con valores propios antes de pulsar Comprobar. Añade temporalmente una llamada con <code>{language === 'python' ? 'print(...)' : 'console.log(...)'}</code>; las comprobaciones usarán otros datos para revisar que la regla sea general.
                      </p>
                    )}

                    {exercise.troubleshootingTips && exercise.troubleshootingTips.length > 0 && (
                      <details className="debug-details">
                        <summary className="debug-summary">Cómo investigar</summary>
                        <ul className="debug-tips mt-2">
                          {exercise.troubleshootingTips.map((tip) => (
                            <li key={tip}>{tip}</li>
                          ))}
                        </ul>
                      </details>
                    )}

                    {showResolution ? (
                      <section className="debug-resolution-card" aria-labelledby="debug-resolution-title">
                        <h4 id="debug-resolution-title" className="debug-resolution-title">
                          <BookOpen className="h-3.5 w-3.5" />
                          Diagnóstico específico
                        </h4>
                        <p className="debug-resolution-lead">Ver la resolución no equivale a haber resuelto el reto. Tu código se conserva.</p>
                        <ol className="debug-resolution-steps">
                          <li><strong>Causa observada:</strong> {exercise.observedBehavior}</li>
                          <li><strong>Dónde mirar:</strong> {exercise.hints[0]?.text ?? 'Compara la primera diferencia entre esperado y observado.'}</li>
                          <li><strong>Concepto que corrige la causa:</strong> {exercise.hints[1]?.text ?? 'Vuelve al modelo mental de la lección.'}</li>
                          <li><strong>Próximo cambio:</strong> {exercise.hints[2]?.text ?? 'Cambia una sola causa y vuelve a ejecutar.'}</li>
                          <li><strong>Cómo verificar:</strong> {exercise.expectedBehavior}</li>
                        </ol>
                        <p className="debug-resolution-note" data-resolution-note>La guía revela el razonamiento completo sin reemplazar tu código. Aplica el cambio y usa todas las comprobaciones, no solo el ejemplo visible.</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleReturnToAttempt} className="flex-1 neu-pill-btn bg-slate-100 text-slate-900" aria-label="Volver a intentarlo">
                            <Undo2 size={13} />
                            Volver a intentarlo
                          </button>
                          <button type="button" onClick={handleSkipForNow} className="flex-1 neu-pill-btn bg-amber-100" aria-label="Saltar por ahora">Saltar por ahora</button>
                        </div>
                      </section>
                    ) : (
                      exercise.hints.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="debug-kicker" style={{ marginBottom: 0 }}>
                              <Lightbulb size={12} style={{ display: 'inline', marginRight: 4 }} />
                              Pistas {revealedHints}/{exercise.hints.length}
                            </span>
                            {revealedHints < exercise.hints.length && (
                              <button
                                type="button"
                                className="neu-pill-btn"
                                onClick={() => setRevealedHints((count) => count + 1)}
                                aria-label="Mostrar siguiente pista"
                              >
                                Otra pista
                              </button>
                            )}
                          </div>
                          {exercise.hints.slice(0, revealedHints).map((hint) => (
                            <div key={hint.level} className="debug-hint" style={{ marginBottom: 6 }}>
                              <strong>Pista {hint.level}.</strong> {hint.text}
                            </div>
                          ))}
                          {revealedHints >= exercise.hints.length && (
                            <button
                              type="button"
                              onClick={handleViewSolution}
                              className="w-full mt-1 flex items-center justify-center gap-1.5 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 py-1.5 text-amber-900 text-[11px] font-bold"
                              aria-label="Ver cómo se resuelve"
                            >
                              <Eye className="h-3 w-3" />
                              Ver cómo se resuelve
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  <div className="debug-panel-actions">
                    <button type="button" onClick={handleValidate} disabled={isEvaluating} className="debug-check-btn w-full" aria-label="Comprobar" style={{ opacity: isEvaluating ? 0.6 : 1 }}>
                      <Play size={14} />
                      {isEvaluating ? 'Comprobando…' : 'Comprobar'}
                    </button>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleReset} className="neu-pill-btn flex-1 justify-center" aria-label="Reiniciar">
                        <RotateCcw size={13} />
                        Reiniciar
                      </button>
                      <button type="button" onClick={handleSkipForNow} className="neu-pill-btn flex-1 justify-center border-amber-200 bg-amber-50 text-amber-900" aria-label="Saltar por ahora">
                        Saltar por ahora
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resultado' && (
                <div id="panel-resultado" role="tabpanel" aria-labelledby="tab-resultado" className="debug-panel-pane">
                  <div
                    ref={resultSummaryRef}
                    tabIndex={-1}
                    aria-live="polite"
                    aria-atomic="true"
                    className="outline-none"
                  >
                    {!validationResult ? (
                      <div className="text-center py-8 text-zinc-500">
                        <p className="text-sm">Aún no has comprobado.</p>
                        <p className="text-xs mt-1">Edita y pulsa Comprobar para ver el diagnóstico.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">Resultado</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${validationResult.allPassed ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : validationResult.tests.some(t=>t.isEvaluationError) ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                            {validationResult.passedCount} de {validationResult.totalCount} comprobaciones superadas
                          </span>
                        </div>

                        {validationResult.tests.some(t => t.isEvaluationError) && (
                          <div className="rounded border border-amber-300 bg-amber-50 p-2 flex gap-1.5 text-amber-900 text-xs">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <span>No pudimos evaluar el código. Revisa errores de sintaxis o la consola y vuelve a intentar. No es que tu respuesta sea incorrecta, es que no se pudo ejecutar.</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {exercise.tests.map((test) => {
                            const result = validationResult.tests.find((item) => item.id === test.id);
                            const isError = result?.isEvaluationError;
                            const state = !result ? '' : isError ? 'is-evaluation-error' : result.passed ? 'is-pass' : 'is-fail';
                            const stateTextColor = !result
                              ? ''
                              : isError
                                ? 'text-amber-950'
                                : result.passed
                                  ? 'text-emerald-950 dark:text-emerald-50'
                                  : 'text-rose-950';
                            const icon = isError ? <AlertTriangle size={14} className="shrink-0 text-amber-600" /> : result?.passed ? <CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> : <XCircle size={14} className="shrink-0 text-rose-600" />;
                            return (
                              <div key={test.id} className={`debug-test ${state} ${stateTextColor}`} aria-label={isError ? 'error de evaluación' : result?.passed ? 'pasado' : 'fallido'}>
                                {validationResult ? icon : (
                                  <span className="shrink-0" style={{ width: 10, height: 10, marginTop: 3, borderRadius: 99, border: '1.5px solid #232733' }} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium flex items-center gap-1.5">
                                    <span>{test.description}</span>
                                    {!isError && result?.passed && <span className="text-emerald-600 text-[10px]" aria-hidden="true">✓</span>}
                                    {!isError && !result?.passed && result && <span className="text-rose-600 text-[10px]" aria-hidden="true">✗</span>}
                                    {isError && <span className="text-amber-600 text-[10px]" aria-hidden="true">!</span>}
                                  </div>
                                  {result && !result.passed && (
                                    <div className="mt-1 space-y-1">
                                      {result.errorMessage && <div className={`text-[11px] p-1.5 rounded ${isError ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>{result.errorMessage}</div>}
                                      {result.receivedValue !== undefined && (
                                        <div className="text-[11px] font-mono bg-zinc-100 border border-zinc-300 p-1 rounded">Recibido: {JSON.stringify(result.receivedValue)}</div>
                                      )}
                                      {result.expectedValue !== undefined && !isError && (
                                        <div className="text-[11px] font-mono bg-zinc-50 border border-zinc-200 p-1 rounded">Esperado: {JSON.stringify(result.expectedValue)}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className={`p-2 rounded border text-xs ${validationResult.allPassed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : validationResult.tests.some(t=>t.isEvaluationError) ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-zinc-50 border-zinc-300 text-zinc-800'}`} aria-live="polite">
                          {validationResult.feedbackMessage}
                        </div>

                        {validationResult.allPassed ? (
                          <div className="pt-2">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                              <CheckCircle2 size={16} />
                              Resuelto
                            </div>
                            <PostSolveStudio
                              itemId={exercise.id}
                              title={exercise.title}
                              instructions={`${exercise.expectedBehavior} ${exercise.observedBehavior}`}
                              kind="debugging"
                              continueLabel="Registrar y continuar"
                              onComplete={async (readingAnswer, variationAnswer) => {
                                await recordPostSolveEvidence(exercise.id, readingAnswer, variationAnswer);
                                markItemCompleted(exercise.id);
                                onCompleted?.();
                                setPostSolveComplete(true);
                                handleNext();
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setActiveTab('reto')} className="flex-1 neu-pill-btn" aria-label="Volver al reto">Volver al reto</button>
                            <button type="button" onClick={handleValidate} className="flex-1 debug-check-btn" aria-label="Volver a comprobar">Volver a comprobar</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!validationResult && (
                    <div className="debug-panel-actions">
                      <button type="button" onClick={handleValidate} className="debug-check-btn w-full" aria-label="Comprobar">Comprobar</button>
                    </div>
                  )}
                </div>
              )}

              <div
                id={exercise.executionMode === 'logic' ? 'panel-output' : 'panel-preview'}
                role="tabpanel"
                aria-labelledby="tab-preview"
                className="debug-panel-pane"
                hidden={activeTab !== 'preview'}
                style={{ display: activeTab === 'preview' ? undefined : 'none' }}
              >
                  {exercise.executionMode === 'logic' ? (
                    <div className="debug-logic-output">
                      <LogicRunnerPanel
                        ref={logicRunnerRef}
                        workspace={workspace}
                        language={language}
                        packages={exercise.languageVariants?.[language].packages}
                      />
                      <button type="button" onClick={() => setActiveTab('resultado')} className="neu-pill-btn justify-center" aria-label="Volver a resultado">Volver a resultado</button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col min-h-[300px]">
                      <div className="flex-1 border border-zinc-700 rounded-lg overflow-hidden bg-[#12151e]" style={{ minHeight: 240 }}>
                        <PreviewPane ref={previewRef} workspace={workspace} autoReload={false} isFloating={false} />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={handleExecutePreview} className="flex-1 neu-pill-btn bg-slate-100 text-slate-900" aria-label="Ejecutar vista previa">
                          <Play size={13} />
                          Ejecutar
                        </button>
                        <button type="button" onClick={() => setActiveTab('resultado')} className="flex-1 neu-pill-btn" aria-label="Volver a resultado">Volver a resultado</button>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">Vista previa bajo demanda. Usa Ejecutar para actualizar tras editar.</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
