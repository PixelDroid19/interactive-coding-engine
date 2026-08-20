import { ScrimChallenge, ScrimLessonData, WorkspaceSnapshot } from './scrim';

export type ItemType = 'scrim' | 'challenge' | 'debugging' | 'solo-project';

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
}

export interface DebuggingExerciseItem extends BaseCurriculumItem {
  type: 'debugging';
  templateId: 'vanilla-js' | 'js-only' | 'react';
  initialWorkspace: WorkspaceSnapshot;
  expectedBehavior: string;
  observedBehavior: string;
  hints: { level: number; text: string }[];
  tests: {
    id: string;
    description: string;
    targetFunction?: string;
    args?: any[];
    expectedReturn?: any;
    domSelector?: string;
    domProperty?: string;
    expectedValue?: any;
  }[];
  solutionFiles?: Record<string, string>;
  troubleshootingTips?: string[];
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
}

export type CurriculumItem =
  | ScrimCurriculumItem
  | StandaloneChallengeItem
  | DebuggingExerciseItem
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
