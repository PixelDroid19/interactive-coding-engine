import { ScrimChallenge, ScrimLessonData, WorkspaceSnapshot } from '../types/scrim';
import { AudioNarrator } from './audioNarrator';
import { HighPrecisionSyncEngine, SyncEngineCallbacks, SyncTelemetry } from './syncEngine';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'ended';

export interface PlaybackEngineCallbacks {
  onWorkspaceChange: (ws: WorkspaceSnapshot) => void;
  onTimeUpdate: (currentMs: number, durationMs: number) => void;
  onPointerChange: (pointer?: { x: number; y: number; targetArea: 'editor' | 'preview' | 'files'; clicked?: boolean }) => void;
  onChallengeTrigger: (challenge: ScrimChallenge) => void;
  onPlaybackStateChange: (status: PlaybackStatus) => void;
  onSubtitleChange?: (text: string | null) => void;
  onRunTriggered?: () => void;
  onCompleted?: () => void;
  onSyncTelemetry?: (telemetry: SyncTelemetry) => void;
}

export class PlaybackEngine {
  private lessonData: ScrimLessonData | null = null;
  private syncEngine: HighPrecisionSyncEngine | null = null;
  private audioNarrator: AudioNarrator;
  private callbacks: PlaybackEngineCallbacks;
  private isMuted = false;
  private volume = 0.5;
  private playbackRate = 1.0;

  constructor(callbacks: PlaybackEngineCallbacks) {
    this.callbacks = callbacks;
    this.audioNarrator = new AudioNarrator((sub) => {
      this.callbacks.onSubtitleChange?.(sub);
    });
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.audioNarrator.setMuted(muted);
  }

  public setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.audioNarrator.setVolume(this.volume);
  }

  public getVolume(): number {
    return this.audioNarrator.getVolume();
  }

  public getIsMuted(): boolean {
    return this.audioNarrator.getIsMuted();
  }

  public loadLesson(lesson: ScrimLessonData, startAtMs = 0): void {
    this.stop();
    this.lessonData = lesson;

    // Load audio track into narrator
    this.audioNarrator.loadTrack(lesson.audioTrack);
    this.audioNarrator.setPlaybackRate(this.playbackRate);
    this.audioNarrator.setMuted(this.isMuted);
    this.audioNarrator.setVolume(this.volume);

    const syncCallbacks: SyncEngineCallbacks = {
      onWorkspaceChange: this.callbacks.onWorkspaceChange,
      onTimeUpdate: this.callbacks.onTimeUpdate,
      onPointerChange: this.callbacks.onPointerChange,
      onChallengeTrigger: this.callbacks.onChallengeTrigger,
      onPlaybackStateChange: this.callbacks.onPlaybackStateChange,
      onSubtitleChange: this.callbacks.onSubtitleChange,
      onRunTriggered: this.callbacks.onRunTriggered,
      onCompleted: this.callbacks.onCompleted,
      onSyncTelemetry: this.callbacks.onSyncTelemetry,
    };

    if (this.syncEngine) {
      this.syncEngine.destroy();
    }

    this.syncEngine = new HighPrecisionSyncEngine(
      lesson.initialWorkspace,
      lesson.events,
      lesson.snapshots,
      lesson.challenges,
      lesson.durationMs,
      this.audioNarrator,
      syncCallbacks
    );

    this.syncEngine.setPlaybackRate(this.playbackRate);

    // Reconstruct and seek to starting time
    const initialTime = Math.min(Math.max(0, startAtMs), lesson.durationMs);
    this.syncEngine.seek(initialTime);
  }

  public play(): void {
    if (!this.syncEngine || !this.lessonData) return;
    this.syncEngine.play();
  }

  public pause(): void {
    this.syncEngine?.pause();
  }

  public stop(): void {
    this.syncEngine?.stop();
  }

  public seek(targetMs: number): void {
    this.syncEngine?.seek(targetMs);
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    this.audioNarrator.setPlaybackRate(rate);
    this.syncEngine?.setPlaybackRate(rate);
  }

  public setFramePerfectMode(enabled: boolean): void {
    this.syncEngine?.setFramePerfectMode(enabled);
  }

  public getIsFramePerfect(): boolean {
    return this.syncEngine?.getIsFramePerfect() ?? true;
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public getCurrentTime(): number {
    return this.syncEngine?.getPresentationTime() || 0;
  }

  public getDuration(): number {
    return this.lessonData?.durationMs || 0;
  }

  public getStatus(): PlaybackStatus {
    return this.syncEngine?.getStatus() || 'idle';
  }

  public getTelemetry(): SyncTelemetry | null {
    return this.syncEngine?.getTelemetry() || null;
  }

  public destroy(): void {
    this.syncEngine?.destroy();
    this.syncEngine = null;
    this.audioNarrator.destroy();
  }
}
