import React, { useState, useEffect, useRef } from 'react';
import { ScrimChallenge, ScrimLessonData, WorkspaceFile, WorkspaceSnapshot, LearnerBranch } from '../../types/scrim';
import { PlaybackEngine, PlaybackStatus } from '../../engine/playbackEngine';
import { SyncTelemetry } from '../../engine/syncEngine';
import { cloneWorkspace } from '../../engine/eventLog';
import { runChallengeValidation } from '../../engine/testRunner';
import { markChallengeCompleted, markItemCompleted, saveLearnerBranch, updateRecentPosition, loadVoiceVolume, saveVoiceVolume } from '../../engine/persistence';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { FloatingBrowser, FloatingBrowserRef } from '../preview/FloatingBrowser';
import { Timeline } from './Timeline';
import { ChallengeDrawer } from '../challenges/ChallengeDrawer';
import { ExplainModal } from './ExplainModal';
import { ConceptSlideInset } from './ConceptSlideInset';
import { ChallengeValidationResult } from '../../types/runtime';
import {
  ArrowLeft,
  RotateCcw,
  GitBranch,
  ChevronRight,
  FolderTree,
  Volume2,
  Lightbulb,
  Pin,
  PinOff,
} from 'lucide-react';

interface ScrimPlayerProps {
  lessonData: ScrimLessonData;
  courseTitle?: string;
  moduleTitle?: string;
  onBack: () => void;
  onNextLesson?: () => void;
  initialTimeMs?: number;
}

