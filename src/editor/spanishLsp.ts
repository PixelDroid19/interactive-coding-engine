import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { hoverTooltip } from '@codemirror/view';

export interface DocEntry {
  label: string;
  type: 'keyword' | 'variable' | 'function' | 'property' | 'class';
  detail: string;
  info: string;
  apply?: string;
}

const SPANISH_DOCS: Record<string, DocEntry> = {
  'let': {
    label: 'let',
    type: 'keyword',
    detail: 'declara una variable que puede cambiar',
    info: 'Crea una caja con nombre donde guardas un dato que puede cambiar después.\n\nEjemplo:\nlet nombre = "Alex";\nlet edad = 25;\n\nSin comillas es número, con comillas es texto.',
  },
  'const': {
    label: 'const',
    type: 'keyword',
    detail: 'declara una variable que no cambia',
    info: 'Crea una caja que no debe cambiar. Úsala cuando el valor es fijo.\n\nEjemplo:\nconst ciudad = "Lima";',
  },
  'document': {
    label: 'document',
    type: 'variable',
    detail: 'representa la página HTML',
    info: 'Es la página que ves. Con él puedes buscar recuadros por su id.\n\nEjemplo:\ndocument.getElementById("saludo")',
  },
  'getElementById': {
    label: 'getElementById',
    type: 'function',
    detail: 'busca un recuadro por su id',
    info: 'Busca en la página el elemento que tiene id="..." .\n\nParámetros:\n  id: texto entre comillas, sin #\n\nDevuelve: el recuadro o null si no existe\n\nEjemplo:\nconst caja = document.getElementById("saludo");',
    apply: 'getElementById',
  },
  'textContent': {
    label: 'textContent',
    type: 'property',
    detail: 'texto dentro del recuadro',
    info: 'Es lo que se lee dentro del recuadro. Puedes leerlo o cambiarlo.\n\nLeer:\nlet t = caja.textContent;\n\nEscribir:\ncaja.textContent = "Hola, " + nombre + ".";',
  },
  'innerText': {
    label: 'innerText',
    type: 'property',
    detail: 'texto visible del recuadro',
    info: 'Similar a textContent, pero solo texto visible. Para este curso usa textContent.',
  },
  'innerHTML': {
    label: 'innerHTML',
    type: 'property',
    detail: 'HTML dentro del recuadro',
    info: 'Pone HTML dentro. Con textContent pones solo texto.',
  },
  'addEventListener': {
    label: 'addEventListener',
    type: 'function',
    detail: 'escucha un evento (ej. click)',
    info: 'Dice: “cuando pase esto, corre estas líneas”.\n\nParámetros:\n  evento: "click" entre comillas\n  función: lo que debe correr\n\nEjemplo:\nboton.addEventListener("click", function() {\n  caja.textContent = "Hola";\n});',
    apply: 'addEventListener',
  },
  'querySelector': {
    label: 'querySelector',
    type: 'function',
    detail: 'busca el primer elemento que coincide',
    info: 'Busca con selector CSS. Para id usa "#saludo".\n\nEjemplo:\ndocument.querySelector("#saludo")',
  },
  'value': {
    label: 'value',
    type: 'property',
    detail: 'valor de un input',
    info: 'Lo que el usuario escribió en un <input>.\n\nEjemplo:\nlet n = Number(input.value);',
  },
  'click': {
    label: 'click',
    type: 'property',
    detail: 'evento de clic',
    info: 'Se dispara cuando el usuario pulsa el elemento.',
  },
  'Number': {
    label: 'Number',
    type: 'function',
    detail: 'convierte texto a número',
    info: 'Convierte un texto que parece número a número de verdad.\n\nEjemplo:\nNumber("25") → 25\nNumber("hola") → NaN',
  },
  'String': {
    label: 'String',
    type: 'function',
    detail: 'convierte a texto',
    info: 'Convierte cualquier dato a texto.\n\nEjemplo:\nString(25) → "25"',
  },
};

export function spanishCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const prefix = word.text.toLowerCase();
  const options = Object.values(SPANISH_DOCS)
    .filter(entry => entry.label.toLowerCase().startsWith(prefix))
    .map(entry => ({
      label: entry.label,
      type: entry.type,
      detail: entry.detail,
      info: entry.info,
      apply: entry.apply || entry.label,
      boost: 90,
    }));

  if (options.length === 0) return null;

  return {
    from: word.from,
    options,
  };
}

export function spanishHoverTooltip() {
  return hoverTooltip((view: EditorView, pos: number) => {
    const word = view.state.wordAt(pos);
    if (!word) return null;
    const text = view.state.sliceDoc(word.from, word.to);
    const entry = SPANISH_DOCS[text] || SPANISH_DOCS[text.toLowerCase()];
    if (!entry) {
      // Try to find partial like document.getElementById -> check for getElementById
      const line = view.state.doc.lineAt(pos).text;
      for (const key of Object.keys(SPANISH_DOCS)) {
        if (line.includes(key) && Math.abs(pos - line.indexOf(key)) < 30) {
          const e = SPANISH_DOCS[key];
          // Only show if word is near that key
          if (text.length < 2) continue;
          // Check if the matched word is part of that key
          if (key.toLowerCase().includes(text.toLowerCase()) || text.toLowerCase().includes(key.toLowerCase())) {
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
                dom.innerHTML = `<strong>${e.label}</strong> <em style="color:#64748b">${e.detail}</em><br><span style="color:#334155">${e.info.replace(/\n/g, '<br>')}</span>`;
                return { dom };
              },
            };
          }
        }
      }
      return null;
    }
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
        dom.innerHTML = `<strong>${entry.label}</strong> <em style="color:#64748b">${entry.detail}</em><br><span style="color:#334155">${entry.info.replace(/\n/g, '<br>')}</span>`;
        return { dom };
      },
    };
  });
}
