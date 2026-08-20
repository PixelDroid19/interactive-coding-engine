import React, { useState, useRef } from 'react';
import { DebuggingExerciseItem } from '../../types/curriculum';
import { WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { cloneWorkspace } from '../../engine/eventLog';
import { runChallengeValidation } from '../../engine/testRunner';
import { markItemCompleted } from '../../engine/persistence';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
import { ChallengeValidationResult } from '../../types/runtime';
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Play,
  RotateCcw,
  ChevronRight,
  FolderTree,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DebuggingViewProps {
  exercise: DebuggingExerciseItem;
  courseTitle?: string;
  onBack: () => void;
  onNext?: () => void;
}

export const DebuggingView: React.FC<DebuggingViewProps> = ({
  exercise,
  courseTitle = 'JavaScript Events',
  onBack,
  onNext,
}) => {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => cloneWorkspace(exercise.initialWorkspace));
  const [validationResult, setValidationResult] = useState<ChallengeValidationResult | null>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [showFileTree, setShowFileTree] = useState(true);
  const previewRef = useRef<PreviewPaneRef | null>(null);

  const handleValidate = async () => {
    const iframe = previewRef.current?.getIframeElement();

    // Map debugging tests to ChallengeTest format
    const challengeTests = exercise.tests.map((t) => ({
      ...t,
      validatorType: 'source-regex' as const,
    }));

    const result = await runChallengeValidation(
      {
        id: exercise.id,
        title: exercise.title,
        timestamp: 0,
        instructions: exercise.description || '',
        tests: challengeTests as any,
        hints: exercise.hints.map((h) => ({ level: h.level, title: `Hint ${h.level}`, text: h.text })),
      },
      workspace,
      iframe
    );

    setValidationResult(result);

    if (result.allPassed) {
      markItemCompleted(exercise.id);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleReset = () => {
    setWorkspace(cloneWorkspace(exercise.initialWorkspace));
    setValidationResult(null);
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f0f11] text-zinc-200 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex h-11 items-center justify-between px-4 bg-[#141416] border-b border-zinc-800/80 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Roadmap</span>
          </button>

          <div className="h-3.5 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 px-2 py-0.5 text-xs font-semibold">
              <Bug className="h-3.5 w-3.5" />
              <span>Debugging Lab</span>
            </span>
            <h2 className="text-xs font-semibold text-zinc-100 truncate">{exercise.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {validationResult?.allPassed && (
            <span className="flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Resolved</span>
            </span>
          )}

          {onNext && (
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main 3-Column Split */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Drawer: Problem Diagnostics & Tests */}
        <div className="w-80 shrink-0 h-full bg-[#141416] border-r border-zinc-800/80 flex flex-col overflow-y-auto p-4 space-y-4 text-xs">
          {/* Expected vs Observed */}
          <div className="space-y-2.5">
            <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                <FileCheck className="h-3.5 w-3.5" />
                <span>Expected Behavior</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-xs">{exercise.expectedBehavior}</p>
            </div>

            <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-3">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                <Bug className="h-3.5 w-3.5" />
                <span>Observed Defect</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-xs">{exercise.observedBehavior}</p>
            </div>
          </div>

          {/* Investigation Tips */}
          {exercise.troubleshootingTips && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Investigation Strategy</h4>
              <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-xs">
                {exercise.troubleshootingTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Tests */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Verification Criteria</h4>
              {validationResult && (
                <span className="text-[11px] font-bold text-zinc-300">
                  {validationResult.passedCount} / {validationResult.totalCount}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {exercise.tests.map((test) => {
                const res = validationResult?.tests.find((t) => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    className={`flex items-start gap-2 p-2 rounded border text-xs ${
                      validationResult
                        ? res?.passed
                          ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {validationResult ? (
                      res?.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                      )
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-zinc-600 shrink-0 mt-0.5" />
                    )}
                    <span>{test.description}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progressive Hints */}
          {exercise.hints && exercise.hints.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-300 font-semibold flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  <span>Hints ({revealedHints} of {exercise.hints.length})</span>
                </span>
                {revealedHints < exercise.hints.length && (
                  <button
                    onClick={() => setRevealedHints((r) => r + 1)}
                    className="text-[11px] text-zinc-300 hover:text-white underline font-medium"
                  >
                    Reveal Hint {revealedHints + 1}
                  </button>
                )}
              </div>

              {exercise.hints.slice(0, revealedHints).map((h) => (
                <div key={h.level} className="bg-zinc-900 p-2.5 rounded border border-zinc-800 text-zinc-300 text-xs">
                  <span className="font-semibold text-zinc-200 mr-1">Hint {h.level}:</span>
                  {h.text}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 space-y-2 mt-auto">
            <button
              onClick={handleValidate}
              className="w-full flex items-center justify-center gap-2 rounded bg-zinc-100 hover:bg-white py-2 text-zinc-900 font-bold text-xs shadow-sm transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-zinc-900" />
              <span>Verify Fix & Run Tests</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1 text-zinc-400 hover:text-zinc-200 py-1 text-[11px] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset starter code</span>
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

