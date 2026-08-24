export interface ConsoleMessage {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'system';
  args: string[];
  timestamp: number;
  sourceLine?: number;
}

export interface RuntimeExecutionResult {
  success: boolean;
  error?: {
    message: string;
    stack?: string;
    line?: number;
    column?: number;
  };
  consoleLogs: ConsoleMessage[];
  executionTimeMs: number;
}

export interface TestResultItem {
  id: string;
  description: string;
  passed: boolean;
  receivedValue?: any;
  expectedValue?: any;
  errorMessage?: string;
  hint?: string;
  status?: 'passed' | 'failed' | 'evaluation-error';
  isEvaluationError?: boolean;
}

export interface ChallengeValidationResult {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  tests: TestResultItem[];
  feedbackMessage: string;
  aiExplanation?: string;
}

export interface TemplateDefinition {
  id: 'vanilla-js' | 'js-only' | 'lit' | 'react';
  name: string;
  description: string;
  iconName: string;
  entrypoint: string;
  files: Record<string, {
    name: string;
    path: string;
    content: string;
    language: 'javascript' | 'html' | 'css' | 'typescript' | 'json';
  }>;
}
