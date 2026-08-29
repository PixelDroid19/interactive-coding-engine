import {
  AudioTrackInfo,
  PointerMoveEvent,
  ScrimChallenge,
  ScrimEvent,
  ScrimLessonData,
  WorkspaceFile,
  WorkspaceSnapshot,
} from '../types/scrim';
import { cloneWorkspace, generateSnapshots } from './eventLog';
import { resolvePublishedAudioUrl } from '../config/r2Audio';

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
  executionMode?: ScrimLessonData['executionMode'];
  initialWorkspace: WorkspaceSnapshot;
  teachingFilePaths?: string[];
  beats: LessonBeat[];
  concepts?: string[];
  skillsIntroduced: string[];
  skillsRequired: string[];
  learningObjectives: string[];
  commonMistakes: string[];
  mentalModel?: string;
  frequentQuestions?: { question: string; answer: string }[];
  representations?: string[];
  transferPrompt?: string;
  masteryChecks?: string[];
  teachNotes?: { title: string; body: string }[];
  author?: ScrimLessonData['author'];
  audioUrl?: string;
  narrationMode?: ScrimLessonData['narrationMode'];
  language?: string;
  durationMs?: number;
  fitTimelineToDuration?: boolean;
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

type PointerSeed = Omit<PointerMoveEvent, 'id' | 'type'> & { priority: number };

const POINTER_WANDER_MS = 2_500;
const MIN_CROSS_AREA_MS = 1_600;
const EDITOR_ROUTE = [
  { x: 20, y: 18 },
  { x: 42, y: 28 },
  { x: 68, y: 44 },
  { x: 34, y: 62 },
  { x: 72, y: 74 },
];

/**
 * Lessons authored before the live pointer existed still need a complete route.
 * Build it from the same semantic actions the learner sees: files, narration,
 * typing, execution and the challenge hand-off.
 */
