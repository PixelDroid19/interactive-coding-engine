import type {
  LanguageCompletion,
  LanguageDiagnostic,
  LanguageHover,
  LanguageServiceFile,
  LanguageSignatureHelp,
} from './typeScriptLanguageService';

export type LanguageWorkerRequest =
  | { id: number; type: 'diagnostics'; path: string }
  | { id: number; type: 'completions'; path: string; position: number }
  | { id: number; type: 'hover'; path: string; position: number }
  | { id: number; type: 'signature'; path: string; position: number };

export type LanguageWorkerRequestWithoutId =
  | { type: 'diagnostics'; path: string }
  | { type: 'completions'; path: string; position: number }
  | { type: 'hover'; path: string; position: number }
  | { type: 'signature'; path: string; position: number };

export type LanguageWorkerNotification =
  | { type: 'workspace/replace'; files: LanguageServiceFile[] }
  | { type: 'file/update'; path: string; content: string };

export type LanguageWorkerResult =
  | LanguageDiagnostic[]
  | LanguageCompletion[]
  | LanguageHover
  | LanguageSignatureHelp
  | null;

export type LanguageWorkerResponse =
  | { id: number; ok: true; result: LanguageWorkerResult }
  | { id: number; ok: false; error: string };
