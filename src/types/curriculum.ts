import { ChallengeTest, LanguageVariants, ScrimChallenge, ScrimLessonData, WorkspaceSnapshot } from './scrim';

export type ItemType = 'scrim' | 'challenge' | 'debugging' | 'solo-project' | 'reading' | 'reasoning';

export type ProgressStatus = 'not-started' | 'in-progress' | 'completed';

export interface BaseCurriculumItem {
  id: string;
  title: string;
  type: ItemType;
  estimatedMinutes: number;
  description?: string;
}

export interface ScrimCurriculumItem extends BaseCurriculumItem {
  type: 'scrim';
  scrimDataId: string;
}

export interface StandaloneChallengeItem extends BaseCurriculumItem {
  type: 'challenge';
  templateId: 'vanilla-js' | 'js-only' | 'react';
  initialWorkspace: WorkspaceSnapshot;
  challenge: ScrimChallenge;
  languageVariants?: LanguageVariants;
}

export interface ReadingSection {
  title: string;
  content: string;
  example?: string;
  exampleCaption?: string;
  kind?: 'core' | 'curiosity';
}

export interface ReadingSource {
  title: string;
  url: string;
  publisher: string;
  purpose: string;
}

export interface DebuggingExerciseItem extends BaseCurriculumItem {
  type: 'debugging';
  relatedLessonId?: string;
  executionMode: 'logic' | 'browser';
  templateId: 'vanilla-js' | 'js-only' | 'react';
  initialWorkspace: WorkspaceSnapshot;
  expectedBehavior: string;
  observedBehavior: string;
  hints: { level: number; text: string }[];
  tests: ChallengeTest[];
  troubleshootingTips?: string[];
  languageVariants?: LanguageVariants;
}

export interface ReadingItem extends BaseCurriculumItem {
  type: 'reading';
  relatedLessonId?: string;
  title: string;
  summary: string;
  sections: ReadingSection[];
  keyPoints: string[];
  frequentQuestions?: { question: string; answer: string }[];
  transferPrompt?: string;
  practiceItemId?: string;
  sources?: ReadingSource[];
}

export interface ReasoningNode {
  id: string;
  label: string;
}

export interface ReasoningConnection {
  from: string;
  to: string;
  label?: string;
}

export type ReasoningActivity =
  | {
      kind: 'sequence';
      prompt: string;
      steps: ReasoningNode[];
      expectedOrder: string[];
    }
  | {
      kind: 'trace-table';
      prompt: string;
      columns: string[];
      rows: ReasoningNode[];
      expectedCells: Record<string, string>;
    }
  | {
      kind: 'flowchart';
      prompt: string;
      nodes: Array<ReasoningNode & { role: 'start' | 'process' | 'decision' | 'output' | 'end' }>;
      connectionOptions: ReasoningConnection[];
      expectedConnections: ReasoningConnection[];
    }
  | {
      kind: 'decision-table';
      prompt: string;
      cases: Array<ReasoningNode & { options: string[] }>;
      expectedOutcomes: Record<string, string>;
    }
  | {
      kind: 'dependency-map';
      prompt: string;
      modules: ReasoningNode[];
      dependencyOptions: ReasoningConnection[];
      expectedDependencies: ReasoningConnection[];
    };

export type ReasoningAttempt =
  | { kind: 'sequence'; order: string[] }
  | { kind: 'trace-table'; cells: Record<string, string> }
  | { kind: 'flowchart'; connections: ReasoningConnection[] }
  | { kind: 'decision-table'; outcomes: Record<string, string> }
  | { kind: 'dependency-map'; dependencies: ReasoningConnection[] };

export interface ReasoningExerciseItem extends BaseCurriculumItem {
  type: 'reasoning';
  relatedLessonId: string;
  activity: ReasoningActivity;
  hints: { level: number; text: string }[];
  explanation: string;
}

export interface SoloProjectItem extends BaseCurriculumItem {
  type: 'solo-project';
  templateId: 'vanilla-js' | 'react';
  initialWorkspace: WorkspaceSnapshot;
  brief: string;
  requirements: {
    id: string;
    title: string;
    description: string;
    category?: string;
  }[];
  suggestedSteps?: string[];
  referenceDesignUrl?: string;
  starterNotes?: string;
  languageVariants?: LanguageVariants;
}

export type CurriculumItem =
  | ScrimCurriculumItem
  | StandaloneChallengeItem
  | DebuggingExerciseItem
  | ReadingItem
  | ReasoningExerciseItem
  | SoloProjectItem;

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  items: CurriculumItem[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  instructor: {
    name: string;
    role: string;
    bio?: string;
    avatarUrl?: string;
  };
  modules: CourseModule[];
  thumbnailGradient?: string;
  isCustom?: boolean;
  conceptGlossary?: Record<string, { label: string; desc: string }[]>;
}

export interface UserProgressRecord {
  lastAccessedCourseId?: string;
  lastAccessedModuleId?: string;
  lastAccessedItemId?: string;
  lastAccessedTimestamp?: number; // timeline ms if it was a scrim
  completedItemIds: string[]; // List of IDs marked as completed
  completedChallenges: string[]; // Challenge IDs passed
  passedSoloProjects: string[]; // Solo project IDs marked complete
  savedLearnerBranches: Record<string, {
    itemId: string;
    savedAt: number;
    files: Record<string, string>;
  }>;
  recentActivity: {
    timestamp: number;
    courseId: string;
    moduleId: string;
    itemId: string;
    itemTitle: string;
    type: ItemType;
  }[];
}
