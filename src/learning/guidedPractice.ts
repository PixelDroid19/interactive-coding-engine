import { evaluateConsoleIsolated, evaluateFunctionIsolated } from '../engine/isolatedJavaScriptEvaluator';
import { evaluationValuesEqual } from '../engine/evaluationEquality';

export const GUIDED_TOPICS = [
  { id: 'variables', title: 'Seguir una variable', description: 'Observa cómo cambia un dato.' },
  { id: 'operaciones', title: 'Calcular una compra', description: 'Relaciona una cuenta con su resultado.' },
  { id: 'condiciones', title: 'Tomar una decisión', description: 'Comprueba cuándo se cumple una regla.' },
  { id: 'bucles', title: 'Recorrer una lista', description: 'Sigue una repetición cada vez.' },
  { id: 'funciones', title: 'Usar una función', description: 'Distingue lo que entra y lo que sale.' },
  { id: 'listas', title: 'Leer una posición', description: 'Encuentra un dato dentro de una lista.' },
] as const;

export type GuidedTopicId = typeof GUIDED_TOPICS[number]['id'];
export type GuidedStage = 'predict' | 'modify' | 'explain' | 'done';
export type GuidedConfidence = 'again' | 'supported' | 'independent';
export interface GuidedTrace { line: number; explanation: string; memory: string }
export interface GuidedCheck { input: string; expected: string; actual: string; passed: boolean }
export interface GuidedExercise {
  id: string;
  topicId: GuidedTopicId;
  title: string;
  situation: string;
  sample: string;
  output: string;
  trace: GuidedTrace[];
  task: string;
  starter: string;
  functionName: string;
  tests: Array<{ args: unknown[]; expected: unknown }>;
  hints: string[];
  explainPrompt: string;
  reference: string;
}

