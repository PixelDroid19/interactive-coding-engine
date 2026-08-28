import { useSyncExternalStore } from 'react';
import type { ItemType } from '../../types/curriculum';

export interface TutorActivityContext {
  courseId: string;
  courseTitle: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  description?: string;
  mentalModel?: string;
  skillsRequired?: string[];
  skillsIntroduced?: string[];
  commonMistakes?: string[];
  recentResult?: string;
}

export interface TutorWorkspaceSnapshot {
  lessonId?: string;
  activeFilePath: string;
  files: Record<string, string>;
  diagnostics?: string;
  recentResult?: string;
}

export interface TutorWorkspaceActions {
  replaceFile(path: string, content: string): void;
  undoLastChange(): void;
  runChecks?: () => Promise<string>;
}

export interface TutorWorkspaceContext {
  snapshot: TutorWorkspaceSnapshot;
  actions: TutorWorkspaceActions;
}

/** @deprecated Usa TutorWorkspaceSnapshot. */
export type TutorCodeContext = TutorWorkspaceSnapshot;

let latestWorkspace: TutorWorkspaceContext | null = null;
let latestSourceId: string | null = null;
const listeners = new Set<() => void>();

export function publishTutorWorkspace(context: TutorWorkspaceContext | null, sourceId = 'global'): void {
  latestWorkspace = context;
  latestSourceId = context ? sourceId : null;
  listeners.forEach((listener) => listener());
}

export function clearTutorWorkspace(sourceId: string): void {
  if (latestSourceId !== sourceId) return;
  publishTutorWorkspace(null, sourceId);
}

export function subscribeTutorWorkspace(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTutorWorkspace(): TutorWorkspaceContext | null {
  return latestWorkspace;
}

export function useTutorWorkspace(): TutorWorkspaceContext | null {
  return useSyncExternalStore(subscribeTutorWorkspace, getTutorWorkspace, () => null);
}

/** Compatibilidad temporal para consumidores que solo leen el contexto. */
export function publishTutorCodeContext(context: TutorCodeContext | null, sourceId = 'global'): void {
  publishTutorWorkspace(context ? {
    snapshot: context,
    actions: { replaceFile: () => undefined, undoLastChange: () => undefined },
  } : null, sourceId);
}

export function clearTutorCodeContext(sourceId: string): void {
  clearTutorWorkspace(sourceId);
}

export function subscribeTutorCodeContext(listener: () => void): () => void {
  return subscribeTutorWorkspace(listener);
}

export function getTutorCodeContext(): TutorCodeContext | null {
  return latestWorkspace?.snapshot ?? null;
}

export function useTutorCodeContext(): TutorCodeContext | null {
  return useTutorWorkspace()?.snapshot ?? null;
}
