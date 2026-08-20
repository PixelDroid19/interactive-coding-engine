import {
  AudioTrackInfo,
  ScrimChallenge,
  ScrimEvent,
  ScrimLessonData,
  WorkspaceFile,
  WorkspaceSnapshot,
} from '../types/scrim';
import { cloneWorkspace, generateSnapshots } from './eventLog';

type Timed<T> = T & { at?: number };

export type LessonBeat = Timed<
  | { type: 'chapter'; title: string }
  | { type: 'speak'; text: string; holdMs?: number }
  | { type: 'write'; filePath: string; content: string; mode?: 'replace' | 'append' }
  | { type: 'switch'; filePath: string }
  | { type: 'run' }
  | { type: 'pause'; ms: number }
  | { type: 'pointer'; x: number; y: number; targetArea: 'editor' | 'preview' | 'files'; clicked?: boolean }
  | {
      type: 'gesture';
      points: { x: number; y: number; targetArea: 'editor' | 'preview' | 'files'; clicked?: boolean }[];
      durationMs?: number;
    }
  | { type: 'challenge'; challenge: Omit<ScrimChallenge, 'timestamp'> }
  | { type: 'workspace'; files: Record<string, WorkspaceFile>; activeFilePath: string }
>;

export interface CompileLessonInput {
  id: string;
  title: string;
  description: string;
  templateId?: ScrimLessonData['templateId'];
  initialWorkspace: WorkspaceSnapshot;
  beats: LessonBeat[];
  concepts?: string[];
  teachNotes?: { title: string; body: string }[];
  author?: ScrimLessonData['author'];
  audioUrl?: string;
  language?: string;
  durationMs?: number;
}

export function file(path: string, content: string, language?: WorkspaceFile['language']): WorkspaceFile {
  const name = path.split('/').pop() || path;
  const inferred: WorkspaceFile['language'] =
    language ||
    (name.endsWith('.css')
      ? 'css'
      : name.endsWith('.html')
        ? 'html'
        : name.endsWith('.json')
          ? 'json'
          : name.endsWith('.ts') || name.endsWith('.tsx')
            ? 'typescript'
            : 'javascript');
  return { name, path, content, language: inferred };
}

export function workspaceOf(
  activeFilePath: string,
  files: Record<string, WorkspaceFile>
): WorkspaceSnapshot {
  return { files, activeFilePath };
}

export function estimateSpeechMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = Math.max(1, (text.match(/[.!?…]/g) || []).length);
  return Math.max(3200, Math.round(words * 580) + sentences * 380 + 900);
}

function chunkForTyping(text: string): string[] {
  if (!text) return [];
  const lines = text.split(/(?<=\n)/);
  const chunks: string[] = [];
  for (const line of lines) {
    if (line.length <= 56) {
      chunks.push(line);
      continue;
    }
    let remaining = line;
    while (remaining.length > 56) {
      let cut = remaining.lastIndexOf(' ', 56);
      if (cut < 24) cut = 56;
      chunks.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }
    if (remaining) chunks.push(remaining);
  }
  return chunks.filter((chunk) => chunk.length > 0);
}

function typingMs(chunk: string): number {
  const extra = (chunk.match(/\n/g) || []).length * 180;
  return Math.max(280, chunk.length * 52 + extra);
}

