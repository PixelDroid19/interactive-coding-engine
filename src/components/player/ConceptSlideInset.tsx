import React, { useState } from 'react';
import { Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../themes/ThemeProvider';

interface ConceptSlideInsetProps {
  concepts?: string[];
  lessonTitle: string;
}

export const ConceptSlideInset: React.FC<ConceptSlideInsetProps> = ({
  concepts = ['programa', 'instrucción', 'código', 'JavaScript'],
  lessonTitle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';

  return (
    <div className={`concept-inset-wrapper absolute left-3 z-30 select-none max-w-xs transition-all duration-200${isOpen ? ' is-open' : ''}`}>
      {isOpen ? (
        <div
          className="concept-inset-card rounded-xl border border-zinc-700/80 bg-[#141416]/95 backdrop-blur-md p-3.5 shadow-2xl text-xs space-y-2.5 animate-in fade-in zoom-in-95"
          data-augmented-ui={isCyber ? "hud-concept-card tl-clip tr-clip br-clip bl-clip border inlay" : undefined}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-bold tracking-wide">Conceptos</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar conceptos"
              title="Cerrar conceptos"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 py-1">
            {concepts.map((concept, idx) => (
              <span
                key={concept}
                className={`concept-inset-chip px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                  idx % 3 === 0
                    ? 'bg-cyan-950/60 border-cyan-800/50 text-cyan-300'
                    : idx % 3 === 1
                    ? 'bg-purple-950/60 border-purple-800/50 text-purple-300'
                    : 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                }`}
              >
                {concept}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Ideas que esta lección está enseñando ahora mismo.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="concept-inset-trigger flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#18181b]/90 hover:bg-[#202024] px-2.5 py-1.5 text-xs text-zinc-300 shadow-xl backdrop-blur-sm transition-all hover:scale-105"
          data-augmented-ui={isCyber ? "hud-concept-btn tl-clip br-clip border inlay" : undefined}
          aria-label="Abrir conceptos"
          title="Abrir conceptos y notas"
        >
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-medium font-sans">Conceptos</span>
          <ChevronUp className="h-3 w-3 text-zinc-500" />
        </button>
      )}
    </div>
  );
};
