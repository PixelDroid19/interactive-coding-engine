import React from 'react';
import { ReasoningConnection, ReasoningNode } from '../../../types/curriculum';
import { DataFlowDiagram } from './DataFlowDiagram';

export function ModuleDependencyDiagram({ modules, dependencies }: { modules: ReasoningNode[]; dependencies: ReasoningConnection[] }) {
  const labels = Object.fromEntries(modules.map((module) => [module.id, module.label]));
  return (
    <div aria-label="Mapa de dependencias entre módulos">
      <div className="reasoning-modules">{modules.map((module) => <span key={module.id}>{module.label}</span>)}</div>
      <DataFlowDiagram connections={dependencies} labels={labels} />
    </div>
  );
}
