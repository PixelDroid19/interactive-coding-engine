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
  reading?: RoadmapNode;
  reasoning?: RoadmapNode;
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
  'fundamentos-10': 'object',
  'fundamentos-11': 'function',
  'fundamentos-12': 'algorithm',
  'fundamentos-13': 'list',
  'fundamentos-14': 'algorithm',
  'fundamentos-15': 'algorithm',
  'fundamentos-16': 'function',
  'fundamentos-17': 'algorithm',
  'fundamentos-18': 'loop',
  'fundamentos-19': 'list',
  'fundamentos-20': 'condition',
  'fundamentos-21': 'algorithm',
  'fundamentos-22': 'function',
  'fundamentos-23': 'object',
  'fundamentos-24': 'algorithm',
};

export function visualForLesson(lessonId: string): ConceptVisualKind {
  return VISUAL_BY_LESSON[lessonId] ?? 'terminal';
}

/** Terms the student actually meets in that class, in plain language. */
const LESSON_TERMS: Record<string, { label: string; desc: string }[]> = {
  'fundamentos-01': [
    {
      label: 'Una instrucción',
      desc: 'Una orden completa que JavaScript puede ejecutar. En esta clase usas console.log para producir una salida visible en la consola.',
    },
    {
      label: 'Texto, paréntesis y cierre',
      desc: 'Las comillas delimitan texto, los paréntesis contienen el dato entregado y el punto y coma termina la instrucción.',
    },
  ],
  'fundamentos-02': [
    {
      label: 'Dividir el problema',
      desc: 'Antes de escribir más código, conviertes una meta grande en acciones pequeñas que se puedan ordenar y comprobar.',
    },
    {
      label: 'Comentarios y orden',
      desc: 'Las líneas con // son notas y no se ejecutan. Las instrucciones reales se ejecutan de arriba abajo, así que su orden cambia el resultado.',
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
      label: 'El bucle for',
      desc: 'Un for repite un bloque. Su encabezado indica dónde empieza, hasta cuándo continúa y cómo cambia la variable de control.',
    },
    {
      label: 'Inicio, límite y paso',
      desc: 'Cambiar < por <= incluye el límite. Olvidar el incremento puede impedir que el bucle termine.',
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
      label: 'Qué es el DOM',
      desc: 'El DOM es la representación de los elementos de la página. JavaScript puede buscar esos objetos y cambiar propiedades concretas.',
    },
    {
      label: 'Buscar y cambiar texto',
      desc: 'getElementById busca un elemento por su id. textContent contiene su texto visible y permite reemplazarlo.',
    },
  ],
  'fundamentos-11': [
    {
      label: 'Qué es un evento',
      desc: 'Un evento es un aviso del navegador: ocurrió un clic, una tecla u otra acción. El programa puede esperar ese aviso.',
    },
    {
      label: 'Escuchar un clic',
      desc: 'addEventListener conecta el evento click con una función. La función se entrega sin paréntesis para que se ejecute después.',
    },
  ],
  'fundamentos-12': [
    {
      label: 'Leer un input',
      desc: 'La propiedad value contiene el texto escrito en un input. Se lee dentro del evento para obtener el valor actual.',
    },
    {
      label: 'Entrada, proceso y salida',
      desc: 'El evento lee la entrada, una función transforma el dato y textContent muestra la salida. Tres pasos que se pueden revisar por separado.',
    },
  ],
  'fundamentos-13': [
    {
      label: 'De array a lista',
      desc: 'Un bucle recorre el array. En cada vuelta usa el dato actual para construir una fila visible.',
    },
    {
      label: 'Crear y agregar elementos',
      desc: 'createElement crea una etiqueta nueva. appendChild la agrega al DOM. Limpiar antes de dibujar evita duplicados.',
    },
  ],
  'fundamentos-14': [
    {
      label: 'Combinar lo aprendido',
      desc: 'El proyecto usa variables, funciones, if, arrays, bucles, DOM, inputs y eventos sin introducir sintaxis avanzada.',
    },
    {
      label: 'Datos y pantalla',
      desc: 'El array guarda las tareas. La interfaz se vuelve a dibujar desde esos datos para mantener una sola fuente de verdad.',
    },
  ],
  'fundamentos-15': [
    { label: 'Ciclo de depuración', desc: 'Reproduce, predice, aísla, formula una hipótesis, cambia una cosa y verifica también otro caso.' },
    { label: 'Evidencia', desc: 'Una observación concreta que diferencia dos explicaciones posibles del fallo.' },
  ],
  'fundamentos-16': [
    { label: 'Contrato de un método', desc: 'Explica receptor, argumentos, retorno y si modifica el valor original.' },
    { label: 'Método y propiedad', desc: 'Un método se llama con paréntesis; una propiedad como length se lee sin llamarla.' },
  ],
  'fundamentos-17': [
    { label: 'Pseudocódigo', desc: 'Pasos y decisiones escritos sin detalles del lenguaje para revisar la lógica primero.' },
    { label: 'Diagrama de flujo', desc: 'Un mapa de procesos y caminos sí/no que debe tener una salida coherente.' },
  ],
  'fundamentos-18': [
    { label: 'Acumulador', desc: 'Una variable que resume lo procesado hasta la vuelta actual.' },
    { label: 'Una pasada', desc: 'Cada elemento se revisa una vez mientras se actualiza el estado parcial.' },
  ],
  'fundamentos-19': [
    { label: 'Buscar o seleccionar', desc: 'Buscar responde por existencia o un elemento; filtrar conserva todos los que cumplen.' },
    { label: 'Transformar', desc: 'Produce un valor nuevo por cada elemento sin cambiar qué elementos participan.' },
  ],
  'fundamentos-20': [
    { label: 'Caso límite', desc: 'Un valor exactamente en la frontera de una regla, donde < y <= producen resultados distintos.' },
    { label: 'Regresión', desc: 'Volver a comprobar casos anteriores después de corregir un fallo.' },
  ],
  'fundamentos-21': [
    { label: 'Fuente de verdad', desc: 'El estado único desde el cual la interfaz puede reconstruirse.' },
    { label: 'Transición', desc: 'Una regla que recibe estado y acción para producir el estado siguiente.' },
  ],
  'fundamentos-22': [
    { label: 'Responsabilidad', desc: 'El tipo de decisiones que una función o módulo conoce y puede cambiar.' },
    { label: 'Dependencia', desc: 'Una parte usa la capacidad pública de otra; la dirección debe evitar círculos.' },
  ],
  'fundamentos-23': [
    { label: 'Frontera', desc: 'Separa datos, reglas y detalles de interfaz para que cada parte pueda cambiar o probarse.' },
    { label: 'Arquitectura pequeña', desc: 'Decisiones explícitas sobre responsabilidades y dirección del flujo, sin exigir patrones con nombre.' },
  ],
  'fundamentos-24': [
    { label: 'Corte vertical', desc: 'Una historia pequeña y completa que atraviesa dato, regla, evento, vista y prueba.' },
    { label: 'Retrospectiva', desc: 'Explicar qué funcionó, qué falló y qué decisión cambiarías con nueva evidencia.' },
  ],
};

