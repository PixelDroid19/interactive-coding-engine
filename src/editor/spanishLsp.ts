import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorView, hoverTooltip } from '@codemirror/view';

export type SpanishLspLevel =
  | 'program-basics'
  | 'variables'
  | 'conversions'
  | 'operators'
  | 'functions'
  | 'conditionals'
  | 'loops'
  | 'arrays'
  | 'objects'
  | 'array-transformations'
  | 'string-methods'
  | 'modules'
  | 'dom'
  | 'events'
  | 'dom-input';

export interface DocEntry {
  label: string;
  type: 'keyword' | 'variable' | 'function' | 'property';
  level: SpanishLspLevel;
  detail: string;
  info: string;
  apply?: string;
}

const SPANISH_DOCS: DocEntry[] = [
  {
    label: 'console',
    type: 'variable',
    level: 'program-basics',
    detail: 'herramienta para observar mensajes del programa',
    info: 'Receptor: la consola del navegador.\n\nUso habitual:\nconsole.log("mensaje")\n\nError común:\nEscribir console.log sin paréntesis solo nombra la función; no la ejecuta.',
  },
  {
    label: 'log',
    type: 'function',
    level: 'program-basics',
    detail: 'muestra uno o varios valores en la consola',
    info: 'Receptor: console\nParámetros: valores que quieres observar\nRetorno: undefined\nMutación: no cambia los valores\n\nEjemplo:\nconsole.log("Hola")',
  },
  {
    label: 'document',
    type: 'variable',
    level: 'dom',
    detail: 'representa la página HTML',
    info: 'Es la página que ves. Con él puedes buscar recuadros por su id.\n\nEjemplo:\ndocument.getElementById("saludo")',
  },
  {
    label: 'getElementById',
    type: 'function',
    level: 'dom',
    detail: 'busca un recuadro por su id',
    info: 'Busca en la página el elemento que tiene id="...".\n\nParámetro:\n  id: texto entre comillas, sin #\n\nDevuelve:\n  el recuadro o null si no existe\n\nEjemplo:\ndocument.getElementById("linea1")',
    apply: 'getElementById',
  },
  {
    label: 'textContent',
    type: 'property',
    level: 'dom',
    detail: 'texto dentro del recuadro',
    info: 'Es lo que se lee dentro del recuadro. Puedes leerlo o cambiarlo.\n\nEscribir:\ncaja.textContent = "Hola";\n\nLeer:\nlet texto = caja.textContent;',
  },
  {
    label: 'const',
    type: 'keyword',
    level: 'variables',
    detail: 'crea un nombre que no se reasigna',
    info: 'Guarda un valor con nombre. Usa const cuando no vas a reemplazar ese valor después.\n\nEjemplo:\nconst nombre = "Ana";',
  },
  {
    label: 'let',
    type: 'keyword',
    level: 'variables',
    detail: 'crea un nombre cuyo valor puede cambiar',
    info: 'Usa let cuando el programa necesita reasignar el valor.\n\nEjemplo:\nlet intentos = 0;\nintentos = 1;',
  },
  {
    label: 'Number',
    type: 'function',
    level: 'conversions',
    detail: 'convierte texto a número',
    info: 'Convierte un texto que parece número en un número de verdad.\n\nEjemplo:\nNumber("25") → 25\nNumber("hola") → NaN',
  },
  {
    label: 'String',
    type: 'function',
    level: 'conversions',
    detail: 'convierte un dato a texto',
    info: 'Convierte cualquier dato a texto.\n\nEjemplo:\nString(25) → "25"',
  },
  {
    label: 'function',
    type: 'keyword',
    level: 'functions',
    detail: 'define una tarea reutilizable',
    info: 'Define una función con nombre y parámetros. Definirla no la ejecuta.\n\nEjemplo:\nfunction doble(numero) {\n  return numero * 2;\n}',
  },
  {
    label: 'return',
    type: 'keyword',
    level: 'functions',
    detail: 'entrega el resultado de una función',
    info: 'Termina la llamada actual y devuelve un valor a quien llamó la función.\n\nEjemplo:\nreturn ancho * alto;',
  },
  {
    label: 'if',
    type: 'keyword',
    level: 'conditionals',
    detail: 'ejecuta un camino cuando la condición es verdadera',
    info: 'La condición va entre paréntesis y produce true o false.\n\nEjemplo:\nif (edad >= 18) {\n  return "Puede entrar";\n}',
  },
  {
    label: 'else',
    type: 'keyword',
    level: 'conditionals',
    detail: 'cubre el caso contrario',
    info: 'Se ejecuta cuando la condición del if anterior fue false. Úsalo cuando los caminos son excluyentes.',
  },
  {
    label: 'for',
    type: 'keyword',
    level: 'loops',
    detail: 'repite un bloque con inicio, condición y paso',
    info: 'Úsalo para recorrer una cantidad conocida de posiciones.\n\nEjemplo:\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}',
  },
  {
    label: 'while',
    type: 'keyword',
    level: 'loops',
    detail: 'repite mientras una condición sea verdadera',
    info: 'La condición debe poder llegar a false. Si nunca cambia, el bucle no termina.',
  },
  {
    label: 'length',
    type: 'property',
    level: 'arrays',
    detail: 'cantidad de elementos de una lista',
    info: 'length cuenta elementos. Como los índices empiezan en 0, el último índice es length - 1.\n\nEjemplo:\nfrutas.length',
  },
  {
    label: 'push',
    type: 'function',
    level: 'arrays',
    detail: 'agrega un elemento al final del array',
    info: 'Modifica el array y devuelve su nueva longitud.\n\nEjemplo:\nfrutas.push("uva");',
  },
  {
    label: 'pop',
    type: 'function',
    level: 'arrays',
    detail: 'quita y devuelve el último elemento',
    info: 'Modifica el array retirando lo último. Es la operación de salida típica de una pila.',
  },
  {
    label: 'trim',
    type: 'function',
    level: 'string-methods',
    detail: 'quita espacios de los extremos de un string',
    info: 'Receptor: string\nParámetros: ninguno\nRetorno: un string nuevo\nMutación: no cambia el original\n\nEjemplo:\n"  Ana ".trim() → "Ana"\n\nError común:\nOlvidar guardar o devolver el resultado.',
  },
  {
    label: 'toUpperCase',
    type: 'function',
    level: 'string-methods',
    detail: 'devuelve el texto en mayúsculas',
    info: 'Receptor: string\nParámetros: ninguno\nRetorno: un string nuevo\nMutación: no cambia el original\n\nEjemplo:\n"Ana".toUpperCase() → "ANA"',
  },
  {
    label: 'includes',
    type: 'function',
    level: 'string-methods',
    detail: 'comprueba si un string o array contiene un valor',
    info: 'Receptor: string o array\nParámetro: valor buscado\nRetorno: true o false\nMutación: no modifica el receptor\n\nEjemplo:\n["Ana", "Luis"].includes("Luis") → true',
  },
  {
    label: 'endsWith',
    type: 'function',
    level: 'string-methods',
    detail: 'comprueba cómo termina un string',
    info: 'Receptor: string\nParámetro: terminación buscada\nRetorno: booleano\nMutación: no cambia el texto\n\nEjemplo:\n"app.js".endsWith(".js") → true',
  },
  {
    label: 'map',
    type: 'function',
    level: 'array-transformations',
    detail: 'crea un array nuevo transformando cada elemento',
    info: 'La función recibe un elemento y debe devolver su versión transformada. El array original no se modifica.\n\nEjemplo:\nfunction duplicar(n) { return n * 2; }\nnumeros.map(duplicar)',
  },
  {
    label: 'filter',
    type: 'function',
    level: 'array-transformations',
    detail: 'crea un array nuevo conservando algunos elementos',
    info: 'Conserva los elementos para los que la función devuelve true.\n\nEjemplo:\nfunction esPar(n) { return n % 2 === 0; }\nnumeros.filter(esPar)',
  },
  {
    label: 'find',
    type: 'function',
    level: 'array-transformations',
    detail: 'devuelve el primer elemento que cumple una condición',
    info: 'Receptor: array\nParámetro: función de prueba\nRetorno: el primer elemento o undefined\nMutación: no cambia el array\n\nError común:\nEsperar una lista; find devuelve un elemento.',
  },
  {
    label: 'export',
    type: 'keyword',
    level: 'modules',
    detail: 'expone una capacidad de un módulo',
    info: 'Permite que otro archivo importe una función o dato. Exporta solo la interfaz pública necesaria.\n\nEjemplo:\nexport function total(a, b) { return a + b; }',
  },
  {
    label: 'import',
    type: 'keyword',
    level: 'modules',
    detail: 'declara una dependencia con otro módulo',
    info: 'Trae una capacidad exportada por otro archivo. La ruta relativa suele empezar con ./\n\nEjemplo:\nimport { total } from "./reglas.js";\n\nError común:\nCrear importaciones circulares.',
  },
  {
    label: 'addEventListener',
    type: 'function',
    level: 'events',
    detail: 'escucha un evento, como click',
    info: 'Dice: “cuando pase esto, corre estas líneas”.\n\nParámetros:\n  evento: "click", entre comillas\n  función: lo que debe correr después\n\nEjemplo:\nfunction responderAlClick() {\n  caja.textContent = "Hola";\n}\nboton.addEventListener("click", responderAlClick);',
    apply: 'addEventListener',
  },
  {
    label: 'querySelector',
    type: 'function',
    level: 'events',
    detail: 'busca el primer elemento que coincide',
    info: 'Busca con un selector CSS. Para un id usa "#saludo".\n\nEjemplo:\ndocument.querySelector("#saludo")',
  },
  {
    label: 'click',
    type: 'property',
    level: 'events',
    detail: 'evento de clic',
    info: 'Se dispara cuando el usuario pulsa el elemento.',
  },
  {
    label: 'value',
    type: 'property',
    level: 'dom-input',
    detail: 'valor de un input',
    info: 'Es lo que el usuario escribió en un input.\n\nEjemplo:\nlet nombre = input.value;',
  },
];

