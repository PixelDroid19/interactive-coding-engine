import React from 'react';
import type { ReadingDiagram } from '../../types/curriculum';
import { useOptionalTheme } from '../../themes/ThemeProvider';

interface LearningDiagramProps {
  diagram: ReadingDiagram;
}

export const LearningDiagram: React.FC<LearningDiagramProps> = ({ diagram }) => {
  const theme = useOptionalTheme()?.themeId ?? (document.documentElement.classList.contains('hud') ? 'cyber' : 'normal');
  const src = theme === 'cyber' ? diagram.src.replace(/\.html$/, '-cyber.html') : diagram.src;
  return (
    <figure className="learning-diagram">
      <div className="learning-diagram__frame" style={{ aspectRatio: diagram.aspectRatio ?? '16/9' }}>
        <iframe src={src} title={diagram.alt} loading="lazy" sandbox="allow-scripts" />
      </div>
      <figcaption><strong>Cómo leerlo:</strong> {diagram.caption}</figcaption>
      <p className="learning-diagram__question"><span>Antes de seguir</span>{diagram.readingQuestion}</p>
    </figure>
  );
};