function buildInstructorRoute(
  events: ScrimEvent[],
  narrationScript: { timestamp: number; text: string }[],
  durationMs: number,
  initialWorkspace: WorkspaceSnapshot,
  nextId: () => string,
): PointerMoveEvent[] {
  const lastMoment = Math.max(1, durationMs - 1);
  const filePaths = Object.keys(initialWorkspace.files);
  const seeds: PointerSeed[] = [
    { timestamp: 0, x: 54, y: 16, targetArea: 'files', clicked: false, priority: 1 },
  ];

  narrationScript.forEach((cue, index) => {
    const point = EDITOR_ROUTE[index % EDITOR_ROUTE.length];
    seeds.push({
      timestamp: Math.min(lastMoment, Math.max(0, cue.timestamp)),
      x: point.x,
      y: point.y,
      targetArea: 'editor',
      clicked: false,
      priority: 1,
    });
  });

  for (const event of events) {
    const timestamp = Math.min(lastMoment, Math.max(0, event.timestamp));
    if (event.type === 'pointer-move') {
      seeds.push({ ...event, timestamp, priority: 5 });
      continue;
    }
    if (event.type === 'file-switch') {
      const fileIndex = Math.max(0, filePaths.indexOf(event.filePath));
      seeds.push({
        timestamp,
        x: 52,
        y: Math.min(82, 18 + fileIndex * 14),
        targetArea: 'files',
        clicked: true,
        priority: 4,
      });
      continue;
    }
    if (event.type === 'cursor-move') {
      seeds.push({
        timestamp,
        x: Math.min(82, 18 + event.position.ch * 1.35),
        y: Math.min(84, 10 + event.position.line * 4.8),
        targetArea: 'editor',
        clicked: false,
        priority: 3,
      });
      continue;
    }
    if (event.type === 'code-change') {
      const content = event.fullContent ?? '';
      const lines = content.split('\n');
      const lastLine = lines.at(-1) ?? '';
      seeds.push({
        timestamp,
        x: Math.min(82, 20 + lastLine.length * 1.1),
        y: Math.min(84, 10 + lines.length * 4.6),
        targetArea: 'editor',
        clicked: false,
        priority: 2,
      });
      continue;
    }
    if (event.type === 'run-code') {
      seeds.push({
        timestamp,
        x: 50,
        y: 18,
        targetArea: 'preview',
        clicked: true,
        priority: 4,
      });
      seeds.push({
        timestamp: Math.min(lastMoment, timestamp + 700),
        x: 58,
        y: 54,
        targetArea: 'preview',
        clicked: false,
        priority: 3,
      });
      continue;
    }
    if (event.type === 'challenge-marker') {
      seeds.push({
        timestamp,
        x: 76,
        y: 78,
        targetArea: 'editor',
        clicked: true,
        priority: 4,
      });
    }
  }

  const byTimestamp = new Map<number, PointerSeed>();
  for (const seed of seeds) {
    const timestamp = Math.round(seed.timestamp);
    const current = byTimestamp.get(timestamp);
    if (!current || seed.priority >= current.priority) {
      byTimestamp.set(timestamp, { ...seed, timestamp });
    }
  }
  const anchors = [...byTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp);
  const last = anchors.at(-1) ?? seeds[0];
  if (last.timestamp < lastMoment) {
    anchors.push({
      ...last,
      timestamp: lastMoment,
      x: clampPct(last.x + (last.x > 55 ? -9 : 9)),
      y: clampPct(last.y + (last.y > 55 ? -7 : 7)),
      clicked: false,
      priority: 0,
    });
  }

  const continuous: PointerSeed[] = [];
  for (let index = 0; index < anchors.length; index++) {
    const anchor = anchors[index];
    continuous.push(anchor);
    const next = anchors[index + 1];
    if (!next) continue;
    let step = 1;
    for (let timestamp = anchor.timestamp + POINTER_WANDER_MS; timestamp < next.timestamp; timestamp += POINTER_WANDER_MS) {
      continuous.push({
        ...anchor,
        timestamp,
        x: clampPct(anchor.x + (step % 2 ? 7 : -5)),
        y: clampPct(anchor.y + (step % 2 ? 5 : -6)),
        clicked: false,
        priority: 0,
      });
      step++;
    }
  }

  const paced: PointerSeed[] = [];
  for (const seed of continuous.sort((a, b) => a.timestamp - b.timestamp)) {
    const previous = paced.at(-1);
    const minimumTimestamp = previous && previous.targetArea !== seed.targetArea
      ? previous.timestamp + MIN_CROSS_AREA_MS
      : previous?.timestamp ?? 0;
    const timestamp = Math.max(seed.timestamp, minimumTimestamp);
    if (timestamp > lastMoment) continue;

    const pacedSeed = { ...seed, timestamp };
    if (previous && previous.timestamp === timestamp) {
      if (pacedSeed.priority >= previous.priority) paced[paced.length - 1] = pacedSeed;
      continue;
    }
    paced.push(pacedSeed);
  }

  return paced
    .map(({ priority: _priority, ...seed }) => ({ ...seed, id: nextId(), type: 'pointer-move' }));
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
  if (input.fitTimelineToDuration && input.durationMs && t > 0) {
    const scale = Math.max(0.05, (durationMs - 250) / t);
    for (const event of events) event.timestamp = Math.round(event.timestamp * scale);
    for (const cue of narrationScript) cue.timestamp = Math.round(cue.timestamp * scale);
    for (const chapter of chapters) chapter.timestamp = Math.round(chapter.timestamp * scale);
    for (const challenge of challenges) challenge.timestamp = Math.round(challenge.timestamp * scale);
  }
  const originalPointers = new Set(
    events.filter((event) => event.type === 'pointer-move').map((event) => event.id),
  );
  const pointerRoute = buildInstructorRoute(events, narrationScript, durationMs, input.initialWorkspace, nextId);
  const eventsWithoutOriginalPointers = events.filter((event) => !originalPointers.has(event.id));
  events.splice(0, events.length, ...eventsWithoutOriginalPointers, ...pointerRoute);
  events.sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
  const audioTrack: AudioTrackInfo = {
    url: resolvePublishedAudioUrl(input.id, input.audioUrl),
    durationMs,
    language: input.language ?? 'es',
    narrationScript,
  };

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    templateId: input.templateId ?? 'vanilla-js',
    executionMode: input.executionMode ?? 'browser',
    durationMs,
    initialWorkspace: cloneWorkspace(input.initialWorkspace),
    teachingFilePaths: input.teachingFilePaths,
    events,
    snapshots: generateSnapshots(input.initialWorkspace, events, 4000),
    audioTrack,
    narrationMode: input.narrationMode,
    challenges,
    chapters,
    concepts: input.concepts,
    skillsIntroduced: input.skillsIntroduced,
    skillsRequired: input.skillsRequired,
    learningObjectives: input.learningObjectives,
    commonMistakes: input.commonMistakes,
    mentalModel: input.mentalModel,
    frequentQuestions: input.frequentQuestions,
    representations: input.representations,
    transferPrompt: input.transferPrompt,
    masteryChecks: input.masteryChecks,
    teachNotes: input.teachNotes,
    author: input.author ?? { name: 'Kit', role: 'Instructor de fundamentos' },
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  };
}
