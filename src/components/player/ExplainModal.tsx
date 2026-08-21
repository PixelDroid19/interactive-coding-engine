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
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Explicar lección"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
        style={{ width: 420 }}
      >
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="lesson-num-badge lesson-num-badge-active" style={{ width: 34, height: 34 }}>
              <Lightbulb size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Patrick Hand, cursive',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--color-text-main)',
                  lineHeight: 1.1,
                }}
              >
                Explicar
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lessonTitle}
              </p>
            </div>
          </div>
          <button ref={closeButtonRef} onClick={onClose} className="round-icon-btn" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {concepts.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {concepts.map((concept, index) => (
                <span
                  key={concept}
                  className="category-tag"
                  style={{
                    transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
                    background:
                      index % 3 === 0
                        ? 'var(--color-highlighter-yellow)'
                        : index % 3 === 1
                          ? 'var(--color-highlighter-cyan)'
                          : 'var(--color-highlighter-mint)',
                  }}
                >
                  {concept}
                </span>
              ))}
            </div>
          )}

          {guideNotes.map((note, index) => (
            <div
              key={note.title}
              className="concept-card"
              style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                cursor: 'default',
                gap: 6,
                background: index === 0 ? 'var(--color-highlighter-yellow)' : 'var(--bg-surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'Patrick Hand, cursive',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--color-text-main)',
                }}
              >
                <Lightbulb size={15} />
                {note.title}
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-main)' }}>
                {note.body}
              </p>
            </div>
          ))}

          <div
            className="concept-card"
            style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default', gap: 6 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'Patrick Hand, cursive',
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              <FileCode size={15} />
              Archivo activo
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
              Estás en{' '}
              <code
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  background: 'var(--color-highlighter-cyan)',
                  color: '#0f172a',
                  padding: '1px 6px',
                  border: '1.5px solid #232733',
                  borderRadius: 6,
                }}
              >
                {activeFile?.name || 'app.js'}
              </code>
              . Haz clic en el código para pausar y editar.
            </p>
          </div>

          <div
            className="concept-card"
            style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default', gap: 6 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'Patrick Hand, cursive',
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              <Monitor size={15} />
              Vista previa
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
              El navegador ejecuta tu HTML, CSS y JavaScript de verdad. Durante la clase se recarga cuando el instructor pulsa Run. Si editas, se recarga solo.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: 'var(--border-pencil)',
            background: 'var(--bg-surface)',
          }}
        >
          <button onClick={onClose} className="btn-next-lesson neu-pill-btn" style={{ width: '100%' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
