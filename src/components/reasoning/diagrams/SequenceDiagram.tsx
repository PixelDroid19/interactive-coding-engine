import React, { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { ReasoningNode } from '../../../types/curriculum';

interface SequenceDiagramProps {
  steps: ReasoningNode[];
  onMove: (id: string, delta: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function SequenceDiagram({ steps, onMove, onReorder }: SequenceDiagramProps) {
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
      onMove(steps[draggedIndex].id, delta);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <ol className="reasoning-sequence-list" aria-label="Secuencia actual">
      {steps.map((step, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index && draggedIndex !== index;

        return (
          <li
            key={step.id}
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

            <div className="reasoning-step-content">
              <strong>{step.label}</strong>
            </div>

            <div className="reasoning-step-actions">
              <button
                type="button"
                aria-label="Subir"
                title="Subir"
                className="reasoning-move-btn"
                onClick={() => onMove(step.id, -1)}
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
                onClick={() => onMove(step.id, 1)}
                disabled={index === steps.length - 1}
              >
                <ArrowDown size={14} />
                <span className="reasoning-btn-text">Bajar</span>
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

