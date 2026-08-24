import {
  AudioTrackInfo,
  ChallengeMarkerEvent,
  CodeChangeEvent,
  CursorMoveEvent,
  FileCreateEvent,
  FileDeleteEvent,
  FileRenameEvent,
  FileSwitchEvent,
  PointerMoveEvent,
  RunCodeEvent,
  ScrimChallenge,
  ScrimEvent,
  ScrimLessonData,
  SelectionChangeEvent,
  SnapshotPoint,
  WorkspaceFile,
  WorkspaceSnapshot,
} from '../types/scrim';
import { cloneWorkspace, generateSnapshots } from './eventLog';
import { saveStudioDraft } from './persistence';
import { CursorSampler } from './cursor/cursorSampler';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecorderCallbacks {
  onStatusChange: (status: RecorderStatus) => void;
  onTimeTick: (elapsedMs: number) => void;
  onEventRecorded: (event: ScrimEvent) => void;
}

export class RecorderEngine {
  private status: RecorderStatus = 'idle';
  private initialWorkspace: WorkspaceSnapshot;
  private currentWorkspace: WorkspaceSnapshot;
  private events: ScrimEvent[] = [];
  private challenges: ScrimChallenge[] = [];
  private startTime = 0;
  private pausedDuration = 0;
  private pauseStartTime = 0;
  private timerInterval: any = null;
  private callbacks: RecorderCallbacks;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioBlob: Blob | null = null;
  private audioMimeType = 'audio/webm';
  private lastDraftSaveTime = 0;
  private pointerSampler = new CursorSampler();

  constructor(initialWorkspace: WorkspaceSnapshot, callbacks: RecorderCallbacks) {
    this.initialWorkspace = cloneWorkspace(initialWorkspace);
    this.currentWorkspace = cloneWorkspace(initialWorkspace);
    this.callbacks = callbacks;
  }

