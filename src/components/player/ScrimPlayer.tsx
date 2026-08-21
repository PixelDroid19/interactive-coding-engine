import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { ScrimChallenge, ScrimLessonData, WorkspaceFile, WorkspaceSnapshot, LearnerBranch } from '../../types/scrim';
import { PlaybackEngine, PlaybackStatus } from '../../engine/playbackEngine';
import { SyncTelemetry } from '../../engine/syncEngine';
import { cloneWorkspace, reconstructWorkspaceAt } from '../../engine/eventLog';
import { publishInstructorPointer } from '../../engine/instructorPointer';
import { runChallengeValidation } from '../../engine/testRunner';
import { markChallengeCompleted, markChallengeSkipped, markItemCompleted, saveLearnerBranch, saveLearnerBranchDebounced, loadLastBranchForLesson, flushBranchSave, clearBranchesForLesson, updateRecentPosition, loadVoiceVolume, saveVoiceVolume } from '../../engine/persistence';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { FloatingBrowser, FloatingBrowserRef } from '../preview/FloatingBrowser';
import { Timeline } from './Timeline';
import { ChallengeDrawer } from '../challenges/ChallengeDrawer';
import { ExplainModal } from './ExplainModal';
import { ConceptSlideInset } from './ConceptSlideInset';
import { ChallengeValidationResult } from '../../types/runtime';
import { playerReducer, createInitialState } from '../../engine/playerMachine';
import {
  ArrowLeft,
  RotateCcw,
  GitBranch,
  ChevronRight,
  ChevronLeft,
  FolderTree,
  Volume2,
  Lightbulb,
  Pin,
  PinOff,
  Play,
} from 'lucide-react';

import { NavigationState } from '../../engine/navigation';

interface ScrimPlayerProps {
  lessonData: ScrimLessonData;
  courseTitle?: string;
  moduleTitle?: string;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onNextLesson?: () => void;
  initialTimeMs?: number;
  navigationState?: NavigationState;
}

