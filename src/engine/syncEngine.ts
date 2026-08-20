import {
  ScrimChallenge,
  ScrimEvent,
  SnapshotPoint,
  WorkspaceSnapshot,
} from '../types/scrim';
import { applyEventToWorkspace, cloneWorkspace, reconstructWorkspaceAt } from './eventLog';
import { AudioNarrator } from './audioNarrator';
import { CursorTrack, poseFromTrack } from './cursor/cursorTrack';

export type SyncState = 'locked' | 'slewing' | 'resyncing' | 'stalled';

export interface SyncTelemetry {
  audioTimeMs: number;
  presentationTimeMs: number;
  driftMs: number;
  smoothedDriftMs: number;
  syncState: SyncState;
  activeClockSource: 'hardware-audio' | 'speech-synthesis' | 'synthetic-timeline';
  eventsExecutedCount: number;
  eventsInLastFrame: number;
  fps: number;
  isFramePerfect: boolean;
}

export interface SyncEngineCallbacks {
  onWorkspaceChange: (ws: WorkspaceSnapshot) => void;
  onTimeUpdate: (currentMs: number, durationMs: number) => void;
  onPointerChange: (pointer?: { x: number; y: number; targetArea: 'editor' | 'preview' | 'files'; clicked?: boolean }) => void;
  onChallengeTrigger: (challenge: ScrimChallenge) => void;
  onPlaybackStateChange: (status: 'idle' | 'playing' | 'paused' | 'ended') => void;
  onSubtitleChange?: (text: string | null) => void;
  onRunTriggered?: () => void;
  onCompleted?: () => void;
  onSyncTelemetry?: (telemetry: SyncTelemetry) => void;
}

/**
 * High-Precision Frame-Perfect Synchronization Engine
 *
 * Employs a requestAnimationFrame polling loop coupled with a phase-locked loop (PLL)
 * to continually query the audio hardware clock and apply all sub-second event mutations
 * in exact chronological sequence within each frame's time window.
 */
export class HighPrecisionSyncEngine {
  private initialWorkspace: WorkspaceSnapshot;
  private currentWorkspace: WorkspaceSnapshot;
  private events: ScrimEvent[] = [];
  private snapshots: SnapshotPoint[] = [];
  private challenges: ScrimChallenge[] = [];
  private durationMs = 0;

  private presentationTimeMs = 0;
  private lastProcessedEventIndex = -1;
  private playbackRate = 1.0;
  private status: 'idle' | 'playing' | 'paused' | 'ended' = 'idle';
  private isFramePerfect = true;

  private animationFrameId: number | null = null;
  private lastWallTime: number | null = null;

  // Drift Tracking & Phase-Locked Loop (PLL)
  private smoothedDriftMs = 0;
  private currentSyncState: SyncState = 'locked';
  private lastTelemetryEmitWallTime = 0;
  private frameCount = 0;
  private currentFps = 60;
  private lastFpsSampleTime = 0;
  private eventsExecutedTotal = 0;
  private eventsInLastFrame = 0;

  // Active state pointers
  private activePointer?: { x: number; y: number; targetArea: 'editor' | 'preview' | 'files'; clicked?: boolean };
  private cursorTrack: CursorTrack;
  private lastRunTimestamp = -1;
  private triggeredChallenges = new Set<string>();

  private audioNarrator: AudioNarrator;
  private callbacks: SyncEngineCallbacks;

  // Thresholds (in milliseconds)
  private static readonly DRIFT_LOCK_THRESHOLD = 15; // <= 15ms: In tight lock
  private static readonly DRIFT_SLEW_THRESHOLD = 120; // 15ms - 120ms: Smooth slew adjustment
  private static readonly DRIFT_HARD_SYNC_THRESHOLD = 120; // > 120ms: Hard resync snap
  private static readonly DRIFT_EMA_ALPHA = 0.25; // Exponential Moving Average smoothing factor

