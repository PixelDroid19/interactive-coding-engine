import React, { type ReactNode } from 'react';
import { ChevronDown, CircleCheck, LifeBuoy, PencilLine } from 'lucide-react';

interface PracticeBriefProps {
  action: ReactNode;
  expected: ReactNode;
  help?: ReactNode;
  className?: string;
}

export function PracticeBrief({ action, expected, help, className = '' }: PracticeBriefProps) {
  return (
    <section className={`practice-brief ${className}`.trim()} aria-label="Instrucciones de la práctica">
      <div className="practice-brief__row is-action">
        <span className="practice-brief__label"><PencilLine size={14} /> Haz esto</span>
        <div className="practice-brief__copy">{action}</div>
      </div>

      <div className="practice-brief__row is-expected">
        <span className="practice-brief__label"><CircleCheck size={14} /> Debe ocurrir</span>
        <div className="practice-brief__copy">{expected}</div>
      </div>

      {help && (
        <details className="practice-brief__help">
          <summary><LifeBuoy size={14} /> Necesito ayuda <ChevronDown className="practice-brief__chevron" size={14} /></summary>
          <div className="practice-brief__help-content">{help}</div>
        </details>
      )}
    </section>
  );
}