export function buildRoadmap(course: Course, scrims: Record<string, ScrimLessonData>): RoadmapPhase[] {
  const tones: RoadmapPhase['tone'][] = ['blue', 'amber', 'violet', 'emerald', 'sky', 'rose', 'slate'];

  return course.modules.map((mod, modIndex) => {
    const rows: RoadmapRow[] = [];

    for (const item of mod.items) {
      if (item.type === 'scrim') {
        const scrim = scrims[item.scrimDataId];
        const terms = course.conceptGlossary?.[item.id] ?? LESSON_TERMS[item.id] ?? [];
        rows.push({
          main: {
            id: `m-${item.id}`,
            kind: 'main',
            itemType: item.type,
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
          last.reading = {
            id: `cp-${item.id}`,
            kind: 'checkpoint',
            itemType: item.type,
            label: item.title,
            lessonId: item.id,
            moduleId: mod.id,
          };
        }
      } else if (item.type === 'reasoning') {
        const last = rows[rows.length - 1];
        if (last) {
          last.reasoning = {
            id: `think-${item.id}`,
            kind: 'checkpoint',
            itemType: item.type,
            label: item.title,
            lessonId: item.id,
            moduleId: mod.id,
          };
        }
      } else if (item.type === 'solo-project') {
        rows.push({
          main: {
            id: `m-${item.id}`,
            kind: 'main',
            itemType: item.type,
            label: item.title,
            lessonId: item.id,
            moduleId: mod.id,
          },
          concepts: [],
        });
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

export function explainConcept(course: Course, lessonId: string, term: string): { term: string; desc: string } {
  const hit = (course.conceptGlossary?.[lessonId] ?? LESSON_TERMS[lessonId] ?? []).find((item) => item.label === term);
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
