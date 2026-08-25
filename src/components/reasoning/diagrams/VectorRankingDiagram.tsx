import React, { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import type { ReasoningNode } from '../../../types/curriculum';

interface VectorRankingDiagramProps {
  candidates: Array<ReasoningNode & { score: number }>;
  order: string[];
  onMove: (id: string, delta: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function VectorRankingDiagram({ candidates, order, onMove, onReorder }: VectorRankingDiagramProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    if (onReorder) {
      onReorder(draggedIndex, targetIndex);
    } else {
      const delta = targetIndex - draggedIndex;
      onMove(order[draggedIndex], delta);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <section aria-label="Orden de similitud" className="space-y-4">
      <div className="reasoning-ranking-header mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
          Ordena de mayor a menor puntuación
        </h2>
      </div>

      <ol className="reasoning-sequence-list">
        {order.map((id, index) => {
          const item = candidates.find((candidate) => candidate.id === id)!;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== index;

          return (
            <li
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`reasoning-reorder-card ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
            >
              <div className="reasoning-drag-handle" title="Arrastrar para reordenar">
                <GripVertical size={18} />
              </div>

              <span className="reasoning-step-badge" aria-hidden="true">
                {index + 1}
              </span>

              <div className="reasoning-step-content flex-1">
                <strong>{item.label}</strong>
              </div>

              <span className="reasoning-score-chip">
                {item.score.toFixed(3)}
              </span>

              <div className="reasoning-step-actions">
                <button
                  type="button"
                  aria-label="Subir"
                  title="Subir"
                  className="reasoning-move-btn"
                  onClick={() => onMove(id, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp size={14} />
                  <span className="reasoning-btn-text">Subir</span>
                </button>
                <button
                  type="button"
                  aria-label="Bajar"
                  title="Bajar"
                  className="reasoning-move-btn"
                  onClick={() => onMove(id, 1)}
                  disabled={index === order.length - 1}
                >
                  <ArrowDown size={14} />
                  <span className="reasoning-btn-text">Bajar</span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

