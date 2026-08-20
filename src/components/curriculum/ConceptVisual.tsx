import React from 'react';
import { ArrowRight, Box, Check, FunctionSquare, Layers, List, Repeat, Split, Terminal, Timer, X } from 'lucide-react';
import { ConceptVisualKind } from '../../curriculum/fundamentos/roadmap';

export const ConceptVisual: React.FC<{ kind: ConceptVisualKind }> = ({ kind }) => {
  if (kind === 'terminal') {
    return (
      <div className="rv-stage-card rv-stage-dark">
        <div className="rv-term-dots">
          <span />
          <span />
          <span />
          <small>salida</small>
        </div>
        <div className="rv-term-line">
          <span className="rv-term-prompt">$</span> node app.js
        </div>
        <div className="rv-term-out">
          Hola, Alex
          <span className="rv-caret" />
        </div>
      </div>
    );
  }

  if (kind === 'algorithm') {
    return (
      <div className="rv-algo">
        <div className="rv-algo-step">
          <span>1. Entrada</span>
          <strong>Datos</strong>
        </div>
        <ArrowRight size={16} />
        <div className="rv-algo-step rv-algo-mid">
          <span>2. Proceso</span>
          <strong>Pasos</strong>
        </div>
        <ArrowRight size={16} />
        <div className="rv-algo-step rv-algo-out">
          <span>3. Salida</span>
          <strong>Resultado</strong>
        </div>
      </div>
    );
  }

  if (kind === 'variable') {
    return (
      <div className="rv-var">
        <div>
          <small>Nombre</small>
          <div className="rv-chip-yellow">let saldo</div>
        </div>
        <ArrowRight size={16} />
        <div>
          <small>Memoria</small>
          <div className="rv-chip-dark">
            <Box size={14} /> 500
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'operator') {
    return (
      <div className="rv-ops">
        <span>50</span>
        <strong>*</strong>
        <span>3</span>
        <strong>-</strong>
        <span>10</span>
        <ArrowRight size={16} />
        <em>140</em>
      </div>
    );
  }

  if (kind === 'condition') {
    return (
      <div className="rv-cond">
        <div className="rv-chip-yellow">if (edad &gt;= 18)</div>
        <div className="rv-cond-split">
          <div className="rv-cond-yes">
            <Check size={14} /> camino if
          </div>
          <div className="rv-cond-no">
            <X size={14} /> camino else
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'loop') {
    return (
      <div className="rv-loop">
        <div className="rv-loop-ring">
          <Repeat size={22} />
        </div>
        <div>
          <strong>Repetir</strong>
          <span>i = 1 → 2 → 3 …</span>
          <small>hasta que la condición falle</small>
        </div>
      </div>
    );
  }

  if (kind === 'function') {
    return (
      <div className="rv-fn">
        <span>entrada</span>
        <ArrowRight size={14} />
        <div className="rv-chip-yellow">
          <FunctionSquare size={14} /> función
        </div>
        <ArrowRight size={14} />
        <span>return</span>
      </div>
    );
  }

  if (kind === 'list') {
    return (
      <div className="rv-list">
        <List size={16} />
        <div className="rv-list-cells">
          <em>0</em>
          <em>1</em>
          <em>2</em>
        </div>
        <small>el primero es índice 0</small>
      </div>
    );
  }

  if (kind === 'object') {
    return (
      <div className="rv-obj">
        <div className="rv-chip-dark">
          nombre: "Té"
          <br />
          precio: 4
        </div>
        <small>se busca por nombre, no por posición</small>
      </div>
    );
  }

  if (kind === 'scope') {
    return (
      <div className="rv-scope">
        <div className="rv-scope-outer">
          afuera
          <div className="rv-scope-inner">
            adentro: n
            <small>el closure recuerda n</small>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'bigo') {
    return (
      <div className="rv-bigo">
        <Timer size={18} />
        <div>
          <strong>O(1) · O(n) · O(n²)</strong>
          <small>cuánto crece el trabajo si crecen los datos</small>
        </div>
      </div>
    );
  }

  return (
    <div className="rv-algo">
      <Layers size={18} />
      <Split size={18} />
      <Terminal size={18} />
    </div>
  );
};