function cursorFromContent(content: string): { line: number; ch: number } {
  const lines = content.split('\n');
  return { line: lines.length, ch: lines[lines.length - 1].length };
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function compileLesson(input: CompileLessonInput): ScrimLessonData {
  const workspace = cloneWorkspace(input.initialWorkspace);
  const events: ScrimEvent[] = [];
  const narrationScript: { timestamp: number; text: string }[] = [];
  const chapters: { timestamp: number; title: string }[] = [];
  const challenges: ScrimChallenge[] = [];
  let t = 450;
  let n = 0;
  const nextId = () => `e${++n}`;

  for (const beat of input.beats) {
    if (typeof beat.at === 'number') {
      t = Math.max(0, beat.at);
    }
    switch (beat.type) {
      case 'chapter': {
        chapters.push({ timestamp: t, title: beat.title });
        events.push({ id: nextId(), timestamp: t, type: 'chapter-marker', title: beat.title });
        t += 320;
        break;
      }
      case 'speak': {
        narrationScript.push({ timestamp: t, text: beat.text });
        t += beat.holdMs ?? estimateSpeechMs(beat.text);
        break;
      }
      case 'switch': {
        if (workspace.files[beat.filePath]) {
          workspace.activeFilePath = beat.filePath;
          events.push({ id: nextId(), timestamp: t, type: 'file-switch', filePath: beat.filePath });
          t += 380;
        }
        break;
      }
      case 'pointer': {
        events.push({
          id: nextId(),
          timestamp: t,
          type: 'pointer-move',
          x: beat.x,
          y: beat.y,
          targetArea: beat.targetArea,
          clicked: beat.clicked,
        });
        t += beat.clicked ? 480 : 260;
        break;
      }
      case 'gesture': {
        const points = beat.points;
        const duration = Math.max(160, beat.durationMs ?? 720);
        if (points.length === 0) break;
        for (let i = 0; i < points.length; i++) {
          const u = points.length === 1 ? 0 : i / (points.length - 1);
          events.push({
            id: nextId(),
            timestamp: t + u * duration,
            type: 'pointer-move',
            x: clampPct(points[i].x),
            y: clampPct(points[i].y),
            targetArea: points[i].targetArea,
            clicked: points[i].clicked,
          });
        }
        t += duration;
        break;
      }
      case 'pause': {
        t += beat.ms;
        break;
      }
      case 'run': {
        events.push({ id: nextId(), timestamp: t, type: 'run-code' });
        t += 720;
        break;
      }
      case 'write': {
        const currentFile = workspace.files[beat.filePath];
        if (!currentFile) break;
        if (workspace.activeFilePath !== beat.filePath) {
          workspace.activeFilePath = beat.filePath;
          events.push({ id: nextId(), timestamp: t, type: 'file-switch', filePath: beat.filePath });
          t += 260;
        }

        const nextContent = beat.mode === 'append' ? currentFile.content + beat.content : beat.content;
        const canAppend =
          beat.mode === 'append' ||
          (beat.mode !== 'replace' && nextContent.startsWith(currentFile.content));
        const suffix = canAppend ? nextContent.slice(currentFile.content.length) : null;

        if (suffix && suffix.length > 0) {
          const chunks = chunkForTyping(suffix);
          let running = currentFile.content;
          for (const chunk of chunks) {
            const from = running.length;
            running += chunk;
            currentFile.content = running;
            events.push({
              id: nextId(),
              timestamp: t,
              type: 'code-change',
              filePath: beat.filePath,
              changes: [{ from, to: from, text: chunk }],
              fullContent: running,
            });
            workspace.cursorPosition = cursorFromContent(running);
            events.push({
              id: nextId(),
              timestamp: t + 30,
              type: 'cursor-move',
              filePath: beat.filePath,
              position: { ...workspace.cursorPosition },
            });
            t += typingMs(chunk);
          }
        } else if (suffix === null) {
          const previousLength = currentFile.content.length;
          currentFile.content = nextContent;
          events.push({
            id: nextId(),
            timestamp: t,
            type: 'code-change',
            filePath: beat.filePath,
            changes: [{ from: 0, to: previousLength, text: nextContent }],
            fullContent: nextContent,
          });
          workspace.cursorPosition = cursorFromContent(nextContent);
          t += Math.min(3600, Math.max(640, typingMs(nextContent) * 0.28));
        }
        break;
      }
      case 'workspace': {
        const nextPaths = new Set(Object.keys(beat.files));
        for (const path of Object.keys(workspace.files)) {
          if (!nextPaths.has(path)) {
            events.push({ id: nextId(), timestamp: t, type: 'file-delete', filePath: path });
            delete workspace.files[path];
            t += 70;
          }
        }
        for (const [path, nextFile] of Object.entries(beat.files)) {
          if (!workspace.files[path]) {
            workspace.files[path] = { ...nextFile };
            events.push({ id: nextId(), timestamp: t, type: 'file-create', file: { ...nextFile } });
          } else {
            const previousLength = workspace.files[path].content.length;
            workspace.files[path] = { ...nextFile };
            events.push({
              id: nextId(),
              timestamp: t,
              type: 'code-change',
              filePath: path,
              changes: [{ from: 0, to: previousLength, text: nextFile.content }],
              fullContent: nextFile.content,
            });
          }
          t += 50;
        }
        workspace.activeFilePath = beat.activeFilePath;
        events.push({ id: nextId(), timestamp: t, type: 'file-switch', filePath: beat.activeFilePath });
        t += 360;
        break;
      }
      case 'challenge': {
        const challenge: ScrimChallenge = {
          ...beat.challenge,
          timestamp: t,
          autoPause: beat.challenge.autoPause !== false,
          allowSkip: beat.challenge.allowSkip !== false,
        };
        challenges.push(challenge);
        events.push({
          id: nextId(),
          timestamp: t,
          type: 'challenge-marker',
          challengeId: challenge.id,
          title: challenge.title,
          autoPause: challenge.autoPause !== false,
        });
        t += 1000;
        break;
      }
    }
  }

  const durationMs = input.durationMs ?? t + 1200;
  const audioTrack: AudioTrackInfo = {
    url: input.audioUrl,
    durationMs,
    language: input.language ?? 'es',
    narrationScript,
  };

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    templateId: input.templateId ?? 'vanilla-js',
    durationMs,
    initialWorkspace: cloneWorkspace(input.initialWorkspace),
    events,
    snapshots: generateSnapshots(input.initialWorkspace, events, 4000),
    audioTrack,
    challenges,
    chapters,
    concepts: input.concepts,
    teachNotes: input.teachNotes,
    author: input.author ?? { name: 'Kit', role: 'Instructor de fundamentos' },
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  };
}
