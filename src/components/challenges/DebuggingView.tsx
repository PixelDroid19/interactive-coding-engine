import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  ChevronRight,
  FolderTree,
  Lightbulb,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DebuggingExerciseItem } from '../../types/curriculum';
import { ChallengeTest, WorkspaceFile, WorkspaceSnapshot } from '../../types/scrim';
import { ChallengeValidationResult } from '../../types/runtime';
import { cloneWorkspace } from '../../engine/eventLog';
import { markItemCompleted } from '../../engine/persistence';
import { runChallengeValidation } from '../../engine/testRunner';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';

interface DebuggingViewProps {
  exercise: DebuggingExerciseItem;
  courseTitle?: string;
  onBack: () => void;
  onNext?: () => void;
}

function inferValidator(test: ChallengeTest): ChallengeTest['validatorType'] {
  if (test.validatorType) return test.validatorType;
  if (test.targetFunction) return 'function-call';
  if (test.domSelector) return 'dom-check';
  return 'source-regex';
}

export const DebuggingView: React.FC<DebuggingViewProps> = ({
  exercise,
  onBack,
  onNext,
}) => {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => cloneWorkspace(exercise.initialWorkspace));
  const [validationResult, setValidationResult] = useState<ChallengeValidationResult | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showFileTree, setShowFileTree] = useState(true);
  const previewRef = useRef<PreviewPaneRef | null>(null);

  const handleValidate = async () => {
    previewRef.current?.reloadPreview();
    await new Promise((resolve) => window.setTimeout(resolve, 420));

    const iframe = previewRef.current?.getIframeElement();
    const tests = exercise.tests.map((test) => ({
      ...test,
      validatorType: inferValidator(test),
    }));

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
      iframe
    );

    setValidationResult(result);

    if (result.allPassed) {
      markItemCompleted(exercise.id);
      confetti({ particleCount: 90, spread: 68, origin: { y: 0.62 } });
    }
  };

  const handleReset = () => {
    setWorkspace(cloneWorkspace(exercise.initialWorkspace));
    setValidationResult(null);
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="app-screen">
      <div className="studio-card">
        <header className="window-topbar">
          <div className="window-titlebar-left min-w-0">
            <button type="button" onClick={onBack} className="neu-pill-btn shrink-0">
              <ArrowLeft size={15} />
              <span>Roadmap</span>
            </button>
            <div className="topbar-divider hidden sm:block" />
            <span className="category-tag">
              <Bug size={12} style={{ display: 'inline', marginRight: 4 }} />
              Depura
            </span>
            <span className="topbar-lesson-title truncate">{exercise.title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {validationResult?.allPassed && (
              <span className="category-tag" style={{ background: 'var(--color-highlighter-mint)' }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                Resuelto
              </span>
            )}
            {onNext && (
              <button type="button" onClick={onNext} className="btn-next-lesson neu-pill-btn">
                <span>Siguiente</span>
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </header>

        <div className="debug-layout">
          <aside className="debug-brief">
            <div>
              <h3>Qué debería pasar</h3>
              <div className="debug-card is-expected">
                <span className="debug-kicker">Esperado</span>
                <p>{exercise.expectedBehavior}</p>
              </div>
            </div>

            <div className="debug-card is-observed">
              <span className="debug-kicker">Lo que hace ahora</span>
              <p>{exercise.observedBehavior}</p>
            </div>

            {exercise.troubleshootingTips && exercise.troubleshootingTips.length > 0 && (
              <div>
                <span className="debug-kicker">Cómo investigar</span>
                <ul className="debug-tips">
                  {exercise.troubleshootingTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="debug-kicker" style={{ marginBottom: 0 }}>
                  Comprobaciones
                </span>
                {validationResult && (
                  <span style={{ fontSize: 12, fontWeight: 700 }}>
                    {validationResult.passedCount}/{validationResult.totalCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {exercise.tests.map((test) => {
                  const result = validationResult?.tests.find((item) => item.id === test.id);
                  const state = !validationResult ? '' : result?.passed ? 'is-pass' : 'is-fail';
                  return (
                    <div key={test.id} className={`debug-test ${state}`}>
                      {validationResult ? (
                        result?.passed ? (
                          <CheckCircle2 size={14} className="shrink-0" />
                        ) : (
                          <XCircle size={14} className="shrink-0" />
                        )
                      ) : (
                        <span
                          className="shrink-0"
                          style={{
                            width: 10,
                            height: 10,
                            marginTop: 3,
                            borderRadius: 99,
                            border: '1.5px solid #232733',
                          }}
                        />
                      )}
                      <span>{test.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {exercise.hints.length > 0 && (
              <div>
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
              </div>
            )}

            <div className="debug-actions">
              <button type="button" onClick={handleValidate} className="debug-check-btn">
                <Play size={14} />
                Comprobar
              </button>
              <button type="button" onClick={handleReset} className="neu-pill-btn w-full justify-center">
                <RotateCcw size={13} />
                Volver al código roto
              </button>
            </div>
          </aside>

          <main className="workspace-container debug-workspace">
            {showFileTree && (
              <aside className="files-sidebar">
                <FileTree
                  files={workspace.files}
                  activeFilePath={workspace.activeFilePath}
                  onFileSelect={(path) => setWorkspace((prev) => ({ ...prev, activeFilePath: path }))}
                  readOnly={false}
                />
              </aside>
            )}

            <section className="lesson-stage">
              <div className="editor-window-wrapper">
                <div className="editor-tabs-bar">
                  <div className="editor-tabs-group">
                    <button
                      type="button"
                      onClick={() => setShowFileTree((open) => !open)}
                      className="editor-action-btn"
                      title="Archivos"
                    >
                      <FolderTree className="h-3 w-3" />
                    </button>
                    {(Object.values(workspace.files) as WorkspaceFile[]).map((file) => (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: file.path }))}
                        className={`tab-btn ${file.path === workspace.activeFilePath ? 'tab-btn-active' : ''}`}
                      >
                        <span>{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="editor-body relative min-h-0 overflow-hidden">
                  <CodeEditor
                    file={activeFile}
                    readOnly={false}
                    onCodeChange={(content) => {
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
                  />
                </div>
              </div>

              <div className="preview-dock">
                <PreviewPane ref={previewRef} workspace={workspace} autoReload isFloating={false} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
