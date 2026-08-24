import { ReasoningConnection, ReasoningExerciseItem, ReasoningNode } from '../../types/curriculum';

const ORDER_PROGRAM: ReasoningExerciseItem = {
  id: 'fundamentos-02-reasoning',
  title: 'Ordena antes de programar',
  type: 'reasoning',
  relatedLessonId: 'fundamentos-02',
  estimatedMinutes: 5,
  description: 'Convierte una meta cotidiana en instrucciones ordenadas y comprobables.',
  activity: {
    kind: 'sequence',
    prompt: 'Quieres mostrar un saludo personalizado. Ordena las acciones como las ejecutaría un programa.',
    steps: [
      { id: 'mostrar', label: 'Mostrar el saludo terminado' },
      { id: 'leer', label: 'Leer el nombre de la persona' },
      { id: 'formar', label: 'Unir “Hola” con el nombre' },
    ],
    expectedOrder: ['leer', 'formar', 'mostrar'],
  },
  hints: [
    { level: 1, text: 'La salida no puede mostrarse antes de conocer el dato de entrada.' },
    { level: 2, text: 'Piensa en entrada, transformación y salida.' },
    { level: 3, text: 'Primero obtienes el nombre; el saludo se forma antes de mostrarse.' },
  ],
  explanation: 'El flujo correcto es leer el nombre, formar el saludo y mostrarlo. El orden expresa una dependencia: cada paso necesita el resultado del anterior.',
};

function base(lesson: number, title: string, activity: ReasoningExerciseItem['activity'], explanation: string): ReasoningExerciseItem {
  const relatedLessonId = `fundamentos-${String(lesson).padStart(2, '0')}`;
  return {
    id: `${relatedLessonId}-reasoning`,
    title,
    type: 'reasoning',
    relatedLessonId,
    estimatedMinutes: 6,
    description: 'Construye una representación y comprueba el modelo antes de volver al código.',
    activity,
    hints: [
      { level: 1, text: 'Nombra primero la entrada, el estado o la pregunta que cambia el camino.' },
      { level: 2, text: 'Traza un caso concreto desde el inicio hasta la salida.' },
      { level: 3, text: 'Revisa la dirección: cada paso solo puede usar información que ya existe.' },
    ],
    explanation,
  };
}

function sequence(lesson: number, title: string, prompt: string, steps: ReasoningNode[], expectedOrder: string[]) {
  return base(lesson, title, { kind: 'sequence', prompt, steps, expectedOrder }, 'El orden correcto conserva las dependencias: primero nace el dato, después se transforma y al final se observa el resultado.');
}

function decision(lesson: number, title: string, prompt: string, cases: Array<ReasoningNode & { options: string[] }>, expectedOutcomes: Record<string, string>) {
  return base(lesson, title, { kind: 'decision-table', prompt, cases, expectedOutcomes }, 'Cada fila representa una partición de entrada. Los valores límite se asignan según los operadores incluidos en el contrato.');
}

function trace(lesson: number, title: string, prompt: string, columns: string[], rows: ReasoningNode[], expectedCells: Record<string, string>) {
  return base(lesson, title, { kind: 'trace-table', prompt, columns, rows, expectedCells }, 'La tabla hace visible el estado después de cada paso y permite encontrar la primera fila que contradice la predicción.');
}

function flow(lesson: number, title: string, prompt: string, nodes: Array<ReasoningNode & { role: 'start' | 'process' | 'decision' | 'output' | 'end' }>, expectedConnections: ReasoningConnection[], distractors: ReasoningConnection[] = []) {
  return base(lesson, title, { kind: 'flowchart', prompt, nodes, connectionOptions: [...expectedConnections, ...distractors], expectedConnections }, 'Las flechas correctas forman caminos completos, con salidas distintas para las respuestas sí y no.');
}

function dependencies(lesson: number, title: string, prompt: string, modules: ReasoningNode[], expectedDependencies: ReasoningConnection[], distractors: ReasoningConnection[] = []) {
  return base(lesson, title, { kind: 'dependency-map', prompt, modules, dependencyOptions: [...expectedDependencies, ...distractors], expectedDependencies }, 'La interfaz puede usar reglas puras; las reglas no deben depender del DOM. Esa dirección mantiene la lógica comprobable.');
}

