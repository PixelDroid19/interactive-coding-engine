import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { type CourseLanguage, ScrimChallenge, ScrimLessonData, WorkspaceFile, WorkspaceSnapshot, LearnerBranch } from '../../types/scrim';
import { PlaybackEngine, PlaybackStatus } from '../../engine/playbackEngine';
import { SyncTelemetry } from '../../engine/syncEngine';
import { cloneWorkspace, reconstructWorkspaceAt } from '../../engine/eventLog';
import { publishInstructorPointer } from '../../engine/instructorPointer';
import { InstructorCursor } from './InstructorCursor';
import { runChallengeValidation } from '../../engine/testRunner';
import { markChallengeCompleted, markChallengeSkipped, markItemCompleted, saveLearnerBranch, saveLearnerBranchDebounced, loadLastBranchForLesson, flushBranchSave, clearBranchesForLesson, updateRecentPosition, loadVoiceVolume, saveVoiceVolume } from '../../engine/persistence';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { FloatingBrowser, FloatingBrowserRef } from '../preview/FloatingBrowser';
import { LogicRunnerPanel, LogicRunnerPanelRef } from '../preview/LogicRunnerPanel';
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
import { ThemeToggle } from '../ThemeToggle';
import { LanguageSelector } from '../runtime/LanguageSelector';

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
  onPositionChange?: (timeMs: number) => void;
  language?: CourseLanguage;
  onLanguageChange?: (language: CourseLanguage) => void;
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
  onPositionChange,
  language = 'javascript',
  onLanguageChange,
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
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [closureConfirmed, setClosureConfirmed] = useState(false);
  const [showClosure, setShowClosure] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'previous' | 'next' | 'roadmap' | null>(null);
  const isLogicMode = lessonData.executionMode === 'logic';
  const isSilentLesson = lessonData.narrationMode === 'silent';
  const branchScopeId = lessonData.languageVariants ? `${lessonData.id}:${language}` : lessonData.id;

  const engineRef = useRef<PlaybackEngine | null>(null);
  const previewRef = useRef<FloatingBrowserRef | null>(null);
  const logicRunnerRef = useRef<LogicRunnerPanelRef | null>(null);
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
  const branchRecoveryFirstActionRef = useRef<HTMLButtonElement | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const previewReloadAfterWorkspaceRef = useRef(false);

  workspaceRef.current = workspace;
  isForkedRef.current = playerState.isForked;
  timeRef.current = currentTimeMs;
  onPositionChangeRef.current = onPositionChange;

  useEffect(() => {
    if (!previewReloadAfterWorkspaceRef.current) return;
    previewReloadAfterWorkspaceRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      if (isLogicMode) void logicRunnerRef.current?.run();
      else void previewRef.current?.reloadPreview();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isLogicMode, workspace]);

  const forkLearnerBranch = useCallback((baseTime: number, activeChallengeId?: string) => {
    if (isForkedRef.current) return;
    const branch: LearnerBranch = {
      id: `branch-${branchScopeId}-${Date.now()}`,
      lessonId: branchScopeId,
      baseTime,
      baseSequence: 0,
      workspace: cloneWorkspace(workspaceRef.current),
      isForked: true,
      ...(activeChallengeId ? { activeChallengeId } : {}),
      lastSavedAt: Date.now(),
      executionCount: 0,
    };
    setLearnerBranch(branch);
    saveLearnerBranch(branch);
    publishInstructorPointer(undefined);
    dispatch({ type: 'FORK', baseTime });
  }, [branchScopeId]);

  // Branch recovery on mount
  useEffect(() => {
    try {
      const last = loadLastBranchForLesson(branchScopeId);
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
  }, [branchScopeId]);

  useEffect(() => {
    if (!showBranchRecovery) return;
    branchRecoveryFirstActionRef.current?.focus();
  }, [showBranchRecovery]);

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
    setPendingChallengeId(null);
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
          onPositionChangeRef.current?.(current);
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
        forkLearnerBranch(base, challenge.id);
        dispatch({ type: 'CHALLENGE_TRIGGER', challengeId: challenge.id, baseTime: base });
      },
      onPlaybackStateChange: (status) => {
        setPlaybackStatus(status);
        setCurrentTimeMs(timeRef.current);
        if (status === 'playing') setAwaitingStart(false);
        if (status === 'playing') dispatch({ type: 'PLAY' });
        if (status === 'paused') {
          dispatch({ type: 'PAUSE' });
          onPositionChangeRef.current?.(timeRef.current);
        }
        if (status === 'ended') {
          if (lessonData.id === 'fundamentos-01' && !closureConfirmedRef.current) {
            setShowClosure(true);
            return;
          }
          dispatch({ type: 'COMPLETE' });
        }
      },
      onRunTriggered: () => {
        // During tape, execute the active output only when not forked.
        if (!isForkedRef.current) {
          if (lessonData.executionMode === 'logic') void logicRunnerRef.current?.run();
          else void previewRef.current?.reloadPreview();
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
      flushBranchSave(branchScopeId);
      engine.destroy();
      engineRef.current = null;
      publishInstructorPointer(undefined);
    };
  }, [lessonData.id, language]);

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

  const handleExplainOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus();
    setIsExplainOpen(true);
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
    flushBranchSave(branchScopeId);
    clearBranchesForLesson(branchScopeId);
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
      const restoredWorkspace = cloneWorkspace(reconstructed.workspace);
      workspaceRef.current = restoredWorkspace;
      previewReloadAfterWorkspaceRef.current = true;
      setWorkspace(restoredWorkspace);
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
      flushBranchSave(branchScopeId);
      clearBranchesForLesson(branchScopeId);
      setLearnerBranch(null);
      setHasPendingEdits(false);
    } else {
      flushBranchSave(branchScopeId);
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
    // A result only describes the exact workspace that was evaluated. As soon as
    // the learner edits again, require a fresh check instead of showing stale green tests.
    setValidationResult(null);
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
            id: `branch-${branchScopeId}-${Date.now()}`,
            lessonId: branchScopeId,
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
    if (isLogicMode) void logicRunnerRef.current?.run();
    else void previewRef.current?.reloadPreview();
  };

  // Validate active challenge
  const handleValidateChallenge = async () => {
    if (!activeChallenge) return;
    if (isLogicMode) {
      await logicRunnerRef.current?.run();
    } else {
      await previewRef.current?.reloadPreview();
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    const iframe = isLogicMode ? null : previewRef.current?.getIframeElement();
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
    previewReloadAfterWorkspaceRef.current = true;
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
    const reconstructed = reconstructWorkspaceAt(
      lessonData.initialWorkspace,
      lessonData.events,
      lessonData.snapshots,
      skipTime
    );
    const restoredWorkspace = cloneWorkspace(reconstructed.workspace);
    flushBranchSave(branchScopeId);
    clearBranchesForLesson(branchScopeId);
    isForkedRef.current = false;
    dispatch({ type: 'CHALLENGE_SKIP' });
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setIsChallengeMinimized(false);
    setValidationResult(null);
    setHasPendingEdits(false);
    workspaceRef.current = restoredWorkspace;
    previewReloadAfterWorkspaceRef.current = true;
    setWorkspace(restoredWorkspace);

    if (engineRef.current) {
      engineRef.current.seek(skipTime);
      engineRef.current.play();
    }
  };

  const handleContinueAfterChallenge = () => {
    const nextTime = (activeChallenge?.timestamp || timeRef.current) + 1000;
    const reconstructed = reconstructWorkspaceAt(
      lessonData.initialWorkspace,
      lessonData.events,
      lessonData.snapshots,
      nextTime
    );
    const restoredWorkspace = cloneWorkspace(reconstructed.workspace);
    flushBranchSave(branchScopeId);
    clearBranchesForLesson(branchScopeId);
    isForkedRef.current = false;
    dispatch({ type: 'CHALLENGE_CONTINUE' });
    setLearnerBranch(null);
    setActiveChallenge(null);
    setIsChallengeDrawerOpen(false);
    setIsChallengeMinimized(false);
    setValidationResult(null);
    setHasPendingEdits(false);
    workspaceRef.current = restoredWorkspace;
    previewReloadAfterWorkspaceRef.current = true;
    setWorkspace(restoredWorkspace);

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
    setPendingChallengeId(null);
    if (isForkedRef.current && hasPendingEdits) {
      setPendingSeekMs(targetMs);
      return;
    }
    if (isForkedRef.current) {
      // Discard branch without pending edits
      flushBranchSave(branchScopeId);
      clearBranchesForLesson(branchScopeId);
      isForkedRef.current = false;
      dispatch({ type: 'DISCARD_BRANCH', baseTime: targetMs });
      setLearnerBranch(null);
      setActiveChallenge(null);
      setIsChallengeDrawerOpen(false);
      setHasPendingEdits(false);
    }
    engineRef.current?.seek(targetMs);
  };

  const activateChallengeFromTimeline = (challenge: ScrimChallenge) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.seek(challenge.timestamp);
    engine.markChallengeTriggered(challenge.id);
    engine.pause();
    setActiveChallenge(challenge);
    setIsChallengeDrawerOpen(true);
    setIsChallengeMinimized(false);
    setValidationResult(null);
    forkLearnerBranch(challenge.timestamp, challenge.id);
    dispatch({ type: 'CHALLENGE_TRIGGER', challengeId: challenge.id, baseTime: challenge.timestamp });
  };

  const handleChallengeSeek = (challenge: ScrimChallenge) => {
    if (isForkedRef.current && hasPendingEdits) {
      setPendingSeekMs(challenge.timestamp);
      setPendingChallengeId(challenge.id);
      return;
    }
    if (isForkedRef.current) {
      flushBranchSave(branchScopeId);
      clearBranchesForLesson(branchScopeId);
      isForkedRef.current = false;
      dispatch({ type: 'DISCARD_BRANCH', baseTime: challenge.timestamp });
      setLearnerBranch(null);
      setActiveChallenge(null);
      setIsChallengeDrawerOpen(false);
      setHasPendingEdits(false);
    }
    activateChallengeFromTimeline(challenge);
  };

  const handleDiscardAndSeek = () => {
    if (pendingSeekMs !== null) {
      const target = pendingSeekMs;
      setPendingSeekMs(null);
      flushBranchSave(branchScopeId);
      clearBranchesForLesson(branchScopeId);
      isForkedRef.current = false;
      dispatch({ type: 'DISCARD_BRANCH', baseTime: target });
      setLearnerBranch(null);
      setActiveChallenge(null);
      setIsChallengeDrawerOpen(false);
      setHasPendingEdits(false);
      const challenge = pendingChallengeId
        ? lessonData.challenges.find((candidate) => candidate.id === pendingChallengeId)
        : undefined;
      setPendingChallengeId(null);
      if (challenge) activateChallengeFromTimeline(challenge);
      else engineRef.current?.seek(target);
    }
  };

  const handleKeepEditing = () => {
    setPendingSeekMs(null);
    setPendingChallengeId(null);
  };

  const handleRestoreBranch = () => {
    const last = loadLastBranchForLesson(branchScopeId);
    if (!last) {
      setShowBranchRecovery(false);
      return;
    }
    try {
      const restoredWorkspace = cloneWorkspace(last.workspace);
      workspaceRef.current = restoredWorkspace;
      previewReloadAfterWorkspaceRef.current = true;
      setWorkspace(restoredWorkspace);
      setLearnerBranch(last);
      isForkedRef.current = true;
      dispatch({ type: 'RESTORE_BRANCH', baseTime: last.baseTime, challengeId: last.activeChallengeId || null });
      if (last.activeChallengeId) {
        const ch = lessonData.challenges.find((c) => c.id === last.activeChallengeId) || null;
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
    flushBranchSave(branchScopeId);
    clearBranchesForLesson(branchScopeId);
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
    previewReloadAfterWorkspaceRef.current = true;
    setWorkspace(reconstructed);
    setCurrentTimeMs(0);
    timeRef.current = 0;
    setAwaitingStart(true);
    engineRef.current?.seek(0);
    engineRef.current?.pause();
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;
  const visibleFiles = isLogicMode
    ? Object.fromEntries(Object.entries(workspace.files).filter(([, file]) =>
        file.language === 'javascript'
        || file.language === 'typescript'
        || file.language === 'json'
        || /\.(?:js|jsx|ts|tsx|json)$/i.test(file.name)))
    : workspace.files;

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
          {lessonData.languageVariants && onLanguageChange && (
            <LanguageSelector
              value={language}
              onChange={onLanguageChange}
              disabled={playbackStatus === 'playing'}
              compact
            />
          )}
          <ThemeToggle />
          {!isLogicMode && (
            <button
              onClick={() => setIsFloatingBrowser(!isFloatingBrowser)}
              className="neu-pill-btn"
              aria-label={isFloatingBrowser ? 'Fijar vista al lado' : 'Soltar vista flotante'}
              title={isFloatingBrowser ? 'Vista flotante' : 'Vista al lado'}
            >
              {isFloatingBrowser ? <Pin size={13} /> : <PinOff size={13} />}
              <span>{isFloatingBrowser ? 'Flotante' : 'Al lado'}</span>
            </button>
          )}
          <button
            onClick={handleExplainOpen}
            disabled={awaitingStart || showBranchRecovery}
            className="btn-explain neu-pill-btn disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Explicar lección"
          >
            <Lightbulb size={14} />
            <span>Explicar</span>
          </button>

          {playerState.isForked && (
            <div className="flex items-center gap-1.5">
              <span className="category-tag">
                <GitBranch size={12} style={{ display: 'inline', marginRight: 4 }} />
                Editando
              </span>
              <button onClick={handleReturnToLesson} className="neu-pill-btn" aria-label="Volver al contenido de la lección" title="Volver al contenido de la lección">
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
      {awaitingStart && !showBranchRecovery && !playerState.isForked && !activeChallenge && (
        <div
          className="lesson-start-gate"
          onClick={startPlayback}
        >
          <span className="lesson-start-kicker">
            {isSilentLesson ? 'Clase visual guiada' : 'Clase con explicación'}
          </span>
          <h2 className="lesson-start-title">{lessonData.title}</h2>
          <p className="lesson-start-hint">
            {isSilentLesson
              ? 'Lee los subtítulos mientras el editor cambia, señala ideas y construye el ejemplo paso a paso.'
              : 'El instructor escribe, señala y explica. Para oírlo y ver el código moverse, pulsa aquí.'}
          </p>
          <section className="lesson-start-objectives" aria-labelledby="lesson-objectives-title">
            <h3 id="lesson-objectives-title">Al terminar podrás</h3>
            <ul>
              {lessonData.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </section>
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
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Continuar lección">
          <div className="modal-dialog bg-[#171b24] text-slate-100 border-2 border-slate-500 rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>¿Cómo quieres continuar?</h3>
            <p className="text-sm text-slate-300 mt-2">Puedes continuar desde donde lo dejaste la última vez o comenzar la lección desde cero.</p>
            <div className="flex flex-col gap-2 mt-4">
              <button ref={branchRecoveryFirstActionRef} onClick={handleRestoreBranch} className="w-full neu-pill-btn btn-brand" aria-label="Continuar donde lo dejé">Continuar donde lo dejé</button>
              <button onClick={handleDiscardBranchRecovery} className="w-full neu-pill-btn" aria-label="Comenzar lección desde cero">Comenzar lección desde cero</button>
            </div>
          </div>
        </div>
      )}

      {pendingSeekMs !== null && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Cambiar de momento">
          <div className="modal-dialog bg-[#171b24] text-slate-100 border-2 border-slate-500 rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold">¿Ir a otro momento de la lección?</h3>
            <p className="text-sm text-slate-300 mt-2">Tienes cambios sin guardar. Puedes descartarlos para cambiar de momento o seguir editando aquí.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={handleDiscardAndSeek} className="flex-1 neu-pill-btn bg-rose-100" aria-label="Descartar cambios e ir">Descartar cambios e ir</button>
              <button onClick={handleKeepEditing} className="flex-1 neu-pill-btn btn-brand" aria-label="Seguir editando">Seguir editando</button>
            </div>
          </div>
        </div>
      )}

      {showReturnConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Volver a la lección">
          <div className="modal-dialog bg-[#171b24] text-slate-100 border-2 border-slate-500 rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold">¿Volver al contenido de la lección?</h3>
            <p className="text-sm text-slate-300 mt-2">Al volver se descartarán los cambios que hiciste mientras practicabas.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => doReturnToTape(learnerBranch?.baseTime ?? timeRef.current)} className="flex-1 neu-pill-btn btn-brand" aria-label="Volver y descartar cambios">Volver y descartar cambios</button>
              <button onClick={() => setShowReturnConfirm(false)} className="flex-1 neu-pill-btn" aria-label="Seguir editando">Seguir editando</button>
            </div>
          </div>
        </div>
      )}

      {pendingNavigation && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Salir con cambios">
          <div className="modal-dialog bg-[#171b24] text-slate-100 border-2 border-slate-500 rounded-xl p-5 max-w-md w-full shadow-[4px_4px_0_#000]">
            <h3 className="font-bold">¿Salir de esta pantalla?</h3>
            <p className="text-sm text-slate-300 mt-2">Tienes cambios sin guardar. Puedes guardarlos para continuar después o descartarlos antes de salir.</p>
            <div className="flex flex-col gap-2 mt-4">
              <button onClick={() => confirmNavigation('save')} className="w-full neu-pill-btn btn-brand" aria-label="Guardar cambios y salir">Guardar cambios y salir</button>
              <button onClick={() => confirmNavigation('discard')} className="w-full neu-pill-btn bg-slate-100 text-slate-900 border-rose-300" aria-label="Descartar cambios y salir">Descartar cambios y salir</button>
              <button onClick={cancelNavigation} className="w-full neu-pill-btn" aria-label="Seguir aquí">Seguir aquí</button>
            </div>
          </div>
        </div>
      )}

      {/* One global pointer crosses editor, files and preview without teleporting. */}
      <InstructorCursor containerType="global" />

      {/* Main Workspace using CSS Grid System (allocating ≥80% viewport to editor & preview) */}
      <main className="workspace-container">
        {showFileTree && (
          <aside className="files-sidebar">
            <FileTree
              files={visibleFiles}
              activeFilePath={workspace.activeFilePath}
              onFileSelect={(path) => {
                setWorkspace((prev) => ({ ...prev, activeFilePath: path }));
              }}
              onFileCreate={
                playerState.isForked
                  ? (file) => {
                      forkLearnerBranch(currentTimeMs);
                      setValidationResult(null);
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
                setValidationResult(null);
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

        <section className={`lesson-stage ${isLogicMode ? 'logic-stage' : ''}`}>
          <div className={`editor-window-wrapper ${!isLogicMode && isFloatingBrowser ? 'has-floating-preview' : ''}`}>
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

                {(Object.values(visibleFiles) as WorkspaceFile[]).map((f) => (
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
                workspaceFiles={workspace.files}
                readOnly={!playerState.isForked && playbackStatus === 'playing'}
                lessonId={lessonData.id}
                onCodeChange={handleCodeChange}
                instructorCursor={workspace.cursorPosition}
              />

              {activeSubtitle && showCaptions && (
                <div className="caption-overlay absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[90%] pointer-events-none">
                  <div className="caption-chip">
                    <Volume2 className="h-3.5 w-3.5 shrink-0" />
                    <p>{activeSubtitle}</p>
                  </div>
                </div>
              )}

              <ConceptSlideInset lessonTitle={lessonData.title} concepts={lessonData.concepts} />

            </div>
          </div>

          {!isLogicMode && isFloatingBrowser && (
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

          {!isLogicMode && !isFloatingBrowser && (
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
          {isLogicMode && (
            <LogicRunnerPanel
              key={`${lessonData.id}-logic`}
              ref={logicRunnerRef}
              workspace={workspace}
              language={language}
              packages={lessonData.runtimePackages}
              onRunClick={handleManualRun}
            />
          )}
        </section>
      </main>

      {/* Closure pedagógico */}
      {showClosure && !closureConfirmed && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#171b24] text-slate-100 border-2 border-slate-500 rounded-xl shadow-[4px_4px_0_#000] p-4 max-w-lg w-[90%]">
          <h4 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>¿Ejecutaste tus dos mensajes?</h4>
          <p className="text-xs text-slate-300 mt-1">Abre la consola y comprueba que los dos textos aparecen en el mismo orden que tus instrucciones. Después confirma para completar la clase.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleClosureConfirm} className="flex-1 neu-pill-btn btn-brand text-sm" aria-label="He ejecutado mi programa, completar clase">He ejecutado mi programa</button>
            <button
              onClick={() => isLogicMode ? void logicRunnerRef.current?.run() : void previewRef.current?.reloadPreview()}
              className="neu-pill-btn text-sm"
              aria-label={isLogicMode ? 'Ejecutar lógica de nuevo' : 'Recargar vista previa'}
            >
              {isLogicMode ? 'Ejecutar de nuevo' : 'Recargar'}
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-50 border-2 border-emerald-700 rounded-xl shadow-[4px_4px_0_#000] p-3 flex items-center gap-3 max-w-lg w-[90%]">
          <span className="text-emerald-700 font-bold text-sm">✓ Clase completada</span>
          <button onClick={handleRepeatFromEnd} className="ml-auto neu-pill-btn text-xs" aria-label="Repetir desde el inicio">Repetir</button>
          {onNextLesson && <button onClick={onNextLesson} className="neu-pill-btn btn-brand text-xs" aria-label="Siguiente lección">Siguiente</button>}
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
        onToggleMute={isSilentLesson ? undefined : toggleMute}
        onVolumeChange={isSilentLesson ? undefined : handleVolumeChange}
        onToggleCaptions={toggleCaptions}
        onPlay={startPlayback}
        onPause={() => {
          engineRef.current?.pause();
        }}
        onSeek={handleSeek}
        onChallengeSeek={handleChallengeSeek}
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