  constructor(
    initialWorkspace: WorkspaceSnapshot,
    events: ScrimEvent[],
    snapshots: SnapshotPoint[],
    challenges: ScrimChallenge[],
    durationMs: number,
    audioNarrator: AudioNarrator,
    callbacks: SyncEngineCallbacks
  ) {
    this.initialWorkspace = cloneWorkspace(initialWorkspace);
    this.currentWorkspace = cloneWorkspace(initialWorkspace);
    this.events = [...events].sort((a, b) => a.timestamp - b.timestamp);
    this.snapshots = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
    this.challenges = challenges || [];
    this.durationMs = durationMs;
    this.audioNarrator = audioNarrator;
    this.callbacks = callbacks;
    this.cursorTrack = CursorTrack.fromEvents(this.events);
  }

  public setFramePerfectMode(enabled: boolean): void {
    this.isFramePerfect = enabled;
  }

  public getIsFramePerfect(): boolean {
    return this.isFramePerfect;
  }

  public updateLessonData(
    initialWorkspace: WorkspaceSnapshot,
    events: ScrimEvent[],
    snapshots: SnapshotPoint[],
    challenges: ScrimChallenge[],
    durationMs: number
  ): void {
    this.initialWorkspace = cloneWorkspace(initialWorkspace);
    this.currentWorkspace = cloneWorkspace(initialWorkspace);
    this.events = [...events].sort((a, b) => a.timestamp - b.timestamp);
    this.snapshots = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
    this.challenges = challenges || [];
    this.durationMs = durationMs;
    this.cursorTrack = CursorTrack.fromEvents(this.events);
    this.triggeredChallenges.clear();
    this.lastProcessedEventIndex = -1;
    this.lastRunTimestamp = -1;
  }

  public play(fromMs?: number): void {
    if (fromMs !== undefined) {
      this.seek(fromMs);
    } else if (this.presentationTimeMs >= this.durationMs) {
      this.seek(0);
    }

    this.setStatus('playing');
    this.lastWallTime = performance.now();
    this.lastFpsSampleTime = this.lastWallTime;
    this.frameCount = 0;
    this.smoothedDriftMs = 0;

    this.audioNarrator.play(this.presentationTimeMs);
    this.startFrameLoop();
  }

  public pause(): void {
    this.setStatus('paused');
    this.stopFrameLoop();
    this.audioNarrator.pause();
  }

  public stop(): void {
    this.setStatus('idle');
    this.stopFrameLoop();
    this.audioNarrator.stop();
  }

