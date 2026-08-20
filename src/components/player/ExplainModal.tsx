import React from 'react';
import { Lightbulb, X, Sparkles, CheckCircle2, Code2 } from 'lucide-react';
import { WorkspaceSnapshot } from '../../types/scrim';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  workspace: WorkspaceSnapshot;
  notes?: { title: string; body: string }[];
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  lessonTitle,
  workspace,
  notes = [],
}) => {
  if (!isOpen) return null;

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700/80 bg-[#141416] p-6 shadow-2xl text-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">Guía de la lección</h3>
              <p className="text-[11px] text-zinc-400 font-mono truncate">{lessonTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-4 space-y-3.5 text-xs">
          {(notes.length > 0 ? notes : [
            {
              title: 'Esto no es un video',
              body: 'El editor tiene código de verdad. Mientras el instructor habla, ves cómo escribe y ejecuta. Puedes pausar, cambiar el código y pulsar Run.',
            },
          ]).map((note) => (
            <div key={note.title} className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
              <div className="flex items-center gap-1.5 font-medium text-cyan-300 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{note.title}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[12px]">{note.body}</p>
            </div>
          ))}

          <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
            <div className="flex items-center gap-1.5 font-medium text-purple-300 mb-1">
              <Code2 className="h-3.5 w-3.5" />
              <span>Archivo activo</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-[12px]">
              Estás en <code className="font-mono text-amber-300 bg-zinc-950 px-1 py-0.5 rounded">{activeFile?.name || 'app.js'}</code>. Haz clic en el código para pausar y editar. El preview se actualiza al pulsar Run.
            </p>
          </div>

          <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
            <div className="flex items-center gap-1.5 font-medium text-emerald-300 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Preview</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-[12px]">
              El navegador de la derecha ejecuta tu HTML, CSS y JavaScript de verdad. Durante la clase solo se recarga cuando el instructor pulsa Run. Cuando editas, se recarga solo.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
