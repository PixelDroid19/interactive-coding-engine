import { Course, CurriculumItem } from '../../types/curriculum';
import { ScrimLessonData } from '../../types/scrim';

export type ConceptVisualKind =
  | 'terminal'
  | 'algorithm'
  | 'variable'
  | 'operator'
  | 'condition'
  | 'loop'
  | 'function'
  | 'list'
  | 'object'
  | 'scope'
  | 'bigo';

export type RoadmapNodeKind = 'main' | 'checkpoint' | 'concept';

export interface RoadmapNode {
  id: string;
  kind: RoadmapNodeKind;
  itemType?: CurriculumItem['type'];
  label: string;
  lessonId: string;
  moduleId: string;
  focusTerm?: string;
}

export interface RoadmapRow {
  main: RoadmapNode;
  checkpoint?: RoadmapNode;
  concepts: RoadmapNode[];
  hasChallenge?: boolean;
  challengeTitle?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  tone: 'blue' | 'amber' | 'violet' | 'emerald' | 'sky' | 'rose' | 'slate';
  rows: RoadmapRow[];
}

const VISUAL_BY_LESSON: Record<string, ConceptVisualKind> = {
  'fundamentos-01': 'terminal',
  'fundamentos-02': 'algorithm',
  'fundamentos-03': 'variable',
  'fundamentos-04': 'operator',
  'fundamentos-05': 'condition',
  'fundamentos-06': 'loop',
  'fundamentos-07': 'function',
  'fundamentos-08': 'list',
  'fundamentos-09': 'object',
  'fundamentos-10': 'scope',
  'fundamentos-11': 'algorithm',
  'fundamentos-12': 'list',
  'fundamentos-13': 'bigo',
  'fundamentos-14': 'function',
};

export function visualForLesson(lessonId: string): ConceptVisualKind {
  return VISUAL_BY_LESSON[lessonId] ?? 'terminal';
}

