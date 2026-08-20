import React, { useState } from 'react';
import { ConsoleMessage } from '../../types/runtime';
import { Terminal, Trash2, AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface RuntimeConsoleProps {
  logs: ConsoleMessage[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const RuntimeConsole: React.FC<RuntimeConsoleProps> = ({
  logs,
  onClearLogs,
  isOpen,
  onToggle,
}) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'log'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'error') return log.type === 'error';
    if (filter === 'warn') return log.type === 'warn';
    if (filter === 'log') return log.type === 'log' || log.type === 'info';
    return true;
  });

  const errorCount = logs.filter((l) => l.type === 'error').length;
  const warnCount = logs.filter((l) => l.type === 'warn').length;

  const renderLogIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />;
      case 'warn':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />;
      case 'system':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      default:
        return <span className="text-slate-500 font-mono text-[10px] shrink-0 mt-0.5">&gt;</span>;
    }
  };

  return (
    <div className={`flex flex-col bg-[#111111] border-t border-slate-800 text-xs font-mono transition-all duration-200 ${isOpen ? 'h-48' : 'h-8'}`}>
      {/* Header bar */}
      <div
        onClick={onToggle}
        className="flex h-8 items-center justify-between px-3 bg-[#151515] hover:bg-[#1a1a1a] cursor-pointer border-b border-slate-800 select-none"
      >
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
          <Terminal className="h-3.5 w-3.5 text-blue-400" />
          <span>Console</span>
          {errorCount > 0 && (
            <span className="rounded-full bg-rose-950/90 text-rose-300 border border-rose-700/50 px-1.5 py-0.2 text-[10px]">
              {errorCount} {errorCount === 1 ? 'error' : 'errors'}
            </span>
          )}
          {warnCount > 0 && (
            <span className="rounded-full bg-amber-950/90 text-amber-300 border border-amber-700/50 px-1.5 py-0.2 text-[10px]">
              {warnCount}
            </span>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex rounded bg-zinc-900 p-0.5 border border-zinc-800 text-[10px]">
              {(['all', 'log', 'warn', 'error'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    filter === mode ? 'bg-zinc-700 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={onClearLogs}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
              title="Clear console"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Log items container */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#111111] selection:bg-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-600 italic text-[11px]">
              No console output yet. Execute your code or interact with the preview.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 py-1 px-2 rounded font-mono text-[12px] leading-relaxed break-all ${
                  log.type === 'error'
                    ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                    : log.type === 'warn'
                    ? 'bg-amber-950/30 text-amber-300 border-l-2 border-amber-500'
                    : log.type === 'system'
                    ? 'bg-emerald-950/20 text-emerald-300'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {renderLogIcon(log.type)}
                <div className="flex-1">
                  {log.args.map((arg, idx) => (
                    <span key={idx} className="mr-2">
                      {arg}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-600 shrink-0 select-none">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