export const ScrimPlayer: React.FC<ScrimPlayerProps> = ({
  lessonData,
  courseTitle = 'Fullstack Path',
  moduleTitle = 'Introduction',
  onBack,
  onNextLesson,
  initialTimeMs = 0,
}) => {
  // Playback & workspace state
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => cloneWorkspace(lessonData.initialWorkspace));
  const [currentTimeMs, setCurrentTimeMs] = useState(initialTimeMs);
  const [durationMs, setDurationMs] = useState(lessonData.durationMs);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('paused');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [instructorPointer, setInstructorPointer] = useState<{ x: number; y: number; targetArea: 'editor' | 'preview' | 'files' | 'global'; clicked?: boolean } | undefined>();
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => loadVoiceVolume());
  const [showCaptions, setShowCaptions] = useState(true);
  const [syncTelemetry, setSyncTelemetry] = useState<SyncTelemetry | null>(null);

  // Learner branch state
  const [isForked, setIsForked] = useState(false);
  const [learnerBranch, setLearnerBranch] = useState<LearnerBranch | null>(null);

  // Challenge state
  const [activeChallenge, setActiveChallenge] = useState<ScrimChallenge | null>(null);
  const [validationResult, setValidationResult] = useState<ChallengeValidationResult | null>(null);
  const [isChallengeDrawerOpen, setIsChallengeDrawerOpen] = useState(false);

  // Layout state
  const [showFileTree, setShowFileTree] = useState(true);
  const [isFloatingBrowser, setIsFloatingBrowser] = useState(true);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  const engineRef = useRef<PlaybackEngine | null>(null);
  const previewRef = useRef<FloatingBrowserRef | null>(null);
  const isForkedRef = useRef(false);
  const timeRef = useRef(initialTimeMs);
  const workspaceRef = useRef(workspace);
  const lastSaveRef = useRef(0);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  workspaceRef.current = workspace;
  isForkedRef.current = isForked;
  timeRef.current = currentTimeMs;

  const formatClockTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const forkLearnerBranch = (baseTime: number) => {
    if (isForkedRef.current) return;
    isForkedRef.current = true;
    setIsForked(true);
    const branch: LearnerBranch = {
      id: `branch-${lessonData.id}-${Date.now()}`,
      lessonId: lessonData.id,
      baseTime,
      baseSequence: 0,
      workspace: cloneWorkspace(workspaceRef.current),
      isForked: true,
      lastSavedAt: Date.now(),
      executionCount: 0,
    };
    setLearnerBranch(branch);
    setInstructorPointer(undefined);
    saveLearnerBranch(branch);
  };

  useEffect(() => {
    isForkedRef.current = false;
    setIsForked(false);
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setValidationResult(null);
    setWorkspace(cloneWorkspace(lessonData.initialWorkspace));
    setCurrentTimeMs(initialTimeMs);
    setDurationMs(lessonData.durationMs);
    setActiveSubtitle(null);

    const engine = new PlaybackEngine({
      onWorkspaceChange: (newWs) => {
        if (!isForkedRef.current) {
          workspaceRef.current = newWs;
          setWorkspace(newWs);
        }
      },
      onTimeUpdate: (current, duration) => {
        timeRef.current = current;
        setCurrentTimeMs(current);
        setDurationMs(duration);
        const now = performance.now();
        if (now - lastSaveRef.current > 1200) {
          lastSaveRef.current = now;
          updateRecentPosition(
            courseTitle,
            moduleTitle,
            lessonData.id,
            lessonData.title,
            'scrim',
            current
          );
        }
      },
      onPointerChange: (pointer) => {
        if (!isForkedRef.current) {
          setInstructorPointer(pointer);
        }
      },
      onChallengeTrigger: (challenge) => {
        setActiveChallenge(challenge);
        setIsChallengeDrawerOpen(true);
        setValidationResult(null);
        forkLearnerBranch(engineRef.current?.getCurrentTime() ?? timeRef.current);
      },
      onPlaybackStateChange: (status) => {
        setPlaybackStatus(status);
      },
      onRunTriggered: () => {
        previewRef.current?.reloadPreview();
      },
      onCompleted: () => {
        markItemCompleted(lessonData.id);
      },
      onSubtitleChange: (subtitle) => {
        setActiveSubtitle(subtitle);
      },
      onSyncTelemetry: (telemetry) => {
        setSyncTelemetry(telemetry);
      },
    });

    engineRef.current = engine;
    engine.setVolume(volumeRef.current);
    engine.setMuted(isMuted);
    engine.loadLesson(lessonData, initialTimeMs);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [lessonData.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, .cm-editor, [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (isForkedRef.current) return;
        if (engineRef.current?.getStatus() === 'playing') {
          engineRef.current.pause();
        } else {
          engineRef.current?.play();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    engineRef.current?.setMuted(next);
  };

  const handleVolumeChange = (nextVolume: number) => {
    const clamped = Math.min(1, Math.max(0, nextVolume));
    setVolume(clamped);
    volumeRef.current = clamped;
    saveVoiceVolume(clamped);
    engineRef.current?.setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      engineRef.current?.setMuted(false);
    }
  };

  const toggleCaptions = () => {
    setShowCaptions(!showCaptions);
  };

  const handleReturnToLesson = () => {
    isForkedRef.current = false;
    setIsForked(false);
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setValidationResult(null);

    if (engineRef.current) {
      engineRef.current.seek(timeRef.current);
      engineRef.current.play();
    }
  };

  // Student edits code
  const handleCodeChange = (newContent: string, changes: { from: number; to: number; text: string }[]) => {
    if (!isForkedRef.current) {
      engineRef.current?.pause();
      forkLearnerBranch(timeRef.current);
    }

    setWorkspace((prev) => {
      const activePath = prev.activeFilePath;
      if (!prev.files[activePath]) return prev;

      const updatedFiles = {
        ...prev.files,
        [activePath]: {
          ...prev.files[activePath],
          content: newContent,
        },
      };

      const newWs: WorkspaceSnapshot = {
        ...prev,
        files: updatedFiles,
      };

      if (learnerBranch) {
        learnerBranch.workspace = newWs;
        saveLearnerBranch(learnerBranch);
      }

      return newWs;
    });
  };

  // Validate active challenge
  const handleValidateChallenge = async () => {
    if (!activeChallenge) return;
    previewRef.current?.reloadPreview();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const iframe = previewRef.current?.getIframeElement();
    const result = await runChallengeValidation(activeChallenge, workspaceRef.current, iframe);
    setValidationResult(result);

    if (result.allPassed) {
      markChallengeCompleted(activeChallenge.id);
      markItemCompleted(lessonData.id);
    }
  };

  const handleResetChallenge = () => {
    if (activeChallenge && engineRef.current) {
      engineRef.current.seek(activeChallenge.timestamp);
      setIsForked(true);
      setValidationResult(null);
    }
  };

  const handleSkipChallenge = () => {
    isForkedRef.current = false;
    setIsForked(false);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setValidationResult(null);

    if (engineRef.current) {
      const nextTime = (activeChallenge?.timestamp || timeRef.current) + 500;
      engineRef.current.seek(nextTime);
      engineRef.current.play();
    }
  };

  const handleContinueAfterChallenge = () => {
    isForkedRef.current = false;
    setIsForked(false);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setValidationResult(null);

    if (engineRef.current) {
      const nextTime = (activeChallenge?.timestamp || timeRef.current) + 1000;
      engineRef.current.seek(nextTime);
      engineRef.current.play();
    }
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen w-screen bg-[#0f0f11] text-zinc-200 overflow-hidden select-none font-sans">
      {/* Top Header Bar - Minimized Compact Footprint */}
      <header className="flex h-10 items-center justify-between px-3 bg-[#141416] border-b border-zinc-800/80 z-30 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded bg-zinc-800/90 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Roadmap</span>
          </button>

          <div className="h-3 w-px bg-zinc-800 hidden sm:block shrink-0" />

          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-xs font-mono min-w-0 truncate">
            <span className="text-zinc-500 text-[13px] shrink-0">⠶</span>
            <span className="text-zinc-400 hidden sm:inline truncate">{courseTitle}</span>
            <span className="text-zinc-600 hidden sm:inline shrink-0">/</span>
            <span className="text-zinc-400 hidden md:inline truncate">{moduleTitle}</span>
            <span className="text-zinc-600 hidden md:inline shrink-0">/</span>
            <h2 className="font-semibold text-zinc-100 truncate text-[12px] sm:text-xs">
              {lessonData.title}
            </h2>
          </div>
        </div>

        {/* Center Clock / Time */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-zinc-900/90 border border-zinc-800/90 px-2.5 py-0.5 rounded-full shrink-0">
          <span className="text-zinc-200 font-semibold">{formatClockTime(currentTimeMs)}</span>
          <span className="text-zinc-600">/</span>
          <span>{formatClockTime(durationMs)}</span>
        </div>

        {/* State Indicators & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFloatingBrowser(!isFloatingBrowser)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              isFloatingBrowser
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'
            }`}
            title={isFloatingBrowser ? 'Vista flotante' : 'Vista al lado'}
          >
            {isFloatingBrowser ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
            <span className="text-[10px] hidden sm:inline font-medium">
              {isFloatingBrowser ? 'Flotante' : 'Al lado'}
            </span>
          </button>

          {/* AI Explain Button */}
          <button
            onClick={() => setIsExplainOpen(true)}
            className="flex items-center gap-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2 py-1 text-xs font-semibold text-amber-300 transition-colors shadow-sm"
            title="Explain current code and concept"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-[10px] tracking-wider">EXPLICAR</span>
          </button>

          {isForked ? (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded">
                <GitBranch className="h-3 w-3" />
                <span className="hidden sm:inline">Editando</span>
              </span>

              <button
                onClick={handleReturnToLesson}
                className="flex items-center gap-1 rounded bg-zinc-200 hover:bg-white px-2 py-1 text-zinc-900 text-[11px] font-semibold shadow-sm transition-colors"
                title="Discard personal edits and return to recorded instructor timeline"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            </div>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              <span className={`h-1.5 w-1.5 rounded-full ${playbackStatus === 'playing' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{playbackStatus === 'playing' ? 'Reproduciendo' : 'Pausa'}</span>
              {playbackStatus === 'playing' && syncTelemetry && (
                <span className="text-[9px] text-zinc-400 font-mono hidden xl:inline ml-1 border-l border-zinc-700/80 pl-1">
                  <span className="text-zinc-300 font-medium">60fps</span> ({Math.abs(syncTelemetry.driftMs) < 0.1 ? '±0ms' : `${syncTelemetry.driftMs > 0 ? '+' : ''}${syncTelemetry.driftMs}ms`})
                </span>
              )}
            </span>
          )}

          {onNextLesson && (
            <button
              onClick={onNextLesson}
              className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-300 font-medium transition-colors"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace using CSS Grid System (allocating ≥80% viewport to editor & preview) */}
      <main
        className={`grid min-h-0 h-full w-full overflow-hidden relative ${
          showFileTree
            ? 'grid-cols-[minmax(140px,16vw)_minmax(0,1fr)]'
            : 'grid-cols-[minmax(0,1fr)]'
        }`}
      >
        {/* File Tree Explorer (Max 16vw, minimal impact on stage) */}
        {showFileTree && (
          <aside className="h-full border-r border-zinc-800/80 bg-[#121214] overflow-hidden min-h-0">
            <FileTree
              files={workspace.files}
              activeFilePath={workspace.activeFilePath}
              instructorPointer={
                instructorPointer?.targetArea === 'files' ? instructorPointer : undefined
              }
              onFileSelect={(path) => {
                setWorkspace((prev) => ({ ...prev, activeFilePath: path }));
              }}
              onFileCreate={(file) => {
                forkLearnerBranch(currentTimeMs);
                setWorkspace((prev) => ({
                  ...prev,
                  files: { ...prev.files, [file.path]: file },
                  activeFilePath: file.path,
                }));
              }}
              onFileDelete={(path) => {
                forkLearnerBranch(currentTimeMs);
                setWorkspace((prev) => {
                  const copy = { ...prev.files };
                  delete copy[path];
                  const remaining = Object.keys(copy);
                  return {
                    ...prev,
                    files: copy,
                    activeFilePath: remaining.length > 0 ? remaining[0] : '',
                  };
                });
              }}
              readOnly={!isForked && playbackStatus === 'playing'}
            />
          </aside>
        )}

        <section
          className={`grid h-full w-full overflow-hidden bg-[#18181b] min-h-0 ${
            isFloatingBrowser
              ? 'grid-cols-[minmax(0,1fr)]'
              : 'grid-cols-[minmax(0,58%)_minmax(0,42%)]'
          }`}
        >
          <div className="flex flex-col h-full overflow-hidden border-r border-zinc-800/80 relative min-h-0">
            <div className="flex h-7 items-center justify-between bg-[#141416] border-b border-zinc-800/80 px-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setShowFileTree(!showFileTree)}
                  className={`p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors ${
                    showFileTree ? 'bg-zinc-800 text-zinc-200' : ''
                  }`}
                  title="Toggle Explorer"
                >
                  <FolderTree className="h-3 w-3" />
                </button>

                {(Object.values(workspace.files) as WorkspaceFile[]).map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: f.path }))}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono transition-colors ${
                      f.path === workspace.activeFilePath
                        ? 'bg-[#18181b] text-zinc-100 font-semibold border-t-2 border-zinc-500'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[9px] text-zinc-500 font-semibold">{f.language === 'javascript' ? 'js' : f.language}</span>
                    <span className="text-[11px]">{f.name}</span>
                  </button>
                ))}
              </div>

              {!isForked && !isFloatingBrowser && (
                <span className="text-[9px] text-zinc-500 font-mono hidden md:inline pr-2">
                  Pulsa espacio o el código para pausar y editar
                </span>
              )}
            </div>

            <div className="flex-1 w-full h-full relative bg-[#18181b] min-h-0 overflow-hidden">
              <CodeEditor
                file={activeFile}
                readOnly={false}
                onCodeChange={handleCodeChange}
                instructorPointer={
                  instructorPointer?.targetArea === 'editor' ? instructorPointer : undefined
                }
                instructorCursor={workspace.cursorPosition}
              />

              {activeSubtitle && showCaptions && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[90%] pointer-events-none transition-all duration-150 animate-in fade-in">
                  <div className="bg-zinc-950/90 border border-zinc-700/80 backdrop-blur-md rounded-lg px-3.5 py-1.5 text-xs text-zinc-100 shadow-xl flex items-center gap-2.5">
                    <Volume2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <p className="leading-snug font-sans text-[11px] text-zinc-200">
                      {activeSubtitle}
                    </p>
                  </div>
                </div>
              )}

              <ConceptSlideInset lessonTitle={lessonData.title} concepts={lessonData.concepts} />

              {isFloatingBrowser && (
                <FloatingBrowser
                  key={`${lessonData.id}-float`}
                  ref={previewRef}
                  workspace={workspace}
                  autoReload={isForked}
                  isFloating={true}
                  onToggleFloating={() => setIsFloatingBrowser(false)}
                  onRunClick={() => {
                    if (!isForkedRef.current) forkLearnerBranch(timeRef.current);
                  }}
                  instructorPointer={instructorPointer}
                />
              )}
            </div>
          </div>

          {!isFloatingBrowser && (
            <div className="h-full w-full overflow-hidden min-h-0 flex flex-col">
              <FloatingBrowser
                key={`${lessonData.id}-dock`}
                ref={previewRef}
                workspace={workspace}
                autoReload={isForked}
                isFloating={false}
                onToggleFloating={() => setIsFloatingBrowser(true)}
                onRunClick={() => {
                  if (!isForkedRef.current) forkLearnerBranch(timeRef.current);
                }}
                instructorPointer={instructorPointer}
              />
            </div>
          )}
        </section>
      </main>

      {/* Embedded Challenge Drawer if active */}
      {activeChallenge && (
        <ChallengeDrawer
          challenge={activeChallenge}
          validationResult={validationResult}
          onValidate={handleValidateChallenge}
          onReset={handleResetChallenge}
          onSkip={handleSkipChallenge}
          onContinue={handleContinueAfterChallenge}
          isOpen={isChallengeDrawerOpen}
          onClose={() => setIsChallengeDrawerOpen(false)}
        />
      )}

      {/* Explain Modal */}
      <ExplainModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        lessonTitle={lessonData.title}
        workspace={workspace}
        notes={lessonData.teachNotes}
      />

      {/* Bottom Timeline Bar */}
      <Timeline
        currentTimeMs={currentTimeMs}
        durationMs={durationMs}
        isPlaying={playbackStatus === 'playing'}
        playbackRate={playbackRate}
        challenges={lessonData.challenges}
        chapters={lessonData.chapters || []}
        isMuted={isMuted}
        volume={volume}
        showCaptions={showCaptions}
        onToggleMute={toggleMute}
        onVolumeChange={handleVolumeChange}
        onToggleCaptions={toggleCaptions}
        onPlay={() => {
          if (isForkedRef.current) {
            handleReturnToLesson();
          } else {
            engineRef.current?.play();
          }
        }}
        onPause={() => {
          engineRef.current?.pause();
        }}
        onSeek={(targetMs) => {
          if (isForkedRef.current) {
            isForkedRef.current = false;
            setIsForked(false);
            setLearnerBranch(null);
            setActiveChallenge(null);
            setIsChallengeDrawerOpen(false);
          }
          engineRef.current?.seek(targetMs);
        }}
        onRateChange={(rate) => {
          setPlaybackRate(rate);
          engineRef.current?.setPlaybackRate(rate);
        }}
      />
    </div>
  );
};