/** Authored examples: the explanation and learner's task use different cases. */
export function buildGuidedExercise(topicId: GuidedTopicId, round = 0): GuidedExercise {
  const variant = Math.max(0, Math.floor(round)) % 3;
  const base = { id: `guided:${topicId}:${variant}`, topicId };
  if (topicId === 'variables') {
    const [initial, added] = [[4, 2], [7, 3], [2, 5]][variant];
    return { ...base, title: ['Entradas para el cine', 'Reservas de un taller', 'Plazas en una excursión'][variant],
      situation: `Hay ${initial} reservas y llegan ${added} más. Sigue el valor de reservas.`,
      sample: `let reservas = ${initial};\nreservas = reservas + ${added};\nconsole.log(reservas);`, output: String(initial + added),
      trace: [
        { line: 1, explanation: 'El nombre reservas guarda el dato inicial.', memory: `reservas = ${initial}` },
        { line: 2, explanation: 'Primero se calcula la suma; después se guarda el nuevo valor.', memory: `reservas = ${initial + added}` },
        { line: 3, explanation: 'La consola muestra el valor que reservas tiene ahora.', memory: `salida: ${initial + added}` },
      ],
      task: 'Completa agregarReservas(actuales, nuevas) para devolver cuántas hay en total.',
      starter: 'function agregarReservas(actuales, nuevas) {\n  // Devuelve el total de reservas.\n}', functionName: 'agregarReservas',
      tests: [{ args: [initial + 1, added + 1], expected: initial + added + 2 }, { args: [10, 0], expected: 10 }, { args: [1, 8], expected: 9 }],
      hints: ['La función recibe dos datos: las reservas actuales y las que llegan.', 'Necesitas combinar ambos datos. return entrega el resultado al código que llamó la función.'],
      explainPrompt: 'Si llegan más reservas, ¿qué dato cambia y cómo afecta al total?',
      reference: 'actuales es el punto de partida. nuevas es la cantidad que se añade. La suma produce el total; return lo entrega.',
    };
  }
  if (topicId === 'operaciones') {
    const [price, quantity] = [[5, 3], [4, 6], [8, 2]][variant];
    return { ...base, title: ['Una compra de cuadernos', 'Bebidas para una reunión', 'Boletos de autobús'][variant],
      situation: `Cada unidad cuesta ${price} y compras ${quantity}. ¿Cuánto pagas?`,
      sample: `const precio = ${price};\nconst cantidad = ${quantity};\nconst total = precio * cantidad;\nconsole.log(total);`, output: String(price * quantity),
      trace: [
        { line: 1, explanation: 'precio es lo que cuesta una unidad.', memory: `precio = ${price}` },
        { line: 2, explanation: 'cantidad dice cuántas unidades compras.', memory: `cantidad = ${quantity}` },
        { line: 3, explanation: 'Multiplicamos el precio por el número de unidades.', memory: `total = ${price * quantity}` },
        { line: 4, explanation: 'Se muestra el total, sin cambiar los datos.', memory: `salida: ${price * quantity}` },
      ],
      task: 'Completa costo(precio, cantidad) para devolver el total de cualquier compra.',
      starter: 'function costo(precio, cantidad) {\n  // Devuelve lo que cuesta la compra.\n}', functionName: 'costo',
      tests: [{ args: [price + 1, quantity + 1], expected: (price + 1) * (quantity + 1) }, { args: [7, 0], expected: 0 }, { args: [2, 5], expected: 10 }],
      hints: ['Pregunta cuánto costaría una unidad, dos unidades y tres unidades.', 'El signo * multiplica. Usa los parámetros para que funcione con distintos precios.'],
      explainPrompt: 'Si duplicas la cantidad y mantienes el precio, ¿qué pasa con el total?',
      reference: 'Cada unidad cuesta lo mismo. Al duplicar la cantidad se duplica el total. Con cantidad cero, el total es cero.',
    };
  }
  if (topicId === 'condiciones') {
    const limit = [18, 12, 16][variant];
    const age = [20, 10, 16][variant];
    const allowed = age >= limit;
    return { ...base, title: ['La entrada a una actividad', 'La inscripción a un taller', 'El acceso a un evento'][variant],
      situation: `La actividad admite personas de ${limit} años o más. La persona tiene ${age}.`,
      sample: `const edad = ${age};\nif (edad >= ${limit}) {\n  console.log("Puede entrar");\n} else {\n  console.log("Aún no");\n}`, output: allowed ? 'Puede entrar' : 'Aún no',
      trace: [
        { line: 1, explanation: 'Guardamos la edad de la persona.', memory: `edad = ${age}` },
        { line: 2, explanation: '>= pregunta si la edad es mayor o igual al límite.', memory: `${age} >= ${limit}: ${allowed ? 'verdadero' : 'falso'}` },
        { line: allowed ? 3 : 5, explanation: 'Solo se ejecuta la rama que corresponde a la condición.', memory: `salida: ${allowed ? 'Puede entrar' : 'Aún no'}` },
      ],
      task: `Completa puedeEntrar(edad): devuelve true desde los ${limit} años, incluido ese límite, y false antes.`,
      starter: 'function puedeEntrar(edad) {\n  // Devuelve true o false según la regla.\n}', functionName: 'puedeEntrar',
      tests: [{ args: [limit - 1], expected: false }, { args: [limit], expected: true }, { args: [limit + 1], expected: true }],
      hints: ['Comprueba tres edades: antes del límite, justo en el límite y después.', 'Mayor que y mayor o igual que no responden lo mismo en el límite. Una comparación produce true o false.'],
      explainPrompt: `¿Por qué alguien de exactamente ${limit} años puede entrar?`,
      reference: `La regla incluye el límite. >= acepta ${limit} y los valores mayores; > dejaría fuera a quien tiene exactamente ${limit}.`,
    };
  }
  if (topicId === 'bucles') {
    const prices = [[2, 4, 3], [5, 1, 2], [3, 6, 2]][variant];
    let sum = 0;
    return { ...base, title: ['Sumar la cesta', 'Sumar los gastos del día', 'Sumar una merienda'][variant],
      situation: 'Recorre los precios para obtener el total. En cada vuelta se añade un precio.',
      sample: `const precios = [${prices.join(', ')}];\nlet total = 0;\nfor (const precio of precios) {\n  total = total + precio;\n}\nconsole.log(total);`, output: String(prices.reduce((a, b) => a + b, 0)),
      trace: [
        { line: 1, explanation: 'La lista contiene los precios que vamos a recorrer.', memory: `precios = [${prices.join(', ')}]` },
        { line: 2, explanation: 'Antes de recorrer la lista, el total empieza en cero.', memory: 'total = 0' },
        ...prices.map((price, index) => ({ line: 4, explanation: `Vuelta ${index + 1}: añadimos ${price} al total anterior.`, memory: `precio = ${price} · total = ${sum += price}` })),
        { line: 6, explanation: 'El bucle terminó. Mostramos el total acumulado.', memory: `salida: ${sum}` },
      ],
      task: 'Completa sumarCompra(precios) para devolver la suma. Si la lista está vacía, devuelve 0.',
      starter: 'function sumarCompra(precios) {\n  // Recorre la lista y devuelve el total.\n}', functionName: 'sumarCompra',
      tests: [{ args: [[1, 3, 5]], expected: 9 }, { args: [[]], expected: 0 }, { args: [[7]], expected: 7 }],
      hints: ['Necesitas un total inicial y una operación que lo actualice en cada vuelta.', 'for...of entrega un precio por vuelta. Devuelve el total después de terminar el recorrido.'],
      explainPrompt: '¿Qué pasaría si pusieras el total en cero dentro de cada vuelta?',
      reference: 'Se perdería lo acumulado en las vueltas anteriores. El total se inicia antes del bucle y se actualiza durante el recorrido.',
    };
  }
  if (topicId === 'funciones') {
    const [subtotal, shipping] = [[12, 3], [20, 4], [8, 2]][variant];
    return { ...base, title: ['Un pedido con envío', 'Una entrega a domicilio', 'Un paquete de la tienda'][variant],
      situation: `El pedido vale ${subtotal}. La función le añade ${shipping} de envío.`,
      sample: `function precioFinal(subtotal) {\n  return subtotal + ${shipping};\n}\nconst total = precioFinal(${subtotal});\nconsole.log(total);`, output: String(subtotal + shipping),
      trace: [
        { line: 1, explanation: 'Definir la función prepara una operación; todavía no la ejecuta.', memory: 'precioFinal está disponible para llamarla' },
        { line: 4, explanation: 'La llamada entra en la función con este subtotal.', memory: `subtotal = ${subtotal}` },
        { line: 2, explanation: 'return calcula y entrega el resultado de esta llamada.', memory: `devuelve ${subtotal + shipping}` },
        { line: 5, explanation: 'total recibió ese resultado. Ahora se muestra.', memory: `salida: ${subtotal + shipping}` },
      ],
      task: 'Ahora el envío cambia por pedido. Completa precioFinal(subtotal, envio) para sumar ambos importes.',
      starter: 'function precioFinal(subtotal, envio) {\n  // Usa los dos datos de esta llamada.\n}', functionName: 'precioFinal',
      tests: [{ args: [15, 5], expected: 20 }, { args: [10, 0], expected: 10 }, { args: [2, 6], expected: 8 }],
      hints: ['Cada llamada recibe su propio subtotal y su propio envío.', 'No fijes el coste del envío a un número. El segundo parámetro contiene el dato que debes usar.'],
      explainPrompt: '¿Por qué ahora necesitamos recibir el envío como parámetro?',
      reference: 'El envío deja de ser fijo. Recibirlo como parámetro permite reutilizar la misma función con distintos pedidos.',
    };
  }
  const tasks = [['leer', 'probar', 'explicar'], ['lavar', 'cortar', 'cocinar'], ['elegir', 'pagar', 'recoger']][variant];
  const index = [1, 2, 0][variant];
  return { ...base, title: ['La lista de estudio', 'Preparar la comida', 'Un pedido para recoger'][variant],
    situation: 'Una lista guarda varios datos. Sus posiciones se cuentan desde cero.',
    sample: `const tareas = ${JSON.stringify(tasks)};\nconsole.log(tareas[${index}]);`, output: tasks[index],
    trace: [
      { line: 1, explanation: 'Cada tarea ocupa una posición dentro de la lista.', memory: tasks.map((task, i) => `${i}: ${task}`).join(' · ') },
      { line: 2, explanation: `Los corchetes leen la posición ${index}.`, memory: `salida: ${tasks[index]}` },
    ],
    task: 'Completa primeraTarea(tareas) para devolver la primera tarea. Recibirás listas con al menos una tarea.',
    starter: 'function primeraTarea(tareas) {\n  // Devuelve el primer dato de la lista.\n}', functionName: 'primeraTarea',
    tests: [{ args: [['anotar', 'enviar']], expected: 'anotar' }, { args: [['descansar']], expected: 'descansar' }, { args: [['buscar', 'leer', 'probar']], expected: 'buscar' }],
    hints: ['La posición del primer elemento es la misma aunque cambie su texto.', 'El número de elementos y la posición de un elemento son cosas distintas. La primera posición es cero.'],
    explainPrompt: '¿Por qué usamos una posición y no escribimos directamente el nombre de la tarea?',
    reference: 'El contenido de cada lista puede cambiar. Leer la posición cero devuelve la primera tarea de la lista recibida.',
  };
}