/** Terms the student actually meets in that class, in plain language. */
const LESSON_TERMS: Record<string, { label: string; desc: string }[]> = {
  'fundamentos-01': [
    {
      label: 'Qué es un programa',
      desc: 'Una lista de instrucciones en orden. JavaScript las lee de arriba abajo y ejecuta cada línea una tras otra. Si cambias el orden, cambia el resultado.',
    },
    {
      label: 'Texto entre comillas',
      desc: 'Lo que va entre comillas es texto. En esta clase escribes instrucciones que buscan un recuadro de la página y ponen texto dentro.',
    },
  ],
  'fundamentos-02': [
    {
      label: 'Dividir el problema',
      desc: 'Antes de escribir código, partes el problema en piezas chicas. Aquí: leer un número, hacer la cuenta, mostrar el resultado. Cada pieza es una instrucción.',
    },
    {
      label: 'La fórmula es el programa',
      desc: 'Pasar de Celsius a Fahrenheit es una cuenta: se multiplica, se suma. Esa cuenta, escrita en JavaScript, es el programa. El reto es completar la fórmula.',
    },
  ],
  'fundamentos-03': [
    {
      label: 'Qué es una variable',
      desc: 'Una variable es un dato con nombre. Escribes let nombre = "Alex" y más tarde usas nombre. Es una etiqueta sobre un valor en memoria, no el texto en pantalla.',
    },
    {
      label: 'let y const',
      desc: 'let crea un dato que puedes cambiar después. const crea uno que no se reasigna. El texto va entre comillas; los números y true/false no.',
    },
  ],
  'fundamentos-04': [
    {
      label: 'Calcular (+, *, %)',
      desc: '+ suma, * multiplica. % no es “por ciento”: es el resto de una división. 7 % 2 da 1. Sirve para saber si un número es par.',
    },
    {
      label: 'Comparar (=== y &&)',
      desc: '=== pregunta si dos valores son iguales. && pide que se cumplan las dos condiciones. En el reto las usas para esPar y puedeEntrar.',
    },
  ],
  'fundamentos-05': [
    {
      label: 'if / else',
      desc: 'if elige un camino. Si la condición es verdadera, corre ese bloque. Si no, corre el else. No se ejecutan los dos a la vez.',
    },
    {
      label: 'else if',
      desc: 'else if encadena preguntas. La primera que se cumple gana y el resto se ignora. En el reto preguntas nota ≥ 90, luego 80, luego 70.',
    },
  ],
  'fundamentos-06': [
    {
      label: 'for y while',
      desc: 'Un bucle repite un bloque. for tiene inicio, condición y paso (i++). while solo pregunta “¿sigo?”. Misma idea: repetir hasta que deje de cumplirse.',
    },
    {
      label: 'FizzBuzz',
      desc: 'Para cada número: si es múltiplo de 3 y 5, FizzBuzz; si solo de 3, Fizz; si solo de 5, Buzz. El orden de las preguntas importa.',
    },
  ],
  'fundamentos-07': [
    {
      label: 'Qué es una función',
      desc: 'Una función empaqueta un trabajo con nombre. Escribir function area() { } no la corre: solo la define. Se ejecuta cuando la llamas: areaRectangulo(3, 4).',
    },
    {
      label: 'return',
      desc: 'return entrega un valor hacia afuera. Sin return, la función hace el cálculo y no te lo da. Los parámetros (ancho, alto) son los datos que le pasas.',
    },
  ],
  'fundamentos-08': [
    {
      label: 'Array (lista)',
      desc: 'Un array guarda varios valores en orden, entre corchetes: [2, 5, 8]. length es cuántos hay. push añade uno al final.',
    },
    {
      label: 'El índice empieza en 0',
      desc: 'El primer elemento es numeros[0], no [1]. En un for usas i para recorrer: numeros[i] es el de esa vuelta.',
    },
  ],
  'fundamentos-09': [
    {
      label: 'Objeto { }',
      desc: 'Un objeto es una ficha: datos con nombre, no con posición. { nombre: "Té", precio: 4 }. Se escribe entre llaves.',
    },
    {
      label: 'item.nombre',
      desc: 'El punto entra al campo por su etiqueta: item.nombre. No es item[0]: aquí no cuenta la posición, cuenta el nombre del dato.',
    },
  ],
  'fundamentos-10': [
    {
      label: 'Dónde vive una variable',
      desc: 'El scope es el sitio donde existe un let. Las llaves { } son paredes: lo que nace adentro no se ve afuera. Un let global se ve en todo el archivo.',
    },
    {
      label: 'Una función que recuerda',
      desc: 'Una función puede devolver otra y esa “recuerda” las variables de adentro. Por eso un contador sigue sumando su propio n cada vez que lo llamas.',
    },
  ],
  'fundamentos-11': [
    {
      label: 'Búsqueda lineal',
      desc: 'Mirar uno por uno hasta encontrar el dato. Funciona siempre, pero si la lista es larga tardas más.',
    },
    {
      label: 'Búsqueda binaria',
      desc: 'Si la lista está ordenada, miras la mitad y tiras la mitad que no sirve. Cada paso reduce el problema a la mitad.',
    },
  ],
  'fundamentos-12': [
    {
      label: 'Pila y cola',
      desc: 'Pila: el último en entrar sale primero (como platos). Cola: el primero en entrar sale primero (como una fila).',
    },
    {
      label: 'Mapa por nombre',
      desc: 'Un mapa guarda un valor pegado a una clave. Preguntas por el nombre, no por el puesto en la fila.',
    },
  ],
  'fundamentos-13': [
    {
      label: 'Qué es Big O',
      desc: 'No es una nota. Dice cómo crece el trabajo cuando crecen los datos: si duplicas la lista, ¿el programa tarda el doble, el cuadrado, o casi igual?',
    },
    {
      label: 'O(1) y O(n)',
      desc: 'O(1) es un paso, da igual el tamaño. O(n) recorre la lista: más datos, más vueltas. O(n²) anida bucles: crece mucho más rápido.',
    },
  ],
  'fundamentos-14': [
    {
      label: 'Objetos con estado',
      desc: 'En un estilo, el dato vive dentro de un objeto y los métodos lo cambian. El mismo objeto dura y se va actualizando.',
    },
    {
      label: 'map y filter',
      desc: 'En el otro estilo, entra una lista y sale una lista nueva. map transforma cada dato; filter se queda con los que cumplen. No mutas la original.',
    },
  ],
};

