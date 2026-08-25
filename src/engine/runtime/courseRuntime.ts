import type { RuntimeExecutionResult } from '../../types/runtime';
import type {
  CourseLanguage,
  LanguageVariants,
  PracticeVariant,
  WorkspaceSnapshot,
} from '../../types/scrim';

export type { CourseLanguage, LanguageVariants, PracticeVariant };

export interface RuntimeOptions {
  timeoutMs?: number;
  packages?: string[];
  signal?: AbortSignal;
}

export interface CourseRuntime {
  run(workspace: WorkspaceSnapshot, options?: RuntimeOptions): Promise<RuntimeExecutionResult>;
  dispose(): void;
}

export function selectPracticeVariant(
  variants: LanguageVariants,
  language: CourseLanguage,
): PracticeVariant {
  return structuredClone(variants[language]);
}
