import React from 'react';
import { ReasoningConnection } from '../../../types/curriculum';

export function DataFlowDiagram({ connections, labels = {} }: { connections: ReasoningConnection[]; labels?: Record<string, string> }) {
  return (
    <ul className="reasoning-links" aria-label="Flujo de datos seleccionado">
      {connections.length === 0 && <li>Ninguna conexión seleccionada todavía.</li>}
      {connections.map((edge) => <li key={`${edge.from}-${edge.to}-${edge.label ?? ''}`}><strong>{labels[edge.from] ?? edge.from}</strong><span aria-hidden="true">→</span><strong>{labels[edge.to] ?? edge.to}</strong>{edge.label && <em>{edge.label}</em>}</li>)}
    </ul>
  );
}