function requireIsolatedRunner(): void {
  if (import.meta.env.MODE !== 'test' && (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function')) {
    throw new Error('Este navegador no dispone del entorno aislado para ejecutar. Prueba en un navegador de escritorio actualizado.');
  }
}

export async function runGuidedPrediction(exercise: GuidedExercise): Promise<string> {
  requireIsolatedRunner();
  const result = await evaluateConsoleIsolated(exercise.sample);
  if (result.kind !== 'console') throw new Error('No se pudo ejecutar el ejemplo. Puedes volver a intentarlo.');
  return result.output.join('\n');
}

export function displayGuidedValue(value: unknown): string {
  const text = value === undefined ? 'undefined (sin resultado)' : typeof value === 'string' ? value : JSON.stringify(value);
  return String(text).slice(0, 300);
}

export async function checkGuidedCode(exercise: GuidedExercise, code: string): Promise<GuidedCheck[]> {
  requireIsolatedRunner();
  if (code.length > 6000) throw new Error('Esta práctica admite hasta 6000 caracteres de código.');
  // Independent workers keep a failing case from hiding the others; each has a time limit.
  return Promise.all(exercise.tests.map(async test => {
    const result = await evaluateFunctionIsolated(code, exercise.functionName, { mode: 'single', args: test.args });
    if (result.kind === 'missing') throw new Error(`Conserva la función ${exercise.functionName} para poder probarla.`);
    return {
      input: `${exercise.functionName}(${test.args.map(arg => JSON.stringify(arg)).join(', ')})`,
      expected: displayGuidedValue(test.expected),
      actual: result.kind === 'single' ? displayGuidedValue(result.value) : 'message' in result ? `Error: ${result.message.slice(0, 300)}` : 'No se pudo ejecutar.',
      passed: result.kind === 'single' && evaluationValuesEqual(result.value, test.expected),
    };
  }));
}

export interface GuidedCompletion {
  id: string; topicId: GuidedTopicId; round: number; completedAt: number; dueAt: number;
  predictionCorrect: boolean; codeAttempts: number; usedHelp: boolean; confidence: GuidedConfidence;
}
export interface GuidedDraft {
  version: 1; topicId: GuidedTopicId; round: number; stage: GuidedStage;
  prediction: string; predictionResult: { actual: string; correct: boolean } | null;
  traceIndex: number; code: string; checks: GuidedCheck[] | null; codeAttempts: number;
  hintCount: number; usedHelp: boolean; explanation: string; showReference: boolean;
  history: GuidedCompletion[];
}

export function createGuidedDraft(topicId: GuidedTopicId = 'variables', round = 0, history: GuidedCompletion[] = []): GuidedDraft {
  return { version: 1, topicId, round, stage: 'predict', prediction: '', predictionResult: null, traceIndex: -1,
    code: buildGuidedExercise(topicId, round).starter, checks: null, codeAttempts: 0, hintCount: 0, usedHelp: false,
    explanation: '', showReference: false, history };
}

export function finishGuidedDraft(draft: GuidedDraft, confidence: GuidedConfidence, now = Date.now()): GuidedDraft {
  if (!draft.checks?.length || !draft.checks.every(check => check.passed) || draft.stage !== 'explain') return draft;
  const days = confidence !== 'independent' || draft.usedHelp ? 1 : 3;
  const completion: GuidedCompletion = { id: crypto.randomUUID(), topicId: draft.topicId, round: draft.round,
    completedAt: now, dueAt: now + days * 86_400_000, predictionCorrect: draft.predictionResult?.correct === true,
    codeAttempts: draft.codeAttempts, usedHelp: draft.usedHelp, confidence };
  return { ...draft, stage: 'done', history: [...draft.history, completion].slice(-60) };
}

export function nextGuidedTopic(history: GuidedCompletion[], now = Date.now()): GuidedTopicId {
  const latest = new Map(history.map(entry => [entry.topicId, entry]));
  const due = [...latest.values()].filter(entry => entry.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)[0];
  return due?.topicId ?? GUIDED_TOPICS.find(topic => !latest.has(topic.id))?.id ?? [...latest.values()].sort((a, b) => a.completedAt - b.completedAt)[0]?.topicId ?? 'variables';
}