  public seek(targetMs: number): void {
    const clamped = Math.max(0, Math.min(targetMs, this.durationMs));
    this.presentationTimeMs = clamped;
    this.smoothedDriftMs = 0;
    this.currentSyncState = 'locked';

    // Full state reconstruction at seek point
    this.reconstructFullStateAt(clamped);
    this.audioNarrator.seek(clamped);

    this.callbacks.onTimeUpdate(this.presentationTimeMs, this.durationMs);

    if (this.presentationTimeMs >= this.durationMs) {
      this.setStatus('ended');
      this.stopFrameLoop();
      this.callbacks.onCompleted?.();
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
    this.audioNarrator.setPlaybackRate(this.playbackRate);
  }

  public getPresentationTime(): number {
    return this.presentationTimeMs;
  }

  public getStatus(): 'idle' | 'playing' | 'paused' | 'ended' {
    return this.status;
  }

  public getTelemetry(): SyncTelemetry {
    const audioState = this.audioNarrator.getPreciseAudioTimeMs();
    return {
      audioTimeMs: audioState.timeMs,
      presentationTimeMs: this.presentationTimeMs,
      driftMs: audioState.timeMs - this.presentationTimeMs,
      smoothedDriftMs: this.smoothedDriftMs,
      syncState: this.currentSyncState,
      activeClockSource: audioState.source,
      eventsExecutedCount: this.eventsExecutedTotal,
      eventsInLastFrame: this.eventsInLastFrame,
      fps: this.currentFps,
      isFramePerfect: this.isFramePerfect,
    };
  }

  private setStatus(newStatus: 'idle' | 'playing' | 'paused' | 'ended'): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.callbacks.onPlaybackStateChange(newStatus);
    }
  }

  /**
   * High-Frequency requestAnimationFrame Loop:
   * Polls the audio clock on every display refresh (e.g. 60Hz / 120Hz / 144Hz)
   * and executes all events matching the current audio window [prevPresentationTime, nextPresentationTime]
   */
  private startFrameLoop(): void {
    this.stopFrameLoop();

    const frameStep = (now: number) => {
      if (this.status !== 'playing') return;

      if (this.lastWallTime !== null) {
        const deltaWallMs = now - this.lastWallTime;
        this.updateFps(now);

        // 1. Fetch high-precision master audio presentation clock
        const audioInfo = this.audioNarrator.getPreciseAudioTimeMs();
        const targetAudioMs = audioInfo.timeMs;

        // 2. Calculate time drift between audio and code presentation clock
        const rawDriftMs = targetAudioMs - this.presentationTimeMs;
        this.smoothedDriftMs =
          this.smoothedDriftMs * (1 - HighPrecisionSyncEngine.DRIFT_EMA_ALPHA) +
          rawDriftMs * HighPrecisionSyncEngine.DRIFT_EMA_ALPHA;

        const absDrift = Math.abs(rawDriftMs);

        // 3. Phase-Locked Loop (PLL) Drift Compensation
        let nextPresentationTimeMs = this.presentationTimeMs;

        if (audioInfo.isStalled) {
          // Audio is buffering / stalled: freeze presentation clock to preserve lock
          this.currentSyncState = 'stalled';
        } else if (absDrift >= HighPrecisionSyncEngine.DRIFT_HARD_SYNC_THRESHOLD) {
          // Significant desync detected (e.g. background tab wake, buffering recovery): hard snap
          this.currentSyncState = 'resyncing';
          nextPresentationTimeMs = targetAudioMs;
        } else if (absDrift >= HighPrecisionSyncEngine.DRIFT_LOCK_THRESHOLD) {
          // Moderate drift: apply smooth slew rate adjustment (±6% phase nudge)
          this.currentSyncState = 'slewing';
          const slewFactor = 1.0 + Math.max(-0.08, Math.min(0.08, rawDriftMs * 0.003));
          const deltaPlaybackMs = deltaWallMs * this.playbackRate * slewFactor;
          nextPresentationTimeMs += deltaPlaybackMs;
        } else {
          // Ultra-tight lock: apply sub-millisecond micro-drift correction
          this.currentSyncState = 'locked';
          const microSlew = 1.0 + rawDriftMs * 0.0008;
          const deltaPlaybackMs = deltaWallMs * this.playbackRate * microSlew;
          nextPresentationTimeMs += deltaPlaybackMs;
        }

        // Clamp within lesson bounds
        nextPresentationTimeMs = Math.min(nextPresentationTimeMs, this.durationMs);

        // 4. Check for Challenge Trigger crossings
        const challenge = this.checkChallengeCrossings(this.presentationTimeMs, nextPresentationTimeMs);
        if (challenge && challenge.autoPause) {
          this.presentationTimeMs = challenge.timestamp;
          this.triggeredChallenges.add(challenge.id);
          this.applyEventsIncremental(this.presentationTimeMs);
          this.interpolateSubframePointer(this.presentationTimeMs);
          this.pause();
          this.callbacks.onChallengeTrigger(challenge);
          return;
        }

        // 5. Frame-Perfect Window Event Polling:
        // Execute all events occurring within the window (presentationTimeMs, nextPresentationTimeMs]
        this.presentationTimeMs = nextPresentationTimeMs;
        this.applyEventsIncremental(this.presentationTimeMs);

        // 6. Sub-frame pointer interpolation for ultra-smooth 60/120fps motion
        this.interpolateSubframePointer(this.presentationTimeMs);

        // 7. Synchronize speech/subtitles with audio tick
        this.audioNarrator.onTimeTick(this.presentationTimeMs);

        // 8. Emit time updates & telemetry
        this.callbacks.onTimeUpdate(this.presentationTimeMs, this.durationMs);
        this.emitTelemetryIfDue(now, audioInfo.source, rawDriftMs);

        // 9. Check for lesson completion
        if (this.presentationTimeMs >= this.durationMs) {
          this.setStatus('ended');
          this.audioNarrator.pause();
          this.callbacks.onCompleted?.();
          return;
        }
      }

      this.lastWallTime = now;
      this.animationFrameId = requestAnimationFrame(frameStep);
    };

    this.animationFrameId = requestAnimationFrame(frameStep);
  }

  private stopFrameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.lastWallTime = null;
  }

  /**
   * Applies all recorded mutations within the current frame window in strict millisecond order.
   * Handles rapid code mutations, multi-file edits, and cursor shifts without dropping any events.
   */
  private applyEventsIncremental(targetTimeMs: number): void {
    if (this.events.length === 0) return;

    let hasWorkspaceMutated = false;
    let nextIndex = this.lastProcessedEventIndex + 1;
    let frameEventsCount = 0;

    while (nextIndex < this.events.length && this.events[nextIndex].timestamp <= targetTimeMs) {
      const ev = this.events[nextIndex];
      applyEventToWorkspace(this.currentWorkspace, ev);
      hasWorkspaceMutated = true;
      this.eventsExecutedTotal++;
      frameEventsCount++;

      if (ev.type === 'run-code') {
        if (ev.timestamp !== this.lastRunTimestamp) {
          this.lastRunTimestamp = ev.timestamp;
          this.callbacks.onRunTriggered?.();
        }
      }

      this.lastProcessedEventIndex = nextIndex;
      nextIndex++;
    }

    this.eventsInLastFrame = frameEventsCount;

    if (hasWorkspaceMutated) {
      this.callbacks.onWorkspaceChange(cloneWorkspace(this.currentWorkspace));
    }
  }

  /**
   * Reconstructs the entire workspace state using nearest snapshot + remaining events.
   * Used for random-access seeks, chapter jumps, or branch returns.
   */
  private reconstructFullStateAt(targetTimeMs: number): void {
    const result = reconstructWorkspaceAt(
      this.initialWorkspace,
      this.events,
      this.snapshots,
      targetTimeMs
    );

    this.currentWorkspace = cloneWorkspace(result.workspace);
    this.lastProcessedEventIndex = result.lastEventIndex;
    this.lastRunTimestamp = result.lastRunTimestamp ?? -1;
    this.cursorTrack.seekIndex(targetTimeMs);

    this.callbacks.onWorkspaceChange(this.currentWorkspace);
    this.interpolateSubframePointer(targetTimeMs);
    this.callbacks.onRunTriggered?.();
  }

  /**
   * Cursor pose is a pure function of presentation time. Seek jumps here
   * immediately; playback interpolates between pointer keyframes every rAF.
   */
  private interpolateSubframePointer(currentMs: number): void {
    const pose = poseFromTrack(this.cursorTrack, currentMs);
    this.activePointer = pose;
    this.callbacks.onPointerChange(pose);
  }

  private checkChallengeCrossings(prevMs: number, nextMs: number): ScrimChallenge | null {
    for (const challenge of this.challenges) {
      if (
        challenge.timestamp >= prevMs &&
        challenge.timestamp <= nextMs &&
        !this.triggeredChallenges.has(challenge.id)
      ) {
        return challenge;
      }
    }
    return null;
  }

  private updateFps(now: number): void {
    this.frameCount++;
    if (now - this.lastFpsSampleTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsSampleTime));
      this.frameCount = 0;
      this.lastFpsSampleTime = now;
    }
  }

  private emitTelemetryIfDue(now: number, source: 'hardware-audio' | 'speech-synthesis' | 'synthetic-timeline', rawDriftMs: number): void {
    if (now - this.lastTelemetryEmitWallTime >= 250) {
      this.lastTelemetryEmitWallTime = now;
      this.callbacks.onSyncTelemetry?.({
        audioTimeMs: this.presentationTimeMs + rawDriftMs,
        presentationTimeMs: this.presentationTimeMs,
        driftMs: Math.round(rawDriftMs * 10) / 10,
        smoothedDriftMs: Math.round(this.smoothedDriftMs * 10) / 10,
        syncState: this.currentSyncState,
        activeClockSource: source,
        eventsExecutedCount: this.eventsExecutedTotal,
        eventsInLastFrame: this.eventsInLastFrame,
        fps: this.currentFps,
        isFramePerfect: this.isFramePerfect,
      });
    }
  }

  public destroy(): void {
    this.stop();
    this.triggeredChallenges.clear();
  }
}