  public async startRecording(withMicrophone = true): Promise<boolean> {
    if (this.status === 'recording') return true;

    this.events = [];
    this.challenges = [];
    this.audioChunks = [];
    this.audioBlob = null;
    this.pausedDuration = 0;
    this.pointerSampler.reset();

    if (withMicrophone && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'audio/webm';
        this.audioMimeType = supportedMime;

        this.mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMime });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };
        this.mediaRecorder.start(1000); // 1-second chunks
      } catch (err) {
        console.warn('Microphone access denied or unavailable. Recording session without mic audio:', err);
        this.mediaRecorder = null;
      }
    }

    this.startTime = performance.now();
    this.status = 'recording';
    this.callbacks.onStatusChange('recording');

    this.startTimer();
    return true;
  }

  public pauseRecording(): void {
    if (this.status !== 'recording') return;
    this.status = 'paused';
    this.pauseStartTime = performance.now();
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
    this.callbacks.onStatusChange('paused');
  }

  public resumeRecording(): void {
    if (this.status !== 'paused') return;
    this.pausedDuration += performance.now() - this.pauseStartTime;
    this.status = 'recording';
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
    this.callbacks.onStatusChange('recording');
  }

  public async stopRecording(): Promise<ScrimLessonData> {
    const finalDurationMs = this.getCurrentTimeMs();
    this.status = 'stopped';
    this.stopTimer();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: this.audioMimeType });
          // Stop media tracks
          this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
          resolve();
        };
        this.mediaRecorder.stop();
      });
    } else if (this.audioChunks.length > 0) {
      this.audioBlob = new Blob(this.audioChunks, { type: this.audioMimeType });
    }

    this.callbacks.onStatusChange('stopped');

    const snapshots = generateSnapshots(this.initialWorkspace, this.events, 5000);

    const lessonData: ScrimLessonData = {
      id: `scrim-custom-${Date.now()}`,
      title: 'Lección sin título',
      description: 'Grabada en el estudio',
      templateId: 'vanilla-js',
      durationMs: Math.max(1000, finalDurationMs),
      initialWorkspace: cloneWorkspace(this.initialWorkspace),
      events: [...this.events],
      snapshots,
      challenges: [...this.challenges],
      skillsIntroduced: [],
      skillsRequired: [],
      learningObjectives: ['Reproducir la clase grabada y completar sus retos.'],
      commonMistakes: [],
      audioTrack: this.audioBlob
        ? {
            audioBlob: this.audioBlob,
            mimeType: this.audioMimeType,
            durationMs: finalDurationMs,
          }
        : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return lessonData;
  }

  public cancelRecording(): void {
    this.status = 'stopped';
    this.stopTimer();

    const recorder = this.mediaRecorder;
    if (recorder) {
      const tracks = recorder.stream.getTracks();
      if (recorder.state !== 'inactive') recorder.stop();
      tracks.forEach((track) => track.stop());
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioBlob = null;
  }

  public getCurrentTimeMs(): number {
    if (this.status === 'idle') return 0;
    const now = this.status === 'paused' ? this.pauseStartTime : performance.now();
    return Math.max(0, Math.floor(now - this.startTime - this.pausedDuration));
  }

  // --- Recorder Event Ingestion ---

  public recordCodeChange(filePath: string, changes: { from: number; to: number; text: string }[], fullContent?: string): void {
    if (this.status !== 'recording') return;

    const event: CodeChangeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'code-change',
      filePath,
      changes,
      fullContent,
    };

    // Update internal workspace copy
    if (this.currentWorkspace.files[filePath]) {
      if (fullContent !== undefined) {
        this.currentWorkspace.files[filePath].content = fullContent;
      }
    }

    this.addEvent(event);
  }

  public recordFileSwitch(filePath: string): void {
    if (this.status !== 'recording') return;

    const event: FileSwitchEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'file-switch',
      filePath,
    };
    this.currentWorkspace.activeFilePath = filePath;
    this.addEvent(event);
  }

  public recordFileCreate(file: WorkspaceFile): void {
    if (this.status !== 'recording') return;

    const event: FileCreateEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'file-create',
      file: { ...file },
    };
    this.currentWorkspace.files[file.path] = { ...file };
    this.currentWorkspace.activeFilePath = file.path;
    this.addEvent(event);
  }

  public recordFileDelete(filePath: string): void {
    if (this.status !== 'recording') return;

    const event: FileDeleteEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'file-delete',
      filePath,
    };
    delete this.currentWorkspace.files[filePath];
    this.addEvent(event);
  }

  public recordFileRename(oldPath: string, newPath: string): void {
    if (this.status !== 'recording') return;

    const event: FileRenameEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'file-rename',
      oldPath,
      newPath,
    };
    if (this.currentWorkspace.files[oldPath]) {
      const f = this.currentWorkspace.files[oldPath];
      delete this.currentWorkspace.files[oldPath];
      f.path = newPath;
      f.name = newPath.split('/').pop() || newPath;
      this.currentWorkspace.files[newPath] = f;
    }
    this.addEvent(event);
  }

  public recordCursorMove(filePath: string, position: { line: number; ch: number }): void {
    if (this.status !== 'recording') return;

    const event: CursorMoveEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'cursor-move',
      filePath,
      position,
    };
    this.addEvent(event);
  }

  public recordSelectionChange(filePath: string, from: number, to: number): void {
    if (this.status !== 'recording') return;

    const event: SelectionChangeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'selection-change',
      filePath,
      from,
      to,
    };
    this.addEvent(event);
  }

  public recordPointerMove(x: number, y: number, targetArea: 'editor' | 'preview' | 'files', clicked = false): void {
    if (this.status !== 'recording') return;

    const timestamp = this.getCurrentTimeMs();
    if (
      !this.pointerSampler.shouldRecord({
        time: timestamp,
        x,
        y,
        targetArea,
        clicked,
      })
    ) {
      return;
    }

    const event: PointerMoveEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      type: 'pointer-move',
      x,
      y,
      targetArea,
      clicked,
    };
    this.addEvent(event);
  }

  public recordRunCode(): void {
    if (this.status !== 'recording') return;

    const event: RunCodeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.getCurrentTimeMs(),
      type: 'run-code',
    };
    this.addEvent(event);
  }

  public insertChallenge(challenge: ScrimChallenge): void {
    const currentMs = this.getCurrentTimeMs();
    const challengeWithTime: ScrimChallenge = {
      ...challenge,
      timestamp: currentMs,
    };
    this.challenges.push(challengeWithTime);

    const markerEvent: ChallengeMarkerEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: currentMs,
      type: 'challenge-marker',
      challengeId: challenge.id,
      title: challenge.title,
      autoPause: true,
    };
    this.addEvent(markerEvent);
  }

  private addEvent(event: ScrimEvent): void {
    this.events.push(event);
    this.callbacks.onEventRecorded(event);

    // Auto-save draft periodically
    const now = Date.now();
    if (now - this.lastDraftSaveTime > 3000) {
      this.lastDraftSaveTime = now;
      saveStudioDraft({
        initialWorkspace: this.initialWorkspace,
        events: this.events,
        challenges: this.challenges,
        savedAt: now,
      });
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.status === 'recording') {
        this.callbacks.onTimeTick(this.getCurrentTimeMs());
      }
    }, 100);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