const LESSON_LEVELS: Record<string, SpanishLspLevel[]> = {
  'fundamentos-01': ['program-basics'],
  'fundamentos-02': ['program-basics'],
  'fundamentos-03': ['program-basics', 'variables'],
  'fundamentos-04': ['program-basics', 'variables', 'operators'],
  'fundamentos-07': ['program-basics', 'variables', 'operators', 'functions'],
  'fundamentos-05': ['program-basics', 'variables', 'operators', 'functions', 'conditionals'],
  'fundamentos-06': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops'],
  'fundamentos-08': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays'],
  'fundamentos-09': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects'],
  'fundamentos-10': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom'],
  'fundamentos-11': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events'],
  'fundamentos-12': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-13': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-14': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-15': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-16': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods'],
  'fundamentos-17': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods'],
  'fundamentos-18': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods'],
  'fundamentos-19': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations'],
  'fundamentos-20': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations'],
  'fundamentos-21': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations'],
  'fundamentos-22': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations', 'modules'],
  'fundamentos-23': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations', 'modules'],
  'fundamentos-24': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations', 'modules'],
};

export function getSpanishDocsForLesson(lessonId?: string): DocEntry[] {
  const levels = (lessonId && LESSON_LEVELS[lessonId]) || LESSON_LEVELS['fundamentos-01'];
  return SPANISH_DOCS.filter((entry) => levels.includes(entry.level));
}