export function buildRoadmap(course: Course, scrims: Record<string, ScrimLessonData>): RoadmapPhase[] {
  const tones: RoadmapPhase['tone'][] = ['blue', 'amber', 'violet', 'emerald', 'sky', 'rose', 'slate'];

  return course.modules.map((mod, modIndex) => {
    const rows: RoadmapRow[] = [];

    for (const item of mod.items) {
      if (item.type === 'scrim') {
        const scrim = scrims[item.scrimDataId];
        const terms = LESSON_TERMS[item.id] ?? [];
        rows.push({
          main: {
            id: `m-${item.id}`,
            kind: 'main',
            label: item.title,
            lessonId: item.id,
            moduleId: mod.id,
          },
          hasChallenge: Boolean(scrim?.challenges?.length),
          challengeTitle: scrim?.challenges?.[0]?.title,
          concepts: terms.map((term, i) => ({
            id: `st-${item.id}-${i}`,
            kind: 'concept' as const,
            label: term.label,
            lessonId: item.id,
            moduleId: mod.id,
            focusTerm: term.label,
          })),
        });
      } else if (item.type === 'debugging') {
        const last = rows[rows.length - 1];
        if (last) {
          last.checkpoint = {
            id: `cp-${item.id}`,
            kind: 'checkpoint',
            label: item.title,
            lessonId: item.id,
            moduleId: mod.id,
          };
        }
      } else if (item.type === 'reading') {
        const last = rows[rows.length - 1];
        if (last) {
          last.checkpoint = {
            id: `cp-${item.id}`,
            kind: 'checkpoint',
            itemType: item.type,
            label: item.title,
            lessonId: item.id,
            moduleId: mod.id,
          };
        }
      }
    }

    return {
      id: mod.id,
      title: mod.title.replace(/^Módulo\s+\d+:\s*/i, ''),
      tone: tones[modIndex] ?? 'slate',
      rows,
    };
  });
}

export function findCourseItem(
  course: Course,
  lessonId: string
): { item: CurriculumItem; moduleId: string } | null {
  for (const mod of course.modules) {
    const item = mod.items.find((it) => it.id === lessonId);
    if (item) return { item, moduleId: mod.id };
  }
  return null;
}

export interface LessonBriefingData {
  title: string;
  minutes: number;
  category: 'Tema clave' | 'Práctica' | 'Concepto';
  hook: string;
  explanation: string;
  keywords: { term: string; desc: string }[];
  visual: ConceptVisualKind;
}

export function conceptLabels(lessonId: string): string[] {
  return (LESSON_TERMS[lessonId] ?? []).map((item) => item.label);
}

export function explainConcept(lessonId: string, term: string): { term: string; desc: string } {
  const hit = (LESSON_TERMS[lessonId] ?? []).find((item) => item.label === term);
  if (hit) return { term: hit.label, desc: hit.desc };
  return {
    term,
    desc: 'Este término aparece en la clase: lo vas a ver escrito y ejecutado, no solo nombrado.',
  };
}

export function briefingFor(
  item: CurriculumItem,
  scrim: ScrimLessonData | undefined,
  kind: RoadmapNodeKind,
  focusTerm?: string
): LessonBriefingData {
  const notes = scrim?.teachNotes ?? [];
  const focused = focusTerm
    ? notes.find((n) => n.title.toLowerCase().includes(focusTerm.toLowerCase()) || focusTerm.toLowerCase().includes(n.title.toLowerCase().slice(0, 8)))
    : notes[0];

  const keywords = notes.map((n) => ({ term: n.title, desc: n.body }));
  const explanation =
    focused?.body ??
    item.description ??
    'En esta clase vas a ver el código escribirse, pausar, cambiarlo y comprobar qué pasa.';

  const hook =
    kind === 'checkpoint'
      ? 'Refuerza lo que acabas de ver antes de practicar. Esta lectura prepara el ejercicio sin dar la respuesta.'
      : kind === 'concept'
        ? `Esto es lo que vas a ver en acción cuando el instructor escriba «${focusTerm ?? 'este concepto'}».`
        : item.description ?? 'Mira el código en vivo, pausa cuando quieras y prueba el cambio tú.';

  return {
    title: item.title,
    minutes: item.estimatedMinutes,
    category: kind === 'checkpoint' ? 'Práctica' : kind === 'concept' ? 'Concepto' : 'Tema clave',
    hook,
    explanation,
    keywords: keywords.length > 0 ? keywords : [{ term: 'Pausa y edita', desc: 'El editor es real. Si cambias una línea y pulsas Run, la página de la derecha responde.' }],
    visual: visualForLesson(item.id),
  };
}
