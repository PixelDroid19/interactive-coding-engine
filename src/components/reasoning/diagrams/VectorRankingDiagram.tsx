import React from 'react';
import type { ReasoningNode } from '../../../types/curriculum';

export function VectorRankingDiagram({ candidates, order, onMove }: { candidates: Array<ReasoningNode & { score: number }>; order: string[]; onMove: (id: string, delta: number) => void }) {
  return <section aria-label="Orden de similitud" className="space-y-2"><h2 className="text-sm font-bold">Ordena de mayor a menor puntuación</h2>{order.map((id, index) => { const item = candidates.find((candidate) => candidate.id === id)!; return <div key={id} className="flex items-center gap-3 rounded border border-zinc-600 bg-zinc-900 p-3"><strong className="w-7">{index + 1}</strong><span className="flex-1">{item.label}</span><code>{item.score.toFixed(3)}</code><button type="button" onClick={() => onMove(id, -1)} disabled={index === 0}>Subir</button><button type="button" onClick={() => onMove(id, 1)} disabled={index === order.length - 1}>Bajar</button></div>; })}</section>;
}
