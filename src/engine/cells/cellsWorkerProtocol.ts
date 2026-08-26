import type { WorkspaceSnapshot } from '../../types/scrim';

export interface CellsRuntimeError {
  code: 'INVALID_REQUEST' | 'INVALID_WORKSPACE' | 'COMMAND_FAILED' | 'CANCELLED' | 'INTERNAL_ERROR';
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  hint?: string;
}

interface RequestEnvelope<TType extends string, TPayload> {
  type: TType;
  requestId: string;
  sessionId: string;
  generation: number;
  payload: TPayload;
}

export type CellsWorkerRequest =
  | RequestEnvelope<'project:create', { scaffold: { name: string; namespace?: '@open-cells-learning' } }>
  | RequestEnvelope<'project:load', { workspace: WorkspaceSnapshot }>
  | RequestEnvelope<'file:write', { path: string; content: string }>
  | RequestEnvelope<'file:delete', { path: string }>
  | RequestEnvelope<'command:run', { command: string }>
  | RequestEnvelope<'preview:build', { runContractTests?: boolean; testRunId?: string }>
  | RequestEnvelope<'tests:run', { coverage: boolean }>
  | RequestEnvelope<'locales:generate', Record<string, never>>
  | RequestEnvelope<'documentation:generate', Record<string, never>>
  | RequestEnvelope<'project:export', Record<string, never>>
  | RequestEnvelope<'request:cancel', { targetRequestId: string }>
  | RequestEnvelope<'runtime:dispose', Record<string, never>>;

interface ResponseEnvelope<TType extends string, TPayload> {
  type: TType;
  requestId: string;
  sessionId: string;
  generation: number;
  payload: TPayload;
}

export interface CellsTestResult {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  filePath?: string;
}

export interface CellsCoverageMetric {
  covered: number;
  total: number;
  percentage: number;
}

export interface CellsFileCoverage {
  path: string;
  available: boolean;
  unavailableReason?: string;
  statements: CellsCoverageMetric;
  branches: CellsCoverageMetric;
  functions: CellsCoverageMetric;
  lines: CellsCoverageMetric;
  uncoveredLines: number[];
}

export interface CellsCoverageResult {
  statements: CellsCoverageMetric;
  branches?: CellsCoverageMetric;
  functions?: CellsCoverageMetric;
  lines?: CellsCoverageMetric;
  behaviors: CellsCoverageMetric;
  files?: CellsFileCoverage[];
}

export type CellsWorkerResponse =
  | ResponseEnvelope<'runtime:ready', { capabilities: string[] }>
  | ResponseEnvelope<'workspace:updated', { workspace: WorkspaceSnapshot }>
  | ResponseEnvelope<'command:completed', { command: string; output: string; workspace?: WorkspaceSnapshot }>
  | ResponseEnvelope<'preview:built', { html: string; warnings: string[] }>
  | ResponseEnvelope<'tests:completed', { results: CellsTestResult[]; coverage?: CellsCoverageResult }>
  | ResponseEnvelope<'locales:generated', { workspace: WorkspaceSnapshot; keys: string[] }>
  | ResponseEnvelope<'documentation:generated', { workspace: WorkspaceSnapshot }>
  | ResponseEnvelope<'project:exported', { bytes: Uint8Array; fileName: string }>
  | ResponseEnvelope<'runtime:progress', { stage: string; current: number; total: number; message: string }>
  | ResponseEnvelope<'request:cancelled', { targetRequestId: string }>
  | ResponseEnvelope<'runtime:error', { error: CellsRuntimeError }>;

export function normalizeCellsRuntimeError(error: unknown): CellsRuntimeError {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const source = error as Partial<CellsRuntimeError>;
    return {
      code: source.code ?? 'INTERNAL_ERROR',
      message: String(source.message),
      ...(source.filePath ? { filePath: source.filePath } : {}),
      ...(source.line ? { line: source.line } : {}),
      ...(source.column ? { column: source.column } : {}),
      ...(source.hint ? { hint: source.hint } : {}),
    };
  }
  return {
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'El runtime Cells encontró un error inesperado.',
  };
}
