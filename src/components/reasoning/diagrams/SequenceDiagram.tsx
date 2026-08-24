import React from 'react';
import { ReasoningNode } from '../../../types/curriculum';

export function SequenceDiagram({ steps }: { steps: ReasoningNode[] }) {
  return (
    <ol className="reasoning-sequence" aria-label="Secuencia actual">
      {steps.map((step, index) => (
        <li key={step.id}>
          <span aria-hidden="true">{index + 1}</span>
          <strong>{step.label}</strong>
        </li>
      ))}
    </ol>
  );
}