const SPANISH_WORD_PATTERN = /[A-Za-z_$][A-Za-z0-9_$]*/g;

export interface SpanishWordMatch {
  text: string;
  from: number;
  to: number;
}

/**
 * Finds a complete JavaScript-like identifier at the given character position.
 * CodeMirror's `wordAt` depends on editor language, while our docs are keyed by
 * identifiers such as `getElementById`.
 */
export function findSpanishWordAt(code: string, position: number): SpanishWordMatch | null {
  if (!code) return null;
  const boundedPosition = Math.max(0, Math.min(position, code.length));
  SPANISH_WORD_PATTERN.lastIndex = 0;

  for (const match of code.matchAll(SPANISH_WORD_PATTERN)) {
    const from = match.index ?? 0;
    const to = from + match[0].length;
    if (boundedPosition >= from && boundedPosition < to) {
      return { text: match[0], from, to };
    }
  }

  return null;
}

function createCompletionSource(lessonId?: string) {
  const availableDocs = getSpanishDocsForLesson(lessonId);

  return function lessonSpanishCompletionSource(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const prefix = word.text.toLowerCase();
    const options = availableDocs
      .filter((entry) => entry.label.toLowerCase().startsWith(prefix))
      .map((entry) => ({
        label: entry.label,
        type: entry.type,
        detail: entry.detail,
        info: entry.info,
        apply: entry.apply || entry.label,
        boost: 90,
      }));

    if (options.length === 0) return null;
    return { from: word.from, options };
  };
}

function tooltipHtml(entry: DocEntry): string {
  const escapedInfo = entry.info
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<strong style="color:#f8fafc">${entry.label}</strong> <em style="color:#94a3b8">${entry.detail}</em><br><span style="color:#cbd5e1">${escapedInfo.replace(/\n/g, '<br>')}</span>`;
}

function createHoverTooltip(lessonId?: string) {
  const docMapByLowerLabel = new Map(
    getSpanishDocsForLesson(lessonId).map((entry) => [entry.label.toLowerCase(), entry])
  );

  return hoverTooltip((view: EditorView, pos: number, side: -1 | 1) => {
    const code = view.state.sliceDoc(0, view.state.doc.length);
    // When the pointer is immediately after an identifier, inspect its last
    // character instead of the operator or whitespace that follows it.
    const lookupPosition = Math.max(0, Math.min(side < 0 ? pos - 1 : pos, code.length));
    const word = findSpanishWordAt(code, lookupPosition);
    if (!word) return null;

    const entry = docMapByLowerLabel.get(word.text.toLowerCase());
    if (!entry) return null;

    return {
      pos: word.from,
      end: word.to,
      above: true,
      create() {
        const dom = document.createElement('div');
        dom.className = 'cm-tooltip-doc';
        dom.style.maxWidth = '320px';
        dom.style.padding = '8px 10px';
        dom.style.fontSize = '12px';
        dom.style.lineHeight = '1.4';
        dom.style.whiteSpace = 'pre-wrap';
        dom.innerHTML = tooltipHtml(entry);
        return { dom };
      },
    };
  });
}

export const spanishCompletionSource = createCompletionSource();
export const spanishHoverTooltip = createHoverTooltip();

export function createSpanishCompletionSource(lessonId?: string) {
  return createCompletionSource(lessonId);
}

export function createSpanishHoverTooltip(lessonId?: string) {
  return createHoverTooltip(lessonId);
}
