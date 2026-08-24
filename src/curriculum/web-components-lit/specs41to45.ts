import { appHtml, browserTest, lesson, source, sourceTest } from './helpers';

export const COMPONENT_SPECS_41_TO_45 = [
  lesson({
    number: 41,
    module: 16,
    title: 'Mixins heredados y composición moderna',
    appName: 'un panel de viewport reutilizable que conserva toda la cadena de ciclo de vida',
    summary: 'Comprende los mixins de clases que encontrarás en proyectos existentes y decide cuándo reemplazarlos por controllers o composición.',
    concepts: [
      { label: 'Class mixin', desc: 'Función que recibe una clase base y devuelve otra clase que la extiende.' },
      { label: 'Cadena de super', desc: 'Secuencia de callbacks heredados que cada capa debe continuar.' },
    ],
    skillsRequired: ['lit-controllers', 'lit-super-callbacks'],
    skillsIntroduced: ['lit-class-mixins', 'mixin-super-chain'],
    reasoningSteps: ['LitElement entra al mixin', 'El mixin añade estado y ciclo', 'ViewportPanel hereda la nueva clase', 'Cada callback llama a super y mantiene la cadena'],
    html: appHtml('Viewport', '<viewport-panel></viewport-panel>'),
    example: `import { LitElement, html } from 'lit';

const WithLocale = (Base) =>
  class extends Base {
    static properties = { locale: { type: String } };

    constructor() {
      super();
      this.locale = 'es-CO';
    }

    formatNumber(value) {
      return new Intl.NumberFormat(this.locale).format(value);
    }
  };

class PriceLabel extends WithLocale(LitElement) {
  render() {
    return html\`<p>\${this.formatNumber(1250)}</p>\`;
  }
}

customElements.define('price-label', PriceLabel);`,
    starter: `import { LitElement, html } from 'lit';

const WithViewport = (Base) =>
  class extends Base {
    static properties = {};

    constructor() {
      super();
      this.viewportWidth = 0;
      // Conserva un manejador estable para conectar y limpiar.
    }

    connectedCallback() {
      // Continúa la cadena, escucha resize y toma la primera medida.
    }

    disconnectedCallback() {
      // Retira el mismo listener y continúa la cadena.
    }
  };

class ViewportPanel extends WithViewport(LitElement) {
  render() {
    return html\`<p>\${this.viewportWidth} px</p>\`;
  }
}

customElements.define('viewport-panel', ViewportPanel);`,
    challengeTitle: 'App: mixin de viewport sin romper Lit',
    challengeInstructions: 'Completa WithViewport con estado reactivo, cadena de super, listener estable, primera medición y limpieza simétrica.',
    tests: [
      sourceTest('lit41-chain', 'Conserva ambos callbacks de la clase base', String.raw`connectedCallback[\s\S]*super\.connectedCallback\s*\([\s\S]*disconnectedCallback[\s\S]*super\.disconnectedCallback\s*\(`),
      sourceTest('lit41-cleanup', 'Usa una referencia estable para añadir y retirar resize', String.raw`addEventListener\s*\(\s*['"]resize['"][\s\S]*removeEventListener\s*\(\s*['"]resize['"]`),
      browserTest('lit41-runtime', 'El panel obtiene y muestra una medida real', `async ({document,customElements})=>{await customElements.whenDefined('viewport-panel');const el=document.querySelector('viewport-panel');await Promise.race([el.updateComplete,new Promise(resolve=>setTimeout(resolve,150))]);return Number(el.viewportWidth)>0&&Boolean(el.shadowRoot?.textContent.includes('px'));}`),
    ],
    hints: ['El mixin devuelve una clase; no crea una instancia por su cuenta.', 'La misma función que escucha resize debe llegar a removeEventListener.', 'Cada callback sobrescrito conserva el comportamiento anterior con super.'],
    model: 'Un mixin añade una capa a la cadena de herencia. Esa capa puede ofrecer estado y métodos, pero también hereda la obligación de no cortar los callbacks que LitElement necesita para conectarse, actualizar y limpiar.',
    whenToUse: 'Mantén un mixin cuando debes ampliar varias clases y el contrato heredado ya es estable; prefiere Reactive Controller para lógica con ciclo que no necesita modificar la clase ni participar en super.',
    bestPractices: 'Documenta propiedades y callbacks añadidos, conserva super en cada capa, evita colisiones de nombres y no apiles mixins cuyo orden cambie silenciosamente el resultado.',
    commonErrors: 'confundir mezcla de objetos con class mixin, omitir super, crear listeners anónimos, sobrescribir static properties de otra capa o esconder demasiadas responsabilidades en herencia.',
    transfer: 'Compara un mixin de viewport, un controller de red y una función de formato; decide cuál necesita herencia, ciclo o solo datos.',
    sources: [
      source('Mixins', 'https://lit.dev/docs/composition/mixins/', 'Comprende el patrón de clases y sus límites.', 'Lit'),
      source('Reactive Controllers', 'https://lit.dev/docs/composition/controllers/', 'Compara composición con herencia.', 'Lit'),
      source('super', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/super', 'Revisa la cadena heredada.'),
    ],
    debug: {
      title: 'El mixin corta connectedCallback y Lit deja de actualizar',
      expected: 'presence-card conserva la conexión de Lit y muestra Disponible.',
      observed: 'El callback del mixin nunca continúa la clase base.',
      starter: `import { LitElement, html } from 'lit';

const WithPresence = (Base) =>
  class extends Base {
    connectedCallback() {
      this.presence = 'Disponible';
    }
  };

class PresenceCard extends WithPresence(LitElement) {
  render() {
    return html\`<p>\${this.presence ?? 'Sin estado'}</p>\`;
  }
}

customElements.define('presence-card', PresenceCard);`,
      tests: [
        sourceTest('lit41-d1', 'El mixin continúa la cadena', String.raw`connectedCallback\s*\([^)]*\)\s*\{\s*super\.connectedCallback\s*\(`),
        browserTest('lit41-d2', 'La tarjeta renderiza después de conectarse', `async ({document,customElements})=>{await customElements.whenDefined('presence-card');const el=document.querySelector('presence-card');await el.updateComplete;return el.shadowRoot.textContent.includes('Disponible');}`),
      ],
      hints: ['PresenceCard todavía depende del ciclo de LitElement.', 'El mixin está entre ambas clases.', 'Continúa el callback antes de añadir el comportamiento de presencia.'],
    },
  }),
  lesson({
    number: 42,
    module: 17,
    title: 'Grafos, dependencias y ciclos antes de la interfaz',
    appName: 'un planificador de dependencias que rechaza ciclos antes de mutar su grafo',
    summary: 'Modela nodos y aristas en JavaScript puro y protege el estado comprobando si una conexión cerraría un ciclo.',
    concepts: [
      { label: 'Grafo dirigido', desc: 'Conjunto de nodos unidos por aristas que tienen dirección.' },
      { label: 'Detección de ciclo', desc: 'Comprobación de si una nueva dependencia crea un camino de regreso.' },
    ],
    skillsRequired: ['professional-capstone', 'integration-evidence'],
    skillsIntroduced: ['relay-graph-model', 'cycle-rejection'],
    reasoningSteps: ['El usuario propone origen → destino', 'El motor busca destino → origen', 'Si existe camino, rechaza sin mutar', 'Si no existe, crea una nueva lista de aristas'],
    html: appHtml('Dependencias', '<dependency-planner></dependency-planner>'),
    example: `function hasRoute(edges, start, target) {
  const pending = [start];
  const visited = new Set();

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of edges) {
      if (edge.from === current) pending.push(edge.to);
    }
  }
  return false;
}

console.log(hasRoute([{ from: 'datos', to: 'vista' }], 'datos', 'vista'));`,
    starter: `import { LitElement, html } from 'lit';

class RelayGraph {
  constructor(nodeIds) {
    this.nodes = new Set(nodeIds);
    this.edges = [];
  }

  hasPath(from, to) {
    // Recorre las aristas sin quedar atrapado en nodos repetidos.
  }

  canConnect(from, to) {
    // Valida nodos, mismo nodo, duplicados y posible ciclo.
  }

  connect(from, to) {
    // Solo crea una arista nueva cuando el contrato lo permite.
  }
}

class DependencyPlanner extends LitElement {
  constructor() {
    super();
    this.graph = new RelayGraph(['a', 'b', 'c']);
    this.graph.connect('a', 'b');
    this.graph.connect('b', 'c');
    this.message = 'Listo';
  }

  connect(from, to) {
    const accepted = this.graph.connect(from, to);
    this.message = accepted ? 'Conectado' : 'Rechazado: ciclo o conexión inválida';
    this.requestUpdate();
    return accepted;
  }

  render() {
    return html\`<p role="status">\${this.message}</p>
      <p>Aristas: \${this.graph.edges.length}</p>\`;
  }
}

customElements.define('dependency-planner', DependencyPlanner);`,
    challengeTitle: 'App: grafo que se protege antes de cambiar',
    challengeInstructions: 'Implementa hasPath, canConnect y connect. Debe aceptar a→b→c, rechazar c→a y conservar las aristas al rechazar.',
    tests: [
      browserTest('lit42-accept', 'Acepta una dependencia válida en otro grafo', `async ({document,customElements})=>{await customElements.whenDefined('dependency-planner');const C=document.querySelector('dependency-planner').graph.constructor;const graph=new C(['x','y','z']);return graph.connect('x','y')===true&&graph.edges.length===1;}`),
      browserTest('lit42-cycle', 'Rechaza el ciclo antes de mutar', `async ({document})=>{const el=document.querySelector('dependency-planner');const before=el.graph.edges.length;const accepted=el.connect('c','a');await el.updateComplete;return accepted===false&&el.graph.edges.length===before&&el.shadowRoot.textContent.includes('Rechazado');}`),
      browserTest('lit42-duplicate', 'Rechaza una arista duplicada', `async ({document})=>{const el=document.querySelector('dependency-planner');const before=el.graph.edges.length;return el.connect('a','b')===false&&el.graph.edges.length===before;}`),
    ],
    hints: ['Para saber si from→to cierra un ciclo, investiga si ya existe un camino to→from.', 'Un Set visited evita volver a procesar el mismo nodo.', 'Valida completamente antes de asignar el nuevo array de edges.'],
    model: 'El grafo es el estado de dominio; el componente solo publica intención y representa el resultado. Rechazar antes de mutar conserva una invariante: el estado almacenado siempre sigue siendo legal.',
    whenToUse: 'Usa un grafo cuando las relaciones son parte del problema y no existe un único padre lineal; una lista o árbol es más sencillo si cada elemento tiene una sola relación predecible.',
    bestPractices: 'Mantén el motor sin DOM, usa ids estables, separa validación de mutación, devuelve motivos de rechazo y prueba ciclos cortos, largos, duplicados y nodos ausentes.',
    commonErrors: 'calcular por posición visual, mutar y luego intentar deshacer un ciclo, recorrer sin visited, confundir arista dirigida con relación simétrica o devolver NaN ante una entrada incompleta.',
    transfer: 'Modela dependencias de tareas, módulos y celdas de una hoja; explica qué conexión sería ilegal en cada caso.',
    sources: [
      source('Graph data structure', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map', 'Usa Map y Set como piezas del modelo.'),
      source('Set', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set', 'Controla nodos visitados.'),
    ],
    debug: {
      title: 'El motor inserta la arista y después descubre el ciclo',
      expected: 'safe-graph rechaza c→a sin cambiar edges.',
      observed: 'Conserva la conexión ilegal aunque devuelve false.',
      starter: `class SafeGraph extends HTMLElement {
  constructor() {
    super();
    this.edges = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ];
  }

  connect(from, to) {
    this.edges.push({ from, to });
    const illegal = from === 'c' && to === 'a';
    return !illegal;
  }
}

customElements.define('safe-graph', SafeGraph);`,
      tests: [
        browserTest('lit42-d1', 'El rechazo no altera el grafo', `async ({document,customElements})=>{await customElements.whenDefined('safe-graph');const el=document.querySelector('safe-graph');const before=el.edges.length;return el.connect('c','a')===false&&el.edges.length===before;}`),
        sourceTest('lit42-d2', 'Valida antes de insertar', String.raw`if[\s\S]*return\s+false[\s\S]*(?:push|this\.edges\s*=)`),
      ],
      hints: ['El valor de retorno no repara el estado.', 'Decide si es legal antes de insertar.', 'El camino rechazado termina sin tocar edges.'],
    },
  }),
  lesson({
    number: 43,
    module: 17,
    title: 'Orden topológico y evaluadores como Bridge',
    appName: 'un circuito que calcula fuentes y operadores en el orden real de sus dependencias',
    summary: 'Evalúa un grafo acíclico por dependencias y desacopla cada tipo de nodo mediante una tabla de implementaciones.',
    concepts: [
      { label: 'Orden topológico', desc: 'Orden donde cada nodo aparece después de todas sus dependencias.' },
      { label: 'Bridge de evaluadores', desc: 'Tabla que separa el tipo de nodo de la implementación que calcula su salida.' },
    ],
    skillsRequired: ['relay-graph-model', 'cycle-rejection', 'bridge-pattern'],
    skillsIntroduced: ['topological-evaluation', 'relay-evaluator-bridge'],
    reasoningSteps: ['Calcula indegree por nodo', 'Encola fuentes sin entradas', 'Evalúa y libera sus destinos', 'El Bridge elige la función sin cambiar el motor'],
    html: appHtml('Circuito', '<relay-calculator></relay-calculator>'),
    example: `const formatters = {
  text: (value) => String(value),
  percent: (value) => \`\${Math.round(value * 100)}%\`,
};

function present(kind, value, implementations = formatters) {
  const formatter = implementations[kind];
  if (!formatter) throw new Error(\`Sin implementación para \${kind}\`);
  return formatter(value);
}

console.log(present('percent', 0.42));`,
    starter: `import { LitElement, html } from 'lit';

const evaluators = {
  number: (node) => node.value,
  add: (_node, inputs) => inputs.a + inputs.b,
  display: (_node, inputs) => inputs.value,
};

function topologicalOrder(graph) {
  // Devuelve ids: toda dependencia debe aparecer antes que su destino.
}

function evaluateGraph(graph, implementations = evaluators) {
  // Recorre el orden, reúne entradas por puerto y calcula outputs por id.
}

class RelayCalculator extends LitElement {
  constructor() {
    super();
    this.graph = {
      nodes: [
        { id: 'slider', kind: 'number', value: 36 },
        { id: 'fixed', kind: 'number', value: 14 },
        { id: 'sum', kind: 'add' },
        { id: 'screen', kind: 'display' },
      ],
      edges: [
        { from: 'slider', to: 'sum', port: 'a' },
        { from: 'fixed', to: 'sum', port: 'b' },
        { from: 'sum', to: 'screen', port: 'value' },
      ],
    };
    this.snapshot = { outputs: new Map(), order: [] };
  }

  run() {
    this.snapshot = evaluateGraph(this.graph);
    this.requestUpdate();
    return this.snapshot;
  }

  render() {
    return html\`<button @click=\${() => this.run()}>Evaluar</button>
      <output>\${this.snapshot.outputs.get('screen') ?? '--'}</output>
      <p>Orden: \${this.snapshot.order.join(' → ')}</p>\`;
  }
}

customElements.define('relay-calculator', RelayCalculator);`,
    challengeTitle: 'App: motor de evaluación independiente de Lit',
    challengeInstructions: 'Implementa topologicalOrder y evaluateGraph. El visor debe producir 50, el orden debe respetar dependencias y el motor debe aceptar otra tabla de evaluadores.',
    tests: [
      browserTest('lit43-value', 'El circuito calcula 36 + 14 = 50', `async ({document,customElements})=>{await customElements.whenDefined('relay-calculator');const el=document.querySelector('relay-calculator');const snap=el.run();if(!snap?.outputs)return false;await el.updateComplete;return snap.outputs.get('screen')===50&&Boolean(el.shadowRoot?.querySelector('output')?.textContent.includes('50'));}`),
      browserTest('lit43-order', 'El orden coloca fuentes antes de suma y visor', `async ({document})=>{const order=document.querySelector('relay-calculator')?.snapshot?.order;if(!Array.isArray(order))return false;return order.indexOf('slider')<order.indexOf('sum')&&order.indexOf('fixed')<order.indexOf('sum')&&order.indexOf('sum')<order.indexOf('screen');}`),
      sourceTest('lit43-bridge', 'La implementación se selecciona desde una tabla', String.raw`implementations\s*\[[^\]]*(?:kind|\.kind)[^\]]*\]`),
    ],
    hints: ['indegree cuenta cuántas entradas pendientes tiene cada nodo.', 'Al evaluar una fuente, reduce indegree de sus destinos y encola los que llegan a cero.', 'El motor consulta implementations[node.kind]; no necesita un if por cada tipo.'],
    model: 'El orden topológico responde cuándo puede calcularse un nodo; el Bridge responde cómo se calcula ese tipo. Separar ambas preguntas permite añadir operadores sin reescribir el recorrido del grafo.',
    whenToUse: 'Usa orden topológico para dependencias acíclicas como builds, fórmulas y circuitos; un recorrido lineal basta cuando el orden ya está fijado por el contrato.',
    bestPractices: 'Devuelve order, outputs y errores como snapshot, detecta si quedan nodos sin procesar, nombra puertos faltantes y pasa la tabla de evaluadores como dependencia.',
    commonErrors: 'evaluar de izquierda a derecha, usar la posición del array, mezclar render con cálculo, devolver NaN por puertos ausentes o codificar cada kind dentro de un switch gigante.',
    transfer: 'Añade mentalmente nodos multiply y compare sin modificar topologicalOrder; explica qué función nueva entra al Bridge.',
    sources: [
      source('Map', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map', 'Conserva outputs por identidad.'),
      source('Design patterns and Lit', 'https://lit.dev/docs/composition/overview/', 'Relaciona composición e implementaciones.', 'Lit'),
    ],
    debug: {
      title: 'El motor calcula según el orden visual del array',
      expected: 'formula-view obtiene 5 aunque el operador aparezca primero.',
      observed: 'add se evalúa antes de sus fuentes y produce NaN.',
      starter: `import { LitElement, html } from 'lit';

class FormulaView extends LitElement {
  constructor() {
    super();
    this.nodes = [
      { id: 'add', kind: 'add', deps: ['a', 'b'] },
      { id: 'a', kind: 'number', value: 2 },
      { id: 'b', kind: 'number', value: 3 },
    ];
    this.values = new Map();
  }

  calculate() {
    for (const node of this.nodes) {
      const value =
        node.kind === 'number'
          ? node.value
          : this.values.get(node.deps[0]) + this.values.get(node.deps[1]);
      this.values.set(node.id, value);
    }
    this.requestUpdate();
  }

  render() {
    return html\`<p>\${this.values.get('add') ?? '--'}</p>\`;
  }
}

customElements.define('formula-view', FormulaView);`,
      tests: [
        browserTest('lit43-d1', 'Calcula las dependencias antes del operador', `async ({document,customElements})=>{await customElements.whenDefined('formula-view');const el=document.querySelector('formula-view');el.calculate();await el.updateComplete;return el.values.get('add')===5;}`),
        sourceTest('lit43-d2', 'No depende del orden original', String.raw`(?:topological|pending|indegree|while\s*\()`),
      ],
      hints: ['El primer elemento del array todavía no tiene entradas.', 'Construye un orden a partir de deps.', 'Evalúa una pieza solo cuando sus dependencias ya existen.'],
    },
  }),
  lesson({
    number: 44,
    module: 18,
    title: 'Relé visual: eventos públicos y arrastre desacoplado',
    appName: 'un tablero de nodos donde los hijos publican intención y el estudio conserva las posiciones',
    summary: 'Conecta componentes visuales mediante eventos compuestos y encapsula el gesto de arrastre sin trasladar la propiedad del grafo a los nodos.',
    concepts: [
      { label: 'Evento de intención', desc: 'Mensaje que describe lo solicitado sin mutar el estado del dueño.' },
      { label: 'Pointer capture', desc: 'Mecanismo que mantiene el flujo de puntero aunque salga del elemento.' },
    ],
    skillsRequired: ['lit-class-mixins', 'mixin-super-chain', 'relay-evaluator-bridge'],
    skillsIntroduced: ['relay-event-contracts', 'pointer-drag-mixin'],
    reasoningSteps: ['relay-node captura el puntero', 'El mixin calcula la nueva posición', 'node-move cruza Shadow DOM', 'relay-board reemplaza el nodo y vuelve a renderizar'],
    html: appHtml('Tablero Relé', '<relay-board></relay-board>'),
    example: `import { LitElement, html } from 'lit';

class QuantityControl extends LitElement {
  changeBy(delta) {
    this.dispatchEvent(
      new CustomEvent('quantity-change', {
        detail: { delta },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html\`<button @click=\${() => this.changeBy(1)}>Aumentar</button>\`;
  }
}

customElements.define('quantity-control', QuantityControl);`,
    starter: `import { LitElement, html } from 'lit';

const MoveIntentMixin = (Base) =>
  class extends Base {
    moveTo(x, y, live = false) {
      // Emite node-move con id, coordenadas, live, bubbles y composed.
    }

    beginPointerDrag(event) {
      // Captura el puntero y traduce pointermove a moveTo.
    }
  };

class RelayNode extends MoveIntentMixin(LitElement) {
  static properties = { node: { attribute: false } };
  render() {
    return html\`<button @pointerdown=\${(event) => this.beginPointerDrag(event)}>
      \${this.node.label}
    </button>\`;
  }
}

class RelayBoard extends LitElement {
  static properties = { nodes: { state: true } };
  constructor() {
    super();
    this.nodes = [{ id: 'n1', label: 'Fuente', x: 0, y: 0 }];
    this.addEventListener('node-move', (event) => this.applyMove(event.detail));
  }

  applyMove(detail) {
    // Reemplaza solo el nodo indicado; el hijo no es dueño de nodes.
  }

  render() {
    return html\`\${this.nodes.map(
        (node) => html\`<relay-node .node=\${node}></relay-node>\`,
      )}
      <p>\${this.nodes[0].x}, \${this.nodes[0].y}</p>\`;
  }
}

customElements.define('relay-node', RelayNode);
customElements.define('relay-board', RelayBoard);`,
    challengeTitle: 'App: nodo arrastrable con dueño de estado',
    challengeInstructions: 'Completa el evento node-move, pointer capture y actualización inmutable. moveTo(24, 12) debe actualizar el tablero sin que relay-node posea la colección.',
    tests: [
      sourceTest('lit44-pointer', 'Captura el puntero durante el arrastre', String.raw`setPointerCapture\s*\(`),
      browserTest('lit44-event', 'El evento cruza la frontera y conserva el contrato', `async ({document,customElements})=>{await customElements.whenDefined('relay-board');const board=document.querySelector('relay-board');await board.updateComplete;const node=board.shadowRoot?.querySelector('relay-node');if(!node)return false;await node.updateComplete;let observed;board.addEventListener('node-move',e=>observed=e,{once:true});node.moveTo(24,12,false);await board.updateComplete;return Boolean(observed?.bubbles&&observed?.composed&&observed.detail.nodeId==='n1'&&board.nodes[0].x===24&&board.nodes[0].y===12);}`),
      sourceTest('lit44-owner', 'El tablero reemplaza nodes de forma inmutable', String.raw`this\.nodes\s*=\s*this\.nodes\.map`),
    ],
    hints: ['node.id viaja en detail; la colección completa no sale del tablero.', 'CustomEvent necesita bubbles y composed para cruzar el shadow root.', 'setPointerCapture recibe event.pointerId y mantiene la secuencia.'],
    model: 'El nodo conoce el gesto y publica intención; el tablero conoce el grafo y decide la transición. Esta separación permite cambiar ratón por teclado o touch sin duplicar el estado.',
    whenToUse: 'Usa eventos para intención ascendente y propiedades para datos descendentes; un callback directo puede bastar dentro de una sola implementación sin Shadow DOM.',
    bestPractices: 'Define detail mínimo, bubbles/composed intencionales, pointer capture, coordenadas normalizadas, un solo commit al soltar y una alternativa de teclado para mover.',
    commonErrors: 'mutar el nodo recibido, emitir toda la colección, perder pointerup fuera del elemento, guardar cada pixel en undo o usar eventos globales sin dueño.',
    transfer: 'Diseña contratos para conectar puertos, seleccionar cable, borrar nodo y cancelar con Escape sin exponer métodos privados.',
    sources: [
      source('Pointer capture', 'https://developer.mozilla.org/docs/Web/API/Element/setPointerCapture', 'Mantén una secuencia de arrastre.'),
      source('CustomEvent', 'https://developer.mozilla.org/docs/Web/API/CustomEvent', 'Publica intención con detail.'),
      source('Events', 'https://lit.dev/docs/components/events/', 'Integra eventos con templates Lit.', 'Lit'),
    ],
    debug: {
      title: 'node-move queda atrapado dentro del nodo',
      expected: 'relay-canvas observa node-move desde su hijo.',
      observed: 'El evento no burbujea ni atraviesa Shadow DOM.',
      starter: `import { LitElement, html } from 'lit';

class BrokenNode extends LitElement {
  move() {
    this.dispatchEvent(new CustomEvent('node-move', { detail: { x: 10, y: 5 } }));
  }
  render() {
    return html\`<button @click=\${() => this.move()}>Mover</button>\`;
  }
}

class RelayCanvas extends LitElement {
  constructor() {
    super();
    this.position = '0, 0';
    this.addEventListener('node-move', (event) => {
      this.position = \`\${event.detail.x}, \${event.detail.y}\`;
      this.requestUpdate();
    });
  }
  render() {
    return html\`<broken-node></broken-node>
      <p>\${this.position}</p>\`;
  }
}

customElements.define('broken-node', BrokenNode);
customElements.define('relay-canvas', RelayCanvas);`,
      tests: [
        sourceTest('lit44-d1', 'El evento burbujea', String.raw`bubbles\s*:\s*true`),
        sourceTest('lit44-d2', 'El evento cruza Shadow DOM', String.raw`composed\s*:\s*true`),
        browserTest('lit44-d3', 'El canvas recibe la posición', `async ({document,customElements})=>{await customElements.whenDefined('relay-canvas');const canvas=document.querySelector('relay-canvas');await canvas.updateComplete;const node=canvas.shadowRoot.querySelector('broken-node');await node.updateComplete;node.shadowRoot.querySelector('button').click();await canvas.updateComplete;return canvas.shadowRoot.textContent.includes('10, 5');}`),
      ],
      hints: ['El listener vive fuera del shadow root del nodo.', 'bubbles recorre ancestros.', 'composed autoriza cruzar la frontera.'],
    },
  }),
  lesson({
    number: 45,
    module: 19,
    title: 'Proyecto Relé: reloj, historial y entrega profesional',
    appName: 'un estudio de circuitos que calcula 50, rechaza ciclos y separa pulsos automáticos del undo humano',
    summary: 'Integra el motor puro y los componentes Lit cuidando que recursos temporales, historial y pruebas representen contratos distintos.',
    concepts: [
      { label: 'Historial de comandos', desc: 'Secuencia de cambios intencionales que el usuario puede deshacer.' },
      { label: 'Estado efímero', desc: 'Dato temporal como un tick que cambia la vista pero no representa un comando humano.' },
    ],
    skillsRequired: ['topological-evaluation', 'relay-evaluator-bridge', 'relay-event-contracts', 'pointer-drag-mixin'],
    skillsIntroduced: ['relay-capstone', 'ephemeral-vs-command-state'],
    reasoningSteps: ['Un comando humano clona y guarda el grafo', 'El motor valida y evalúa', 'El reloj cambia solo su salida efímera', 'disconnectedCallback detiene el intervalo y undo conserva intención'],
    html: appHtml('Estudio Relé', '<relay-studio></relay-studio>'),
    example: `class CommandHistory {
  constructor(initial) {
    this.past = [];
    this.present = structuredClone(initial);
  }

  commit(next) {
    this.past = [...this.past, structuredClone(this.present)];
    this.present = structuredClone(next);
  }

  undo() {
    if (this.past.length === 0) return this.present;
    this.present = this.past.at(-1);
    this.past = this.past.slice(0, -1);
    return structuredClone(this.present);
  }
}

const history = new CommandHistory({ volume: 20 });
history.commit({ volume: 35 });
console.log(history.undo());`,
    supportFiles: {
      'relay-engine.js': `export function evaluateRelay(graph) {
  const indegree = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges) indegree.set(edge.to, indegree.get(edge.to) + 1);
  const pending = graph.nodes
    .filter((node) => indegree.get(node.id) === 0)
    .map((node) => node.id);
  const outputs = new Map();

  while (pending.length > 0) {
    const id = pending.shift();
    const node = graph.nodes.find((candidate) => candidate.id === id);
    const inputs = Object.fromEntries(
      graph.edges
        .filter((edge) => edge.to === id)
        .map((edge) => [edge.port, outputs.get(edge.from)]),
    );
    const value =
      node.kind === 'number'
        ? node.value
        : node.kind === 'add'
          ? inputs.a + inputs.b
          : inputs.value;
    outputs.set(id, value);
    for (const edge of graph.edges.filter((candidate) => candidate.from === id)) {
      indegree.set(edge.to, indegree.get(edge.to) - 1);
      if (indegree.get(edge.to) === 0) pending.push(edge.to);
    }
  }
  return outputs.get('screen');
}`,
    },
    starter: `import { LitElement, html } from 'lit';
import { evaluateRelay } from './relay-engine.js';

class RelayStudio extends LitElement {
  static properties = {
    graph: { state: true },
    clockValue: { state: true },
    output: { state: true },
  };

  constructor() {
    super();
    this.graph = {
      nodes: [
        { id: 'slider', kind: 'number', value: 36 },
        { id: 'fixed', kind: 'number', value: 14 },
        { id: 'sum', kind: 'add' },
        { id: 'screen', kind: 'display' },
      ],
      edges: [
        { from: 'slider', to: 'sum', port: 'a' },
        { from: 'fixed', to: 'sum', port: 'b' },
        { from: 'sum', to: 'screen', port: 'value' },
      ],
    };
    this.history = [];
    this.clockValue = 0;
    this.output = evaluateRelay(this.graph);
  }

  connectedCallback() {
    super.connectedCallback();
    // Inicia un reloj que llama tickClock sin crear comandos.
  }

  disconnectedCallback() {
    // Limpia el intervalo y conserva la cadena de Lit.
  }

  wouldCreateCycle(from, to) {
    // Reutiliza el modelo de grafo para investigar to → from.
  }

  connect(from, to, port = 'value') {
    // Rechaza antes de mutar; un cambio humano válido sí entra al historial.
  }

  tickClock() {
    // Alterna 0/1 sin modificar graph ni history.
  }

  evaluate() {
    this.output = evaluateRelay(this.graph);
    this.requestUpdate();
    return this.output;
  }

  undo() {
    // Restaura el último grafo humano y vuelve a evaluar.
  }

  render() {
    return html\`<p role="status">Salida: \${this.output}</p>
      <p>Reloj: \${this.clockValue}</p>
      <p>Comandos: \${this.history.length}</p>\`;
  }
}

customElements.define('relay-studio', RelayStudio);`,
    challengeTitle: 'Capstone: circuito con tiempo e historial correctos',
    challengeInstructions: 'Completa ciclo, connect, tickClock y undo. Conserva 36+14=50, rechaza sum→slider, no guardes ticks y limpia el intervalo al desconectar.',
    tests: [
      browserTest('lit45-initial', 'El circuito inicial conserva el resultado 50', `async ({document,customElements})=>{await customElements.whenDefined('relay-studio');const el=document.querySelector('relay-studio');await el.updateComplete;return el.output===50&&el.shadowRoot.textContent.includes('Salida: 50');}`),
      browserTest('lit45-evaluate', 'La salida responde a otro valor de fuente', `async ({document})=>{const el=document.querySelector('relay-studio');el.graph={...el.graph,nodes:el.graph.nodes.map(node=>node.id==='slider'?{...node,value:10}:node)};const value=el.evaluate();await el.updateComplete;return value===24&&el.shadowRoot.textContent.includes('Salida: 24');}`),
      browserTest('lit45-cycle', 'Rechaza una conexión cíclica sin crear comando', `async ({document})=>{const el=document.querySelector('relay-studio');const edges=el.graph.edges.length;const history=el.history.length;return el.connect('sum','slider')===false&&el.graph.edges.length===edges&&el.history.length===history;}`),
      browserTest('lit45-undo', 'Undo restaura el último grafo humano', `async ({document})=>{const el=document.querySelector('relay-studio');const before=el.graph.edges.length;const accepted=el.connect('slider','fixed','value');if(!accepted)return false;const after=el.graph.edges.length;const undone=el.undo();await el.updateComplete;return after===before+1&&undone!==false&&el.graph.edges.length===before;}`),
      browserTest('lit45-clock', 'Un tick no contamina el historial', `async ({document})=>{const el=document.querySelector('relay-studio');const before=el.history.length;const value=el.clockValue;el.tickClock();await el.updateComplete;return el.history.length===before&&el.clockValue!==value;}`),
      sourceTest('lit45-cleanup', 'El intervalo se limpia al desconectar', String.raw`disconnectedCallback[\s\S]*clearInterval\s*\([\s\S]*super\.disconnectedCallback\s*\(`),
    ],
    hints: ['El reloj cambia clockValue, no graph; por eso no llama al mecanismo de commit.', 'Antes de conectar from→to, busca si to ya alcanza from.', 'Guarda una copia del grafo solo para comandos humanos aceptados.'],
    model: 'El historial cuenta decisiones humanas; el reloj cuenta tiempo. Aunque ambos cambian la interfaz, mezclarlos haría que deshacer recorriera pulsos automáticos en vez del último comando que la persona recuerda.',
    whenToUse: 'Separa estado efímero de comandos cuando sensores, relojes, red o animaciones cambian sin representar intención del usuario; una app sin undo puede mantener un modelo más simple.',
    bestPractices: 'Mantén motor puro, snapshots clonados, ticks sin commit, intervalos con cleanup, eventos públicos, pruebas de invariantes y README que explique arquitectura y decisiones.',
    commonErrors: 'guardar cada pointermove o tick, evaluar dentro de render, dejar intervalos vivos, permitir ciclos temporalmente, testear métodos privados o afirmar entrega solo porque se dibujan nodos.',
    transfer: 'Diseña qué entra al historial en editor de texto colaborativo, reproductor y tablero con datos en vivo.',
    sources: [
      source('Lifecycle', 'https://lit.dev/docs/components/lifecycle/', 'Asocia recursos al ciclo del host.', 'Lit'),
      source('structuredClone', 'https://developer.mozilla.org/docs/Web/API/Window/structuredClone', 'Crea snapshots independientes.'),
      source('Testing', 'https://lit.dev/docs/tools/testing/', 'Prueba contratos en navegador.', 'Lit'),
    ],
    debug: {
      title: 'Cada pulso del reloj crea un paso de deshacer',
      expected: 'clock-studio cambia el pulso sin modificar history.',
      observed: 'tick llama commit y llena el historial sin acciones humanas.',
      starter: `import { LitElement, html } from 'lit';

class ClockStudio extends LitElement {
  static properties = { pulse: { state: true } };
  constructor() {
    super();
    this.pulse = 0;
    this.history = [];
  }
  commit(value) {
    this.history = [...this.history, this.pulse];
    this.pulse = value;
  }
  tick() {
    this.commit(this.pulse === 0 ? 1 : 0);
  }
  render() {
    return html\`<p>\${this.pulse}</p>
      <p>\${this.history.length}</p>\`;
  }
}

customElements.define('clock-studio', ClockStudio);`,
      tests: [
        browserTest('lit45-d1', 'tick cambia pulse sin guardar historial', `async ({document,customElements})=>{await customElements.whenDefined('clock-studio');const el=document.querySelector('clock-studio');const before=el.history.length;const pulse=el.pulse;el.tick();await el.updateComplete;return el.pulse!==pulse&&el.history.length===before;}`),
        sourceTest('lit45-d2', 'tick no llama commit', String.raw`tick\s*\([^)]*\)\s*\{(?![\s\S]*?this\.commit)[\s\S]*?\}`),
      ],
      hints: ['Un pulso no es una orden humana.', 'tick puede cambiar pulse directamente.', 'Reserva commit para acciones que deban aparecer en undo.'],
    },
  }),
];
