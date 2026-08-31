import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { executeLogicWorkspace } from '../../engine/logicRunner';
import { PythonRuntimeClient } from '../../engine/python/pythonRuntimeClient';
import type { CourseRuntime } from '../../engine/runtime/courseRuntime';
import type { RuntimeExecutionResult } from '../../types/runtime';
import type { CourseLanguage, WorkspaceSnapshot } from '../../types/scrim';
import { RuntimeOutputPanel } from '../runtime/RuntimeOutputPanel';

export interface LogicRunnerPanelRef {
  run: () => Promise<RuntimeExecutionResult>;
}

interface LogicRunnerPanelProps {
  workspace: WorkspaceSnapshot;
  language?: CourseLanguage;
  packages?: string[];
  onRunClick?: () => void;
  runtimeFactory?: () => CourseRuntime;
  embedded?: boolean;
}

export const LogicRunnerPanel = forwardRef<LogicRunnerPanelRef, LogicRunnerPanelProps>(({
  workspace,
  language = 'javascript',
  packages = [],
  onRunClick,
  runtimeFactory,
  embedded = false,
}, ref) => {
  const [result, setResult] = useState<RuntimeExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const pythonRuntimeRef = useRef<CourseRuntime | null>(null);

  useEffect(() => {
    setResult(null);
    return () => {
      pythonRuntimeRef.current?.dispose();
      pythonRuntimeRef.current = null;
    };
  }, [language, runtimeFactory]);

  const run = async () => {
    setIsRunning(true);
    try {
      let next: RuntimeExecutionResult;
      if (language === 'python') {
        pythonRuntimeRef.current ??= runtimeFactory?.() ?? new PythonRuntimeClient();
        next = await pythonRuntimeRef.current.run(workspace, { packages });
      } else {
        next = await executeLogicWorkspace(workspace);
      }
      setResult(next);
      return next;
    } finally {
      setIsRunning(false);
    }
  };

  useImperativeHandle(ref, () => ({ run }));

  const handleRun = () => {
    if (onRunClick) onRunClick();
    else void run();
  };

  return (
    <RuntimeOutputPanel
      language={language}
      result={result}
      isRunning={isRunning}
      onRun={handleRun}
      embedded={embedded}
    />
  );
});
