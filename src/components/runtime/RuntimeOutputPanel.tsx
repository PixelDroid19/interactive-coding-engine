import React from 'react';
import { CheckCircle2, CircleStop, Clock3, Play, RotateCw, TerminalSquare } from 'lucide-react';
import type { RuntimeExecutionResult } from '../../types/runtime';
import type { CourseLanguage } from '../../types/scrim';
import { useTheme } from '../../themes/ThemeProvider';

interface RuntimeOutputPanelProps {
  language: CourseLanguage;
  result: RuntimeExecutionResult | null;
  isRunning: boolean;
  onRun: () => void;
  /**
   * The debugging panel already owns the surrounding surface and frame.
   * Keep the output semantics while letting that parent provide the only
   * visible container.
   */
  embedded?: boolean;
}

export function RuntimeOutputPanel({ language, result, isRunning, onRun, embedded = false }: RuntimeOutputPanelProps) {
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';
  const label = language === 'python' ? 'Python' : 'JavaScript';

  return (
    <section
      className={`logic-runner-panel${embedded ? ' is-embedded' : ''}`}
      role="region"
      aria-label={`Salida de ${label}`}
      data-augmented-ui={!embedded && isCyber ? "hud-browser tl-clip tr-clip br-clip bl-clip border inlay" : undefined}
    >
      <header className="logic-runner-header">
        <div>
          <span className="logic-runner-kicker"><TerminalSquare size={13} /> {label}</span>
          <h2>Salida</h2>
        </div>
        <button
          type="button"
          className="logic-runner-run"
          onClick={onRun}
          disabled={isRunning}
          aria-label={language === 'python' ? 'Ejecutar Python' : 'Ejecutar lógica'}
        >
          {isRunning ? <RotateCw size={15} className="animate-spin" /> : <Play size={15} fill="currentColor" />}
          {isRunning ? 'Ejecutando…' : 'Ejecutar'}
        </button>
      </header>

      <div
        className="logic-runner-body"
        aria-label="Historial de salida"
        aria-live="polite"
        tabIndex={0}
      >
        {!result && !isRunning && (
          <div className="logic-runner-empty">
            <Play size={20} />
            <strong>Ejecuta para comprobar tu lógica</strong>
            <p>La salida de {language === 'python' ? 'print(...)' : 'console.log(...)'} aparecerá aquí.</p>
          </div>
        )}
        {isRunning && (
          <div className="logic-runner-empty">
            <RotateCw size={20} className="animate-spin" />
            <strong>{language === 'python' ? 'Preparando Python en el navegador…' : 'Ejecutando en un entorno aislado…'}</strong>
          </div>
        )}
        {result?.consoleLogs.map((message) => (
          <div key={message.id} className={`logic-output-row is-${message.type}`}>
            <span className="logic-output-value">{message.args.join(' ')}</span>
            {message.sourceLine && <span className="logic-output-line">L{message.sourceLine}</span>}
          </div>
        ))}
        {result?.success && result.consoleLogs.length === 0 && (
          <div className="logic-runner-empty is-success">
            <CheckCircle2 size={20} />
            <strong>El programa terminó sin errores</strong>
            <p>Usa {language === 'python' ? 'print(...)' : 'console.log(...)'} si quieres observar un valor.</p>
          </div>
        )}
        {result?.error && (
          <div className="logic-runner-error" role="alert">
            <CircleStop size={18} />
            <div>
              <strong>No se pudo completar la ejecución</strong>
              <p>{result.error.message}</p>
              {result.error.line && <span>Línea {result.error.line}</span>}
            </div>
          </div>
        )}
      </div>
      {result && (
        <footer className="logic-runner-footer">
          <span className={result.success ? 'is-success' : 'is-error'}>
            {result.success ? 'Ejecución correcta' : 'Revisa el error'}
          </span>
          <span><Clock3 size={12} /> {Math.max(1, Math.round(result.executionTimeMs))} ms</span>
        </footer>
      )}
    </section>
  );
}