const ACTIVITIES: ReasoningExerciseItem[] = [
  ORDER_PROGRAM,
  trace(3, 'Sigue el estado de una variable', 'Completa el valor de intentos después de cada instrucción.', ['intentos'], [{ id: 'inicio', label: 'let intentos = 0' }, { id: 'cambio', label: 'intentos = 1' }], { 'inicio.intentos': '0', 'cambio.intentos': '1' }),
  decision(5, 'Construye la tabla de decisión', 'Clasifica cada nota según: A desde 90, B desde 80, C desde 70 y F en otro caso.', [{ id: '95', label: 'nota 95', options: ['A', 'B', 'C', 'F'] }, { id: '80', label: 'nota 80', options: ['A', 'B', 'C', 'F'] }, { id: '69', label: 'nota 69', options: ['A', 'B', 'C', 'F'] }], { '95': 'A', '80': 'B', '69': 'F' }),
  trace(6, 'Traza las vueltas del bucle', 'Sigue i en un for que empieza en 0 y continúa mientras i < 3.', ['i'], [{ id: 'v1', label: 'Vuelta 1' }, { id: 'v2', label: 'Vuelta 2' }, { id: 'v3', label: 'Vuelta 3' }], { 'v1.i': '0', 'v2.i': '1', 'v3.i': '2' }),
  sequence(7, 'Sigue una llamada de función', 'Ordena lo que ocurre al ejecutar doble(4).', [{ id: 'return', label: 'return entrega 8' }, { id: 'argumento', label: '4 entra en el parámetro numero' }, { id: 'calculo', label: 'numero * 2 produce 8' }], ['argumento', 'calculo', 'return']),
  flow(10, 'Conecta JavaScript con el DOM', 'Selecciona el flujo para cambiar un título.', [{ id: 'inicio', label: 'Ejecutar script', role: 'start' }, { id: 'buscar', label: 'Buscar #titulo', role: 'process' }, { id: 'cambiar', label: 'Asignar textContent', role: 'process' }, { id: 'fin', label: 'Texto visible', role: 'end' }], [{ from: 'inicio', to: 'buscar' }, { from: 'buscar', to: 'cambiar' }, { from: 'cambiar', to: 'fin' }], [{ from: 'inicio', to: 'cambiar' }, { from: 'fin', to: 'buscar' }]),
  flow(11, 'Modela un clic', 'Conecta el evento con la función y el cambio visible.', [{ id: 'espera', label: 'Esperar clic', role: 'start' }, { id: 'evento', label: 'Ocurre click', role: 'process' }, { id: 'funcion', label: 'Ejecutar responder', role: 'process' }, { id: 'vista', label: 'Actualizar texto', role: 'end' }], [{ from: 'espera', to: 'evento' }, { from: 'evento', to: 'funcion' }, { from: 'funcion', to: 'vista' }], [{ from: 'espera', to: 'funcion' }, { from: 'vista', to: 'evento' }]),
  sequence(13, 'De datos a filas visibles', 'Ordena una reconstrucción de la lista.', [{ id: 'agregar', label: 'Agregar cada li al contenedor' }, { id: 'limpiar', label: 'Limpiar la lista visible' }, { id: 'recorrer', label: 'Recorrer el array y crear li' }], ['limpiar', 'recorrer', 'agregar']),
  dependencies(14, 'Separa estado, regla e interfaz', 'Selecciona las dependencias permitidas de la lista de tareas.', [{ id: 'interfaz', label: 'Interfaz' }, { id: 'coordinacion', label: 'Coordinación' }, { id: 'reglas', label: 'Reglas' }, { id: 'datos', label: 'Estado' }], [{ from: 'interfaz', to: 'coordinacion', label: 'evento' }, { from: 'coordinacion', to: 'reglas', label: 'llama' }, { from: 'reglas', to: 'datos', label: 'actualiza' }], [{ from: 'reglas', to: 'interfaz', label: 'busca DOM' }]),
  sequence(15, 'Ordena el ciclo de depuración', 'Ordena un proceso que permita conocer la causa del fallo.', [{ id: 'cambiar', label: 'Cambiar una sola causa' }, { id: 'reproducir', label: 'Reproducir y escribir esperado/observado' }, { id: 'hipotesis', label: 'Formular una hipótesis comprobable' }, { id: 'verificar', label: 'Verificar el caso y una regresión' }], ['reproducir', 'hipotesis', 'cambiar', 'verificar']),
  sequence(16, 'Lee el contrato de un método', 'Ordena cómo investigar un método desconocido.', [{ id: 'usar', label: 'Usarlo en el programa' }, { id: 'retorno', label: 'Identificar retorno y mutación' }, { id: 'necesidad', label: 'Definir el resultado que necesitas' }, { id: 'firma', label: 'Leer receptor y parámetros' }], ['necesidad', 'firma', 'retorno', 'usar']),
  flow(17, 'Completa un diagrama de reserva', 'Selecciona los caminos para aceptar o rechazar una solicitud.', [{ id: 'inicio', label: 'Leer solicitud', role: 'start' }, { id: 'cabe', label: '¿Es positiva y cabe?', role: 'decision' }, { id: 'aceptar', label: 'Aceptar', role: 'output' }, { id: 'rechazar', label: 'Rechazar', role: 'output' }, { id: 'fin', label: 'Fin', role: 'end' }], [{ from: 'inicio', to: 'cabe' }, { from: 'cabe', to: 'aceptar', label: 'sí' }, { from: 'cabe', to: 'rechazar', label: 'no' }, { from: 'aceptar', to: 'fin' }, { from: 'rechazar', to: 'fin' }], [{ from: 'inicio', to: 'aceptar' }]),
  trace(18, 'Sigue un acumulador', 'Completa total después de leer 2, 3 y 5.', ['total'], [{ id: 'lee2', label: 'Después de 2' }, { id: 'lee3', label: 'Después de 3' }, { id: 'lee5', label: 'Después de 5' }], { 'lee2.total': '2', 'lee3.total': '5', 'lee5.total': '10' }),
  decision(19, 'Elige por la forma del resultado', 'Relaciona cada necesidad con la intención correcta.', [{ id: 'existe', label: '¿Existe “Ana”?', options: ['buscar', 'filtrar', 'transformar'] }, { id: 'mayores', label: 'Conservar mayores de 18', options: ['buscar', 'filtrar', 'transformar'] }, { id: 'etiquetas', label: 'Convertir cada nombre a mayúsculas', options: ['buscar', 'filtrar', 'transformar'] }], { existe: 'buscar', mayores: 'filtrar', etiquetas: 'transformar' }),
  decision(20, 'Diseña casos que atacan el límite', 'Para una edad mínima de 18, clasifica los casos.', [{ id: '17', label: '17', options: ['acepta', 'rechaza'] }, { id: '18', label: '18', options: ['acepta', 'rechaza'] }, { id: '19', label: '19', options: ['acepta', 'rechaza'] }], { '17': 'rechaza', '18': 'acepta', '19': 'acepta' }),
  flow(21, 'Dibuja el flujo de estado', 'Selecciona la dirección desde el evento hasta la vista.', [{ id: 'evento', label: 'Clic', role: 'start' }, { id: 'regla', label: 'Transición', role: 'process' }, { id: 'estado', label: 'Estado nuevo', role: 'process' }, { id: 'render', label: 'Render', role: 'process' }, { id: 'vista', label: 'Vista', role: 'end' }], [{ from: 'evento', to: 'regla' }, { from: 'regla', to: 'estado' }, { from: 'estado', to: 'render' }, { from: 'render', to: 'vista' }], [{ from: 'vista', to: 'estado' }]),
  dependencies(22, 'Diseña módulos sin círculos', 'Selecciona dependencias que mantienen las reglas independientes del DOM.', [{ id: 'interfaz', label: 'interfaz.js' }, { id: 'reglas', label: 'reglas.js' }, { id: 'datos', label: 'datos.js' }], [{ from: 'interfaz', to: 'reglas', label: 'importa' }, { from: 'interfaz', to: 'datos', label: 'importa' }, { from: 'reglas', to: 'datos', label: 'usa tipos' }], [{ from: 'reglas', to: 'interfaz', label: 'importa DOM' }]),
  dependencies(23, 'Revisa una arquitectura pequeña', 'Conecta coordinación, reglas, datos e interfaz en la dirección permitida.', [{ id: 'ui', label: 'Interfaz' }, { id: 'coord', label: 'Coordinación' }, { id: 'rules', label: 'Reglas' }, { id: 'state', label: 'Datos' }], [{ from: 'ui', to: 'coord', label: 'evento' }, { from: 'coord', to: 'rules', label: 'llama' }, { from: 'rules', to: 'state', label: 'produce' }, { from: 'coord', to: 'ui', label: 'render' }], [{ from: 'rules', to: 'ui', label: 'document' }]),
  sequence(24, 'Planifica el proyecto final', 'Ordena el primer corte vertical antes de programar.', [{ id: 'interfaz', label: 'Conectar evento y mostrar resultado' }, { id: 'requisito', label: 'Definir una historia y fuera de alcance' }, { id: 'prueba', label: 'Escribir casos normal, límite e inválido' }, { id: 'modelo', label: 'Modelar datos y regla pura' }], ['requisito', 'modelo', 'prueba', 'interfaz']),
];

export const REASONING_BY_LESSON: Record<string, ReasoningExerciseItem> = {
  ...Object.fromEntries(ACTIVITIES.map((item) => [item.relatedLessonId, item])),
};
