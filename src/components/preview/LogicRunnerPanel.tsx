import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { CheckCircle2, CircleStop, Clock3, Play, RotateCw, TerminalSquare } from 'lucide-react';
import { WorkspaceSnapshot } from '../../types/scrim';
import { RuntimeExecutionResult } from '../../types/runtime';
import { executeLogicWorkspace } from '../../engine/logicRunner';

export interface LogicRunnerPanelRef {
  run: () => Promise<RuntimeExecutionResult>;
}

interface LogicRunnerPanelProps {
  workspace: WorkspaceSnapshot;
  onRunClick?: () => void;
}

export const LogicRunnerPanel = forwardRef<LogicRunnerPanelRef, LogicRunnerPanelProps>(({ workspace, onRunClick }, ref) => {
  const [result, setResult] = useState<RuntimeExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const run = async () => {
    setIsRunning(true);
    const next = await executeLogicWorkspace(workspace);
    setResult(next);
    setIsRunning(false);
    return next;
  };

  useImperativeHandle(ref, () => ({ run }));

  const handleRun = () => {
    if (onRunClick) onRunClick();
    else void run();
  };

  return (
    <section className="logic-runner-panel" role="region" aria-label="Salida de JavaScript">
      <header className="logic-runner-header">
        <div>
          <span className="logic-runner-kicker"><TerminalSquare size={13} /> JavaScript</span>
          <h2>Salida</h2>
        </div>
        <button type="button" className="logic-runner-run" onClick={handleRun} disabled={isRunning} aria-label="Ejecutar lógica">
          {isRunning ? <RotateCw size={15} className="animate-spin" /> : <Play size={15} fill="currentColor" />}
          {isRunning ? 'Ejecutando…' : 'Ejecutar'}
        </button>
      </header>

      <div className="logic-runner-body" aria-live="polite">
        {!result && !isRunning && (
          <div className="logic-runner-empty">
            <Play size={20} />
            <strong>Ejecuta para comprobar tu lógica</strong>
            <p>Los mensajes de console.log aparecerán aquí, sin abrir una página web.</p>
          </div>
        )}
        {isRunning && <div className="logic-runner-empty"><RotateCw size={20} className="animate-spin" /><strong>Ejecutando en un entorno aislado…</strong></div>}
        {result?.consoleLogs.map((message) => (
          <div key={message.id} className={`logic-output-row is-${message.type}`}>
            <span className="logic-output-value">{message.args.join(' ')}</span>
            {message.sourceLine && <span className="logic-output-line">L{message.sourceLine}</span>}
          </div>
        ))}
        {result?.success && result.consoleLogs.length === 0 && (
          <div className="logic-runner-empty is-success"><CheckCircle2 size={20} /><strong>El programa terminó sin errores</strong><p>Usa console.log(...) si quieres observar un valor.</p></div>
        )}
        {result?.error && (
          <div className="logic-runner-error" role="alert">
            <CircleStop size={18} />
            <div><strong>No se pudo completar la ejecución</strong><p>{result.error.message}</p>{result.error.line && <span>Línea {result.error.line}</span>}</div>
          </div>
        )}
      </div>

      {result && (
        <footer className="logic-runner-footer">
          <span className={result.success ? 'is-success' : 'is-error'}>{result.success ? 'Ejecución correcta' : 'Revisa el error'}</span>
          <span><Clock3 size={12} /> {Math.max(1, Math.round(result.executionTimeMs))} ms</span>
        </footer>
      )}
    </section>
  );
});
