import React, { useEffect } from 'react';
import { ArrowRight, Clock, Lightbulb, X } from 'lucide-react';
import { LessonBriefingData } from '../../curriculum/fundamentos/roadmap';
import { ConceptVisual } from './ConceptVisual';

interface LessonBriefingProps {
  data: LessonBriefingData;
  onClose: () => void;
  onEnter: () => void;
}

export const LessonBriefing: React.FC<LessonBriefingProps> = ({ data, onClose, onEnter }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="rm-briefing-backdrop" onClick={onClose}>
      <div className="rm-briefing" onClick={(event) => event.stopPropagation()}>
        <button className="rm-briefing-close" onClick={onClose} aria-label="Cerrar">
          <X size={14} />
        </button>

        <div className="rm-briefing-meta">
          <span className={`rm-pill ${data.category === 'Práctica' ? 'rm-pill-dark' : ''}`}>{data.category}</span>
          <span className="rm-time">
            <Clock size={12} /> {data.minutes} min
          </span>
        </div>

        <h2 className="rm-briefing-title">{data.title}</h2>
        <p className="rm-briefing-hook">{data.hook}</p>

        <div className="rm-visual-panel">
          <div className="rm-visual-label">
            <Lightbulb size={13} /> Cómo pensarlo
          </div>
          <ConceptVisual kind={data.visual} />
          <p className="rm-visual-copy">{data.explanation}</p>
        </div>

        <h3 className="rm-keys-title">Antes de entrar, ten esto claro</h3>
        <div className="rm-keys">
          {data.keywords.map((keyword) => (
            <div key={keyword.term} className="rm-key-card">
              <strong>{keyword.term}</strong>
              <p>{keyword.desc}</p>
            </div>
          ))}
        </div>

        <button className="rm-enter-btn" onClick={onEnter}>
          Entrar a la clase <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