export const ScrimPlayer: React.FC<ScrimPlayerProps> = ({
  lessonData,
  courseTitle = 'Fullstack Path',
  moduleTitle = 'Introduction',
  onBack,
  onBackToRoadmap,
  onPrevious,
  onNext,
  onNextLesson,
  initialTimeMs = 0,
  navigationState,
}) => {
  const [playerState, dispatch] = useReducer(playerReducer, lessonData.id, createInitialState);
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
  const [learnerBranch, setLearnerBranch] = useState<LearnerBranch | null>(null);
  const [hasPendingEdits, setHasPendingEdits] = useState(false);

  // Challenge state
  const [activeChallenge, setActiveChallenge] = useState<ScrimChallenge | null>(null);
  const [validationResult, setValidationResult] = useState<ChallengeValidationResult | null>(null);
  const [isChallengeDrawerOpen, setIsChallengeDrawerOpen] = useState(false);
  const [isChallengeMinimized, setIsChallengeMinimized] = useState(false);

  // Layout state
  const [showFileTree, setShowFileTree] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
    return true;
  });
  const [isFloatingBrowser, setIsFloatingBrowser] = useState(true);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [awaitingStart, setAwaitingStart] = useState(true);
  const [showBranchRecovery, setShowBranchRecovery] = useState(false);
  const [pendingSeekMs, setPendingSeekMs] = useState<number | null>(null);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [closureConfirmed, setClosureConfirmed] = useState(false);
  const [showClosure, setShowClosure] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'previous' | 'next' | 'roadmap' | null>(null);

  const engineRef = useRef<PlaybackEngine | null>(null);
  const previewRef = useRef<FloatingBrowserRef | null>(null);
  const isForkedRef = useRef(false);
  const timeRef = useRef(initialTimeMs);
  const workspaceRef = useRef(workspace);
  const lastSaveRef = useRef(0);
  const lastTimeUiRef = useRef(0);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const awaitingStartRef = useRef(awaitingStart);
  awaitingStartRef.current = awaitingStart;
  const closureConfirmedRef = useRef(closureConfirmed);
  closureConfirmedRef.current = closureConfirmed;

  workspaceRef.current = workspace;
  isForkedRef.current = playerState.isForked;
  timeRef.current = currentTimeMs;

  const forkLearnerBranch = useCallback((baseTime: number) => {
    if (isForkedRef.current) return;
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
    saveLearnerBranch(branch);
    publishInstructorPointer(undefined);
    dispatch({ type: 'FORK', baseTime });
  }, [lessonData.id]);

  // Branch recovery on mount
  useEffect(() => {
    try {
      const last = loadLastBranchForLesson(lessonData.id);
      if (last && last.workspace && typeof last.baseTime === 'number') {
        // Only show recovery if branch is from same lesson and not too old (within 7 days)
        const ageMs = Date.now() - (last.lastSavedAt || 0);
        if (ageMs < 7 * 24 * 60 * 60 * 1000) {
          setShowBranchRecovery(true);
        }
      }
    } catch {
      // ignore corrupted
    }
  }, [lessonData.id]);

  useEffect(() => {
    // Reset on lesson change
    dispatch({ type: 'LESSON_CHANGE', lessonId: lessonData.id });
    setIsForkedStateFalse();
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setIsChallengeMinimized(false);
    setValidationResult(null);
    setWorkspace(cloneWorkspace(lessonData.initialWorkspace));
    setCurrentTimeMs(initialTimeMs);
    setDurationMs(lessonData.durationMs);
    setActiveSubtitle(null);
    setAwaitingStart(true);
    setHasPendingEdits(false);
    setPendingSeekMs(null);
    setShowReturnConfirm(false);
    setClosureConfirmed(false);
    setShowClosure(false);
    setShowFileTree(typeof window !== 'undefined' && window.innerWidth >= 768);

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
        // Show closure when near end (only for lesson 1)
        if (lessonData.id === 'fundamentos-01' && current >= duration - 1500 && !closureConfirmedRef.current) {
          setShowClosure(true);
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
        setIsChallengeMinimized(false);
        setValidationResult(null);
        const base = engineRef.current?.getCurrentTime() ?? timeRef.current;
        forkLearnerBranch(base);
        dispatch({ type: 'CHALLENGE_TRIGGER', challengeId: challenge.id, baseTime: base });
      },
      onPlaybackStateChange: (status) => {
        setPlaybackStatus(status);
        setCurrentTimeMs(timeRef.current);
        if (status === 'playing') setAwaitingStart(false);
        if (status === 'playing') dispatch({ type: 'PLAY' });
        if (status === 'paused') dispatch({ type: 'PAUSE' });
        if (status === 'ended') {
          if (lessonData.id === 'fundamentos-01' && !closureConfirmedRef.current) {
            setShowClosure(true);
            return;
          }
          dispatch({ type: 'COMPLETE' });
        }
      },
      onRunTriggered: () => {
        // During tape, reload preview only when not forked
        if (!isForkedRef.current) {
          previewRef.current?.reloadPreview();
        }
      },
      onCompleted: () => {
        // Do not auto mark completed if closure not confirmed for lesson01
        if (lessonData.id === 'fundamentos-01' && !closureConfirmedRef.current) {
          setShowClosure(true);
          return;
        }
        markItemCompleted(lessonData.id);
        dispatch({ type: 'COMPLETE' });
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
      flushBranchSave(lessonData.id);
      engine.destroy();
      engineRef.current = null;
      publishInstructorPointer(undefined);
    };
  }, [lessonData.id]);

  function setIsForkedStateFalse() {
    isForkedRef.current = false;
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, .cm-editor, [contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        if (isExplainOpen) {
          setIsExplainOpen(false);
          return;
        }
        if (showReturnConfirm) {
          setShowReturnConfirm(false);
          return;
        }
        if (pendingSeekMs !== null) {
          setPendingSeekMs(null);
          return;
        }
        if (showBranchRecovery) {
          setShowBranchRecovery(false);
          return;
        }
        // Escape should not abandon challenge; only minimize/close drawer handled separately
        return;
      }
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
  }, [isExplainOpen, showReturnConfirm, pendingSeekMs, showBranchRecovery]);

  const startPlayback = () => {
    if (isForkedRef.current) {
      setShowReturnConfirm(true);
      return;
    }
    dispatch({ type: 'START' });
    engineRef.current?.play();
  };

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
    const base = learnerBranch?.baseTime ?? timeRef.current;
    // Confirm discard if has pending edits
    if (hasPendingEdits) {
      setShowReturnConfirm(true);
      return;
    }
    doReturnToTape(base);
  };

  const doReturnToTape = (baseTime: number) => {
    flushBranchSave(lessonData.id);
    clearBranchesForLesson(lessonData.id);
    isForkedRef.current = false;
    dispatch({ type: 'RETURN_TO_TAPE', baseTime });
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setIsChallengeMinimized(false);
    setValidationResult(null);
    setHasPendingEdits(false);
    setShowReturnConfirm(false);

    if (engineRef.current) {
      // Reconstruct instructor state at baseTime
      engineRef.current.seek(baseTime);
      // Ensure workspace reflects instructor state
      const reconstructed = reconstructWorkspaceAt(
        lessonData.initialWorkspace,
        lessonData.events,
        lessonData.snapshots,
        baseTime
      );
      workspaceRef.current = cloneWorkspace(reconstructed.workspace);
      setWorkspace(cloneWorkspace(reconstructed.workspace));
      engineRef.current.play();
    }
  };

  const handlePreviousClick = () => {
    if (hasPendingEdits || playerState.isForked) {
      setPendingNavigation('previous');
      return;
    }
    if (onPrevious) onPrevious();
    else if (onBack) onBack();
  };

  const handleNextClick = () => {
    if (hasPendingEdits || playerState.isForked) {
      setPendingNavigation('next');
      return;
    }
    if (onNext) onNext();
    else if (onNextLesson) onNextLesson();
  };

  const handleRoadmapClick = () => {
    if (hasPendingEdits || playerState.isForked) {
      setPendingNavigation('roadmap');
      return;
    }
    if (onBackToRoadmap) onBackToRoadmap();
    else onBack();
  };

  const confirmNavigation = (mode: 'discard' | 'save') => {
    const action = pendingNavigation;
    setPendingNavigation(null);
    if (mode === 'discard') {
      flushBranchSave(lessonData.id);
      clearBranchesForLesson(lessonData.id);
      setLearnerBranch(null);
      setHasPendingEdits(false);
    } else {
      flushBranchSave(lessonData.id);
      setHasPendingEdits(false);
    }
    if (action === 'previous' && onPrevious) onPrevious();
    else if (action === 'next' && (onNext || onNextLesson)) (onNext || onNextLesson)!();
    else if (action === 'roadmap' && (onBackToRoadmap || onBack)) (onBackToRoadmap || onBack)!();
    else if (action === 'roadmap') onBack();
  };

  const cancelNavigation = () => setPendingNavigation(null);

  // Student edits code
  const handleCodeChange = (newContent: string, changes: { from: number; to: number; text: string }[]) => {
    const wasForked = isForkedRef.current;
    if (!wasForked) {
      engineRef.current?.pause();
      const base = timeRef.current;
      forkLearnerBranch(base);
      setHasPendingEdits(true);
      dispatch({ type: 'EDIT' });
    } else {
      setHasPendingEdits(true);
      dispatch({ type: 'EDIT' });
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
      workspaceRef.current = newWs;

      // Persist deterministically: first edit immediate, subsequent debounced
      setLearnerBranch((prevBranch) => {
        if (!prevBranch) {
          // This is the first edit case where branch was just forked but state update async
          // Create new branch directly from current workspace and save immediately
          const fresh: LearnerBranch = {
            id: `branch-${lessonData.id}-${Date.now()}`,
            lessonId: lessonData.id,
            baseTime: timeRef.current,
            baseSequence: 0,
            workspace: cloneWorkspace(newWs),
            isForked: true,
            lastSavedAt: Date.now(),
            executionCount: 0,
          };
          saveLearnerBranch(fresh);
          return fresh;
        } else {
          const updated: LearnerBranch = {
            ...prevBranch,
            workspace: cloneWorkspace(newWs),
            lastSavedAt: Date.now(),
          };
          // First edit after fork should be immediate, else debounced
          // We check if this is second update quickly after fork (executionCount 0 and time close)
          saveLearnerBranchDebounced(updated, 400);
          return updated;
        }
      });

      return newWs;
    });
  };

  const handleManualRun = () => {
    // Run must pause playback before creating branch
    if (!isForkedRef.current) {
      engineRef.current?.pause();
      const base = timeRef.current;
      forkLearnerBranch(base);
    }
    // Increment execution count
    setLearnerBranch((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, executionCount: (prev.executionCount || 0) + 1, lastSavedAt: Date.now(), workspace: cloneWorkspace(workspaceRef.current) };
      saveLearnerBranch(updated);
      return updated;
    });
    previewRef.current?.reloadPreview();
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
      // Do not auto mark lesson completed; wait for continue
    }
  };

  const handleResetChallenge = () => {
    if (!activeChallenge || !engineRef.current) return;
    // Reconstruct instructor state at challenge timestamp
    const challengeTime = activeChallenge.timestamp;
    const reconstructed = reconstructWorkspaceAt(
      lessonData.initialWorkspace,
      lessonData.events,
      lessonData.snapshots,
      challengeTime
    );
    const resetWs = cloneWorkspace(reconstructed.workspace);
    workspaceRef.current = resetWs;
    setWorkspace(resetWs);
    setValidationResult(null);
    setIsChallengeMinimized(false);
    dispatch({ type: 'CHALLENGE_RESET' });
    // Update branch to reset state
    setLearnerBranch((prev) => {
      if (!prev) return prev;
      const updated: LearnerBranch = {
        ...prev,
        workspace: cloneWorkspace(resetWs),
        baseTime: challengeTime,
        lastSavedAt: Date.now(),
      };
      saveLearnerBranch(updated);
      return updated;
    });
    // Keep drawer open
    setIsChallengeDrawerOpen(true);
  };

  const handleSkipChallenge = () => {
    if (activeChallenge) markChallengeSkipped(activeChallenge.id);
    const skipTime = (activeChallenge?.timestamp || timeRef.current) + 500;
    isForkedRef.current = false;
    dispatch({ type: 'CHALLENGE_SKIP' });
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setIsChallengeMinimized(false);
    setValidationResult(null);
    setHasPendingEdits(false);

    if (engineRef.current) {
      engineRef.current.seek(skipTime);
      engineRef.current.play();
    }
  };

  const handleContinueAfterChallenge = () => {
    const nextTime = (activeChallenge?.timestamp || timeRef.current) + 1000;
    isForkedRef.current = false;
    dispatch({ type: 'CHALLENGE_CONTINUE' });
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setIsChallengeMinimized(false);
    setValidationResult(null);
    setHasPendingEdits(false);

    if (engineRef.current) {
      engineRef.current.seek(nextTime);
      engineRef.current.play();
    }
  };

  const handleCloseChallengeDrawer = () => {
    dispatch({ type: 'CHALLENGE_CLOSE' });
    setIsChallengeDrawerOpen(false);
    // Keep activeChallenge for reopen
  };

  const handleReopenChallenge = () => {
    if (!activeChallenge) return;
    dispatch({ type: 'CHALLENGE_REOPEN' });
    setIsChallengeDrawerOpen(true);
    setIsChallengeMinimized(false);
  };

  const handleSeek = (targetMs: number) => {
    if (isForkedRef.current && hasPendingEdits) {
      setPendingSeekMs(targetMs);
      return;
    }
    if (isForkedRef.current) {
      // Discard branch without pending edits
      flushBranchSave(lessonData.id);
      clearBranchesForLesson(lessonData.id);
      isForkedRef.current = false;
      dispatch({ type: 'DISCARD_BRANCH', baseTime: targetMs });
      setLearnerBranch(null);
      setActiveChallenge(null);
      setIsChallengeDrawerOpen(false);
      setHasPendingEdits(false);
    }
    engineRef.current?.seek(targetMs);
  };

  const handleDiscardAndSeek = () => {
    if (pendingSeekMs !== null) {
      const target = pendingSeekMs;
      setPendingSeekMs(null);
      flushBranchSave(lessonData.id);
      clearBranchesForLesson(lessonData.id);
      isForkedRef.current = false;
      dispatch({ type: 'DISCARD_BRANCH', baseTime: target });
      setLearnerBranch(null);
      setActiveChallenge(null);
      setIsChallengeDrawerOpen(false);
      setHasPendingEdits(false);
      engineRef.current?.seek(target);
    }
  };

  const handleKeepEditing = () => {
    setPendingSeekMs(null);
  };

  const handleRestoreBranch = () => {
    const last = loadLastBranchForLesson(lessonData.id);
    if (!last) {
      setShowBranchRecovery(false);
      return;
    }
    try {
      workspaceRef.current = cloneWorkspace(last.workspace);
      setWorkspace(cloneWorkspace(last.workspace));
      setLearnerBranch(last);
      isForkedRef.current = true;
      dispatch({ type: 'RESTORE_BRANCH', baseTime: last.baseTime, challengeId: (last as any).activeChallengeId || null });
      if ((last as any).activeChallengeId) {
        const ch = lessonData.challenges.find((c) => c.id === (last as any).activeChallengeId) || null;
        setActiveChallenge(ch);
        setIsChallengeDrawerOpen(!!ch);
      }
      setHasPendingEdits(true);
      setShowBranchRecovery(false);
      engineRef.current?.pause();
      publishInstructorPointer(undefined);
    } catch {
      setShowBranchRecovery(false);
    }
  };

  const handleDiscardBranchRecovery = () => {
    setShowBranchRecovery(false);
  };

  const handleClosureConfirm = () => {
    setClosureConfirmed(true);
    setShowClosure(false);
    markItemCompleted(lessonData.id);
    dispatch({ type: 'COMPLETE' });
  };

  const handleRepeatFromEnd = () => {
    setClosureConfirmed(false);
    setShowClosure(false);
    dispatch({ type: 'LESSON_CHANGE', lessonId: lessonData.id });
    isForkedRef.current = false;
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setHasPendingEdits(false);
    const reconstructed = cloneWorkspace(lessonData.initialWorkspace);
    workspaceRef.current = reconstructed;
    setWorkspace(reconstructed);
    setCurrentTimeMs(0);
    timeRef.current = 0;
    setAwaitingStart(true);
    engineRef.current?.seek(0);
    engineRef.current?.pause();
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  const isCompleted = playerState.status === 'completed' || closureConfirmed;

  return (
    <div className="app-screen">
      <div className="studio-card">
      <header className="window-topbar">
        <div className="window-titlebar-left min-w-0">
          <button onClick={handleRoadmapClick} className="neu-pill-btn shrink-0" aria-label="Volver al roadmap">
            <ArrowLeft size={15} />
            <span>Roadmap</span>
          </button>
          {(onPrevious || navigationState) && (
            <button
              onClick={handlePreviousClick}
              disabled={navigationState ? !navigationState.hasPrevious : !onPrevious}
              className="neu-pill-btn shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Anterior"
              title={navigationState?.hasPrevious ? `Anterior: ${navigationState.previous?.item.title}` : 'No hay anterior'}
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}
          <div className="topbar-divider hidden sm:block" />
          <span className="topbar-lesson-title truncate">{lessonData.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsFloatingBrowser(!isFloatingBrowser)}
            className="neu-pill-btn"
            aria-label={isFloatingBrowser ? 'Fijar vista al lado' : 'Soltar vista flotante'}
            title={isFloatingBrowser ? 'Vista flotante' : 'Vista al lado'}
          >
            {isFloatingBrowser ? <Pin size={13} /> : <PinOff size={13} />}
            <span>{isFloatingBrowser ? 'Flotante' : 'Al lado'}</span>
          </button>
          <button onClick={() => setIsExplainOpen(true)} className="btn-explain neu-pill-btn" aria-label="Explicar lección">
            <Lightbulb size={14} />
            <span>Explicar</span>
          </button>

          {playerState.isForked && (
            <div className="flex items-center gap-1.5">
              <span className="category-tag">
                <GitBranch size={12} style={{ display: 'inline', marginRight: 4 }} />
                Editando
              </span>
              <button onClick={handleReturnToLesson} className="neu-pill-btn" aria-label="Volver a la cinta, se descartarán cambios no guardados" title="Volver a la cinta: restaura el estado del instructor en el tiempo base y descarta cambios locales">
                <RotateCcw size={13} />
                Volver
              </button>
            </div>
          )}

          {activeChallenge && !isChallengeDrawerOpen && (
            <button onClick={handleReopenChallenge} className="neu-pill-btn" aria-label={`Reabrir reto ${activeChallenge.title}`} title="Reabrir reto">
              <span>Reto</span>
              <ChevronRight size={14} />
            </button>
          )}

          {(onNext || onNextLesson || navigationState) && (
            navigationState?.hasNext ? (
              <button
                onClick={handleNextClick}
                className={`btn-next-lesson neu-pill-btn ${isCompleted ? '' : 'opacity-60'}`}
                aria-label="Siguiente"
                title={navigationState.next?.item.title || 'Siguiente'}
              >
                <span>Siguiente</span>
                <ChevronRight size={15} />
              </button>
            ) : navigationState?.isLast ? (
              <button
                onClick={handleRoadmapClick}
                className="neu-pill-btn bg-emerald-100 border-emerald-700"
                aria-label="Finalizar y volver al roadmap"
                title="Finalizar"
              >
                <span>Finalizar</span>
                <ChevronRight size={15} />
              </button>
            ) : onNextLesson ? (
              <button
                onClick={handleNextClick}
                className={`btn-next-lesson neu-pill-btn ${isCompleted ? '' : 'opacity-60'}`}
                aria-label="Siguiente lección"
                style={!isCompleted ? { filter: 'grayscale(0.5)' } : undefined}
                title={isCompleted ? 'Siguiente lección' : 'Completa el cierre para continuar'}
              >
                <span>Siguiente</span>
                <ChevronRight size={15} />
              </button>
            ) : null
          )}
        </div>
      </header>

      <div className="lesson-body">
      {awaitingStart && !playerState.isForked && !activeChallenge && (
        <div
          className="lesson-start-gate"
          onClick={startPlayback}
          onKeyDown={(event) => {
            if (event.code === 'Space' || event.key === 'Enter') {
              event.preventDefault();
              startPlayback();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Empezar la clase"
        >
          <span className="lesson-start-kicker">Clase con explicación</span>
          <h2 className="lesson-start-title">{lessonData.title}</h2>
          <p className="lesson-start-hint">
            El instructor escribe, señala y explica. Para oírlo y ver el código moverse, pulsa aquí.
          </p>
          <button
            type="button"
            className="lesson-start-play"
            autoFocus
            onClick={(event) => {
              event.stopPropagation();
              startPlayback();
            }}
            aria-label="Empezar la clase"
          >
            <Play size={22} fill="currentColor" />
            Empezar la clase
          </button>
          <p className="lesson-start-space">
            o pulsa <kbd>Espacio</kbd>
          </p>
        </div>
      )}

      {showBranchRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Recuperar rama">
          <div className="bg-white border-2 border-black rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>¿Continuar tu versión?</h3>
            <p className="text-sm text-gray-600 mt-2">Encontramos una versión guardada de esta lección con tus cambios. Puedes continuar donde lo dejaste o ver la clase desde el inicio.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={handleRestoreBranch} className="flex-1 neu-pill-btn bg-[#ffe600]" aria-label="Continuar mi versión">Continuar mi versión</button>
              <button onClick={handleDiscardBranchRecovery} className="flex-1 neu-pill-btn" aria-label="Ver la clase desde el inicio">Ver la clase</button>
            </div>
          </div>
        </div>
      )}

      {pendingSeekMs !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Cambios pendientes">
          <div className="bg-white border-2 border-black rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold">Tienes cambios sin guardar</h3>
            <p className="text-sm text-gray-600 mt-2">Si buscas otro momento de la cinta, se descartarán tus cambios locales. ¿Qué prefieres?</p>
            <div className="flex gap-2 mt-4">
              <button onClick={handleDiscardAndSeek} className="flex-1 neu-pill-btn bg-rose-100" aria-label="Descartar cambios y buscar">Descartar y buscar</button>
              <button onClick={handleKeepEditing} className="flex-1 neu-pill-btn bg-[#ffe600]" aria-label="Conservar versión y seguir editando">Conservar versión</button>
            </div>
          </div>
        </div>
      )}

      {showReturnConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Volver a la cinta">
          <div className="bg-white border-2 border-black rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold">¿Volver a la cinta?</h3>
            <p className="text-sm text-gray-600 mt-2">Volver restaurará exactamente el estado del instructor en el tiempo base ({Math.round((learnerBranch?.baseTime || 0)/1000)}s) y descartará tus cambios locales. Puedes guardar antes si lo necesitas.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => doReturnToTape(learnerBranch?.baseTime ?? timeRef.current)} className="flex-1 neu-pill-btn bg-[#ffe600]" aria-label="Confirmar volver a la cinta">Volver y descartar</button>
              <button onClick={() => setShowReturnConfirm(false)} className="flex-1 neu-pill-btn" aria-label="Cancelar volver">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {pendingNavigation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Navegación con cambios">
          <div className="bg-white border-2 border-black rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold">Tienes cambios sin guardar</h3>
            <p className="text-sm text-gray-600 mt-2">Si navegas ahora, tu rama con cambios no se descartará silenciosamente. ¿Qué prefieres?</p>
            <div className="flex flex-col gap-2 mt-4">
              <button onClick={() => confirmNavigation('save')} className="w-full neu-pill-btn bg-[#ffe600]" aria-label="Guardar rama y continuar">Guardar rama y continuar</button>
              <button onClick={() => confirmNavigation('discard')} className="w-full neu-pill-btn bg-white border-rose-300" aria-label="Descartar rama y continuar">Descartar rama y continuar</button>
              <button onClick={cancelNavigation} className="w-full neu-pill-btn" aria-label="Cancelar navegación">Cancelar</button>
            </div>
          </div>
        </div>
      )}

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
                playerState.isForked
                  ? (file) => {
                      forkLearnerBranch(currentTimeMs);
                      setWorkspace((prev) => ({
                        ...prev,
                        files: { ...prev.files, [file.path]: file },
                        activeFilePath: file.path,
                      }));
                      setHasPendingEdits(true);
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
                setHasPendingEdits(true);
              }}
              readOnly={!playerState.isForked && playbackStatus === 'playing'}
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
                  aria-label={showFileTree ? 'Ocultar explorador' : 'Mostrar explorador'}
                  title={showFileTree ? 'Ocultar explorador' : 'Mostrar explorador'}
                >
                  <FolderTree className="h-3 w-3" />
                </button>

                {(Object.values(workspace.files) as WorkspaceFile[]).map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setWorkspace((prev) => ({ ...prev, activeFilePath: f.path }))}
                    className={`tab-btn ${f.path === workspace.activeFilePath ? 'tab-btn-active' : ''}`}
                    aria-label={`Abrir ${f.name}`}
                    aria-selected={f.path === workspace.activeFilePath}
                  >
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>

              {!playerState.isForked && !isFloatingBrowser && (
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
                  autoReload={false}
                  isFloating={true}
                  onToggleFloating={() => setIsFloatingBrowser(false)}
                  onRunClick={handleManualRun}
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
                autoReload={false}
                isFloating={false}
                onToggleFloating={() => setIsFloatingBrowser(true)}
                onRunClick={handleManualRun}
              />
            </div>
          )}
        </section>
      </main>

      {/* Closure pedagógico */}
      {showClosure && !closureConfirmed && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_#000] p-4 max-w-lg w-[90%]">
          <h4 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>¿Probaste el botón?</h4>
          <p className="text-xs text-gray-600 mt-1">En la vista previa pulsa el botón y comprueba que el saludo cambia. Luego confirma para completar la clase.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleClosureConfirm} className="flex-1 neu-pill-btn bg-[#ffe600] text-sm" aria-label="He probado el botón, completar clase">He probado el botón</button>
            <button onClick={() => previewRef.current?.reloadPreview()} className="neu-pill-btn text-sm" aria-label="Recargar vista previa">Recargar</button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-50 border-2 border-emerald-700 rounded-xl shadow-[4px_4px_0_#000] p-3 flex items-center gap-3 max-w-lg w-[90%]">
          <span className="text-emerald-700 font-bold text-sm">✓ Clase completada</span>
          <button onClick={handleRepeatFromEnd} className="ml-auto neu-pill-btn text-xs" aria-label="Repetir desde el inicio">Repetir</button>
          {onNextLesson && <button onClick={onNextLesson} className="neu-pill-btn bg-[#ffe600] text-xs" aria-label="Siguiente lección">Siguiente</button>}
        </div>
      )}

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
          onClose={handleCloseChallengeDrawer}
          variant="scrim"
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
        onPlay={startPlayback}
        onPause={() => {
          engineRef.current?.pause();
        }}
        onSeek={handleSeek}
        onRateChange={(rate) => {
          setPlaybackRate(rate);
          engineRef.current?.setPlaybackRate(rate);
        }}
      />
      </div>
      </div>
    </div>
  );
};
