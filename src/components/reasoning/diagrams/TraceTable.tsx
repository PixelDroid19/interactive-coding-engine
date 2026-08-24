import React from 'react';
import { ReasoningNode } from '../../../types/curriculum';

interface TraceTableProps {
  columns: string[];
  rows: ReasoningNode[];
  cells: Record<string, string>;
  onChange: (cellId: string, value: string) => void;
}

export function TraceTable({ columns, rows, cells, onChange }: TraceTableProps) {
  return (
    <div className="reasoning-table-wrap">
      <table className="reasoning-table">
        <caption className="sr-only">Tabla para seguir cómo cambian los datos paso a paso</caption>
        <thead><tr><th scope="col">Paso</th>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              {columns.map((column) => {
                const cellId = `${row.id}.${column}`;
                return <td key={cellId}><input aria-label={`${row.label}, ${column}`} value={cells[cellId] ?? ''} onChange={(event) => onChange(cellId, event.target.value)} /></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
