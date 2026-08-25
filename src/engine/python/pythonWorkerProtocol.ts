export interface PythonRuntimeError {
  message: string;
  stack?: string;
  line?: number;
  column?: number;
}

export type PythonWorkerInbound = {
  type: 'runtime/run';
  requestId: number;
  source: string;
  packages: string[];
};

export type PythonWorkerOutbound =
  | {
      type: 'runtime/stdout' | 'runtime/stderr';
      requestId: number;
      text: string;
      line?: number;
    }
  | {
      type: 'runtime/progress';
      requestId: number;
      stage: 'runtime' | 'package';
      label: string;
      loaded?: number;
      total?: number;
    }
  | { type: 'runtime/result'; requestId: number; success: true }
  | {
      type: 'runtime/result';
      requestId: number;
      success: false;
      error: PythonRuntimeError;
    };
