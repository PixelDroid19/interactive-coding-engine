import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorView, hoverTooltip } from '@codemirror/view';

export type SpanishLspLevel =
  | 'program-basics'
  | 'variables'
  | 'numbers'
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
    label: 'document',
    type: 'variable',
    level: 'program-basics',
    detail: 'representa la página HTML',
    info: 'Es la página que ves. Con él puedes buscar recuadros por su id.\n\nEjemplo:\ndocument.getElementById("saludo")',
  },
  {
    label: 'getElementById',
    type: 'function',
    level: 'program-basics',
    detail: 'busca un recuadro por su id',
    info: 'Busca en la página el elemento que tiene id="...".\n\nParámetro:\n  id: texto entre comillas, sin #\n\nDevuelve:\n  el recuadro o null si no existe\n\nEjemplo:\ndocument.getElementById("linea1")',
    apply: 'getElementById',
  },
  {
    label: 'textContent',
    type: 'property',
    level: 'program-basics',
    detail: 'texto dentro del recuadro',
    info: 'Es lo que se lee dentro del recuadro. Puedes leerlo o cambiarlo.\n\nEscribir:\ncaja.textContent = "Hola";\n\nLeer:\nlet texto = caja.textContent;',
  },
  {
    label: 'Number',
    type: 'function',
    level: 'numbers',
    detail: 'convierte texto a número',
    info: 'Convierte un texto que parece número en un número de verdad.\n\nEjemplo:\nNumber("25") → 25\nNumber("hola") → NaN',
  },
  {
    label: 'String',
    type: 'function',
    level: 'variables',
    detail: 'convierte un dato a texto',
    info: 'Convierte cualquier dato a texto.\n\nEjemplo:\nString(25) → "25"',
  },
  {
    label: 'addEventListener',
    type: 'function',
    level: 'events',
    detail: 'escucha un evento, como click',
    info: 'Dice: “cuando pase esto, corre estas líneas”.\n\nParámetros:\n  evento: "click", entre comillas\n  función: lo que debe correr\n\nEjemplo:\nboton.addEventListener("click", function() {\n  caja.textContent = "Hola";\n});',
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
  'fundamentos-02': ['program-basics', 'numbers', 'variables'],
  'fundamentos-03': ['program-basics', 'numbers', 'variables'],
};

function docsForLesson(lessonId?: string): DocEntry[] {
  const levels = (lessonId && LESSON_LEVELS[lessonId]) || LESSON_LEVELS['fundamentos-03'];
  return SPANISH_DOCS.filter((entry) => levels.includes(entry.level));
}

function createCompletionSource(lessonId?: string) {
  const availableDocs = docsForLesson(lessonId);

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

  return `<strong>${entry.label}</strong> <em style="color:#64748b">${entry.detail}</em><br><span style="color:#334155">${escapedInfo.replace(/\n/g, '<br>')}</span>`;
}

function createHoverTooltip(lessonId?: string) {
  const docMap = new Map(docsForLesson(lessonId).map((entry) => [entry.label, entry]));

  return hoverTooltip((view: EditorView, pos: number) => {
    const word = view.state.wordAt(pos);
    if (!word) return null;

    const text = view.state.sliceDoc(word.from, word.to);
    const entry = docMap.get(text) || docMap.get(text.toLowerCase());
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
