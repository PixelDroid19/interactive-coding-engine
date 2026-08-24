export interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
  language: 'javascript' | 'html' | 'css' | 'typescript' | 'json';
}

export interface WorkspaceSnapshot {
  files: Record<string, WorkspaceFile>;
  activeFilePath: string;
  cursorPosition?: { line: number; ch: number };
  selection?: { from: number; to: number };
  layout?: { previewWidthPercent: number };
}

export type ScrimEventType =
  | 'code-change'
  | 'file-switch'
  | 'file-create'
  | 'file-delete'
  | 'file-rename'
  | 'cursor-move'
  | 'selection-change'
  | 'pointer-move'
  | 'run-code'
  | 'preview-interaction'
  | 'challenge-marker'
  | 'chapter-marker';

export interface BaseScrimEvent {
  id: string;
  timestamp: number; // in milliseconds from start
  type: ScrimEventType;
}

export interface CodeChangeEvent extends BaseScrimEvent {
  type: 'code-change';
  filePath: string;
  changes: {
    from: number;
    to: number;
    text: string;
  }[];
  fullContent?: string; // Optional snapshot for safety / catchup
}

export interface FileSwitchEvent extends BaseScrimEvent {
  type: 'file-switch';
  filePath: string;
}

export interface FileCreateEvent extends BaseScrimEvent {
  type: 'file-create';
  file: WorkspaceFile;
}

export interface FileDeleteEvent extends BaseScrimEvent {
  type: 'file-delete';
  filePath: string;
}

export interface FileRenameEvent extends BaseScrimEvent {
  type: 'file-rename';
  oldPath: string;
  newPath: string;
}

export interface CursorMoveEvent extends BaseScrimEvent {
  type: 'cursor-move';
  filePath: string;
  position: { line: number; ch: number };
}

export interface SelectionChangeEvent extends BaseScrimEvent {
  type: 'selection-change';
  filePath: string;
  from: number;
  to: number;
}

export interface PointerMoveEvent extends BaseScrimEvent {
  type: 'pointer-move';
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  targetArea: 'editor' | 'preview' | 'files';
  clicked?: boolean;
}

export interface RunCodeEvent extends BaseScrimEvent {
  type: 'run-code';
}

export interface PreviewInteractionEvent extends BaseScrimEvent {
  type: 'preview-interaction';
  interactionType: 'click' | 'input' | 'scroll';
  selector?: string;
  value?: string;
}

export interface ChallengeMarkerEvent extends BaseScrimEvent {
  type: 'challenge-marker';
  challengeId: string;
  title: string;
  autoPause: boolean;
}

export interface ChapterMarkerEvent extends BaseScrimEvent {
  type: 'chapter-marker';
  title: string;
}

export type ScrimEvent =
  | CodeChangeEvent
  | FileSwitchEvent
  | FileCreateEvent
  | FileDeleteEvent
  | FileRenameEvent
  | CursorMoveEvent
  | SelectionChangeEvent
  | PointerMoveEvent
  | RunCodeEvent
  | PreviewInteractionEvent
  | ChallengeMarkerEvent
  | ChapterMarkerEvent;

export interface SnapshotPoint {
  timestamp: number;
  eventIndex: number;
  workspace: WorkspaceSnapshot;
}

export interface ChallengeTest {
  id: string;
  description: string;
  validatorType: 'function-call' | 'dom-check' | 'source-regex' | 'console-check' | 'browser-script';
  targetFunction?: string;
  args?: any[];
  returnedFunctionCallCounts?: number[];
  expectedReturn?: any;
  domSelector?: string;
  domProperty?: 'innerText' | 'textContent' | 'innerHTML' | 'value' | 'className' | 'style' | 'exists' | 'count';
  expectedValue?: any;
  regexPattern?: string;
  customValidatorScript?: string;
  errorMessage?: string;
  hintTip?: string;
  // Extended contract for semantic string matching
  matcher?: 'exact' | 'contains' | 'contains-all' | 'string-contains-all';
  caseInsensitive?: boolean;
  normalizeSpaces?: boolean;
  ignorePunctuation?: boolean;
  requireArgInResult?: boolean | number;
  expectedContains?: string[];
  // For DOM with generic
  evaluationMode?: 'single' | 'multiple';
  // For DOM tests that need to trigger an interaction before checking
  triggerClick?: string;
  triggerSelector?: string;
}

export interface Hint {
  level: number;
  title: string;
  text: string;
  codeSnippet?: string;
}

export interface ScrimChallenge {
  id: string;
  title: string;
  timestamp: number; // When on timeline it triggers
  instructions: string;
  starterCodeDiff?: Record<string, string>; // Optional branch modification
  tests: ChallengeTest[];
  hints: Hint[];
  solutionExplanation?: string;
  solutionFiles?: Record<string, string>;
  allowSkip?: boolean;
  autoPause?: boolean;
}

export interface AudioTrackInfo {
  url?: string;
  audioBlob?: Blob;
  audioStorageKey?: string;
  audioError?: string;
  mimeType?: string;
  durationMs: number;
  language?: string;
  // Synthesized narration markers for captions and speech fallback
  narrationScript?: {
    timestamp: number;
    text: string;
    voiceRate?: number;
  }[];
}

export interface ScrimLessonData {
  id: string;
  title: string;
  description: string;
  templateId: 'vanilla-js' | 'js-only' | 'lit' | 'react';
  executionMode?: 'logic' | 'browser';
  durationMs: number;
  initialWorkspace: WorkspaceSnapshot;
  events: ScrimEvent[];
  snapshots: SnapshotPoint[];
  audioTrack?: AudioTrackInfo;
  challenges: ScrimChallenge[];
  chapters?: { timestamp: number; title: string }[];
  concepts?: string[];
  /** Capacidades concretas que la clase presenta por primera vez. */
  skillsIntroduced: string[];
  /** Capacidades que el estudiante ya debe haber practicado antes de entrar. */
  skillsRequired: string[];
  /** Resultados observables que el estudiante debería lograr al terminar. */
  learningObjectives: string[];
  /** Confusiones previsibles que la explicación y la práctica deben abordar. */
  commonMistakes: string[];
  /** Frase cotidiana que permite predecir el concepto antes de memorizar sintaxis. */
  mentalModel?: string;
  /** Dudas reales de principiante con una respuesta causal y comprobable. */
  frequentQuestions?: { question: string; answer: string }[];
  /** Representaciones visuales o tabulares usadas para razonar sobre el código. */
  representations?: string[];
  /** Pregunta que lleva el concepto a un contexto diferente del ejemplo. */
  transferPrompt?: string;
  /** Evidencias observables de dominio, más concretas que “entender”. */
  masteryChecks?: string[];
  teachNotes?: { title: string; body: string }[];
  author?: {
    name: string;
    avatarUrl?: string;
    role?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface LearnerBranch {
  id: string;
  lessonId: string;
  baseTime: number;
  baseSequence: number;
  workspace: WorkspaceSnapshot;
  isForked: boolean;
  activeChallengeId?: string;
  lastSavedAt: number;
  executionCount: number;
}
