import React, { useState, useEffect, useRef } from 'react';
import { ScrimChallenge, ScrimLessonData, WorkspaceFile, WorkspaceSnapshot, LearnerBranch } from '../../types/scrim';
import { PlaybackEngine, PlaybackStatus } from '../../engine/playbackEngine';
import { SyncTelemetry } from '../../engine/syncEngine';
import { cloneWorkspace } from '../../engine/eventLog';
import { publishInstructorPointer } from '../../engine/instructorPointer';
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
  const lastTimeUiRef = useRef(0);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  workspaceRef.current = workspace;
  isForkedRef.current = isForked;
  timeRef.current = currentTimeMs;

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
    publishInstructorPointer(undefined);
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
        const now = performance.now();
        if (now - lastTimeUiRef.current > 48) {
          lastTimeUiRef.current = now;
          setCurrentTimeMs(current);
          setDurationMs(duration);
        }
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
          publishInstructorPointer(pointer);
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
        setCurrentTimeMs(timeRef.current);
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
      publishInstructorPointer(undefined);
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
    <div className="app-screen">
      <div className="studio-card">
      <header className="window-topbar">
        <div className="window-titlebar-left min-w-0">
          <button onClick={onBack} className="neu-pill-btn shrink-0">
            <ArrowLeft size={15} />
            <span>Roadmap</span>
          </button>
          <div className="topbar-divider hidden sm:block" />
          <span className="topbar-lesson-title truncate">{lessonData.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFloatingBrowser(!isFloatingBrowser)}
            className="neu-pill-btn"
            title={isFloatingBrowser ? 'Vista flotante' : 'Vista al lado'}
          >
            {isFloatingBrowser ? <Pin size={13} /> : <PinOff size={13} />}
            <span>{isFloatingBrowser ? 'Flotante' : 'Al lado'}</span>
          </button>
          <button onClick={() => setIsExplainOpen(true)} className="btn-explain neu-pill-btn">
            <Lightbulb size={14} />
            <span>Explicar</span>
          </button>

          {isForked && (
            <div className="flex items-center gap-1.5">
              <span className="category-tag">
                <GitBranch size={12} style={{ display: 'inline', marginRight: 4 }} />
                Editando
              </span>
              <button onClick={handleReturnToLesson} className="neu-pill-btn" title="Volver a la cinta">
                <RotateCcw size={13} />
                Volver
              </button>
            </div>
          )}

          {onNextLesson && (
            <button onClick={onNextLesson} className="btn-next-lesson neu-pill-btn">
              <span>Siguiente</span>
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace using CSS Grid System (allocating ≥80% viewport to editor & preview) */}
      <main className="workspace-container">
        {showFileTree && (
          <aside className="files-sidebar">
            <FileTree
              files={workspace.files}
              activeFilePath={workspace.activeFilePath}
              onFileSelect={(path) => {
                setWorkspace((prev) => ({ ...prev, activeFilePath: path }));
              }}
              onFileCreate={
                isForked
                  ? (file) => {
                      forkLearnerBranch(currentTimeMs);
                      setWorkspace((prev) => ({
                        ...prev,
                        files: { ...prev.files, [file.path]: file },
                        activeFilePath: file.path,
                      }));
                    }
                  : undefined
              }
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

        <section className="lesson-stage">
          <div className="editor-window-wrapper">
            <div className="editor-tabs-bar">
              <div className="editor-tabs-group">
                <button
                  onClick={() => setShowFileTree(!showFileTree)}
                  className="editor-action-btn"
                  title="Toggle Explorer"
                >
                  <FolderTree className="h-3 w-3" />
                </button>

                {(Object.values(workspace.files) as WorkspaceFile[]).map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: f.path }))}
                    className={`tab-btn ${f.path === workspace.activeFilePath ? 'tab-btn-active' : ''}`}
                  >
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>

              {!isForked && !isFloatingBrowser && (
                <span className="timestamp-text hidden md:inline pr-2">
                  Espacio para pausar y editar
                </span>
              )}
            </div>

            <div className="editor-body relative min-h-0 overflow-hidden">
              <CodeEditor
                file={activeFile}
                readOnly={false}
                onCodeChange={handleCodeChange}
                instructorCursor={workspace.cursorPosition}
              />

              {activeSubtitle && showCaptions && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[90%] pointer-events-none">
                  <div className="caption-chip">
                    <Volume2 className="h-3.5 w-3.5 shrink-0" />
                    <p>{activeSubtitle}</p>
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
                />
              )}
            </div>
          </div>

          {!isFloatingBrowser && (
            <div className="h-full overflow-hidden min-h-0" style={{ width: '40%', minWidth: 280, flexShrink: 0 }}>
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
        concepts={lessonData.concepts}
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
    </div>
  );
};
