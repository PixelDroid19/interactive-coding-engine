import React from 'react';
import { ReasoningConnection, ReasoningNode } from '../../../types/curriculum';

interface FlowchartDiagramProps {
  nodes: Array<ReasoningNode & { role: string }>;
  connections: ReasoningConnection[];
}

export function FlowchartDiagram({ nodes, connections }: FlowchartDiagramProps) {
  const label = connections.length
    ? connections.map((edge) => `${edge.from} conduce a ${edge.to}${edge.label ? ` cuando ${edge.label}` : ''}`).join('. ')
    : 'Todavía no hay conexiones seleccionadas.';
  return (
    <div className="reasoning-flow" role="img" aria-label={`Diagrama de flujo. ${label}`}>
      {nodes.map((node) => <div key={node.id} className={`reasoning-node is-${node.role}`}><small>{node.role}</small>{node.label}</div>)}
    </div>
  );
}
