import React, { useEffect, useRef } from 'react';
import { Lightbulb, X, FileCode, Monitor } from 'lucide-react';
import { WorkspaceSnapshot } from '../../types/scrim';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  workspace: WorkspaceSnapshot;
  notes?: { title: string; body: string }[];
  concepts?: string[];
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  lessonTitle,
  workspace,
  notes = [],
  concepts = [],
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const restoreFocusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (restoreFocusTimerRef.current !== null) {
      window.clearTimeout(restoreFocusTimerRef.current);
      restoreFocusTimerRef.current = null;
    }

    const activeElement = document.activeElement;
    previouslyFocusedRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    closeButtonRef.current?.focus();

    return () => {
      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused?.isConnected) {
        restoreFocusTimerRef.current = window.setTimeout(() => {
          if (previouslyFocused.isConnected) previouslyFocused.focus();
          restoreFocusTimerRef.current = null;
        }, 0);
      }
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0];
  const guideNotes =
    notes.length > 0
      ? notes
      : [
          {
            title: 'Esto no es un video',
            body: 'El editor tiene código de verdad. Mientras el instructor habla, ves cómo escribe y ejecuta. Puedes pausar, cambiar el código y pulsar Run.',
          },
        ];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        className="drawer-panel explain-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Explicar lección"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
        style={{ width: 440 }}
      >
        <div className="drawer-header explain-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="lesson-num-badge lesson-num-badge-active" style={{ width: 34, height: 34 }}>
              <Lightbulb size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="explain-modal-title">
                Explicar
              </h2>
              <p className="explain-modal-subtitle">
                {lessonTitle}
              </p>
            </div>
          </div>
          <button ref={closeButtonRef} onClick={onClose} className="explain-close-btn" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body explain-modal-body">
          {concepts.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {concepts.map((concept, index) => (
                <span
                  key={concept}
                  className={`explain-concept-tag explain-concept-tag--${index % 3}`}
                >
                  {concept}
                </span>
              ))}
            </div>
          )}

          {guideNotes.map((note, index) => (
            <div
              key={note.title}
              className={`explain-card ${index === 0 ? 'explain-card--highlight' : ''}`}
            >
              <div className="explain-card-title">
                <Lightbulb size={15} />
                {note.title}
              </div>
              <p className="explain-card-body">
                {note.body}
              </p>
            </div>
          ))}

          <div className="explain-card">
            <div className="explain-card-title">
              <FileCode size={15} />
              Archivo activo
            </div>
            <p className="explain-card-body">
              Estás en <code className="explain-code-badge">{activeFile?.name || 'app.js'}</code>. Haz clic en el código para pausar y editar.
            </p>
          </div>

          <div className="explain-card">
            <div className="explain-card-title">
              <Monitor size={15} />
              Vista previa
            </div>
            <p className="explain-card-body">
              El navegador ejecuta tu HTML, CSS y JavaScript de verdad. Durante la clase se recarga cuando el instructor pulsa Run. Si editas, se recarga solo.
            </p>
          </div>
        </div>

        <div className="explain-modal-footer">
          <button onClick={onClose} className="explain-footer-btn">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
