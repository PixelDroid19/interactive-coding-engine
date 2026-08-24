import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function actualizarCantidad(actual, accion) {
  // La función debe producir el siguiente estado.
  return actual;
}

console.log(actualizarCantidad(2, "sumar"));
`;
const SOLUTION = `function actualizarCantidad(actual, accion) {
  if (accion === "sumar") return actual + 1;
  if (accion === "restar" && actual > 0) return actual - 1;
  return actual;
}

console.log(actualizarCantidad(2, "sumar"));
`;

export const LESSON_21 = advancedLesson({
  number: 21,
  executionMode: 'logic',
  durationMs: 141_040,
  audioUrl: '/audio/fundamentos-21.mp3?v=gemini-20260824',
  slug: 'estado-flujo-datos',
  title: 'Estado y flujo de datos',
  bridge: 'En la lista de tareas ya separaste el array de su representación. Ahora nombrarás ese dato como estado y seguirás cada cambio desde la acción hasta la vista.',
  problem: 'Cuando un evento cambia el texto de la página y otra parte cambia los datos, ambos pueden dejar de representar la misma realidad.',
  mentalModel: 'El estado es la fuente de verdad. Una acción describe qué ocurrió, una regla produce el estado siguiente y render muestra ese estado.',
  representation: 'Evento clic; coordinación lee estado y acción; regla devuelve estado nuevo; render recibe ese valor y actualiza la vista.',
  workedExample: SOLUTION,
  workedExampleNarration: 'actualizarCantidad recibe el estado anterior y una acción. No toca la página: devuelve el siguiente número. sumar aumenta, restar protege el cero y una acción desconocida conserva el valor.',
  trace: 'Si actual vale dos y la acción es sumar, la función devuelve tres. Si actual vale cero y pedimos restar, devuelve cero porque la regla impide una cantidad negativa.',
  errorWalkthrough: 'Leer el número desde el texto del DOM crea una segunda fuente de verdad. Otra parte puede cambiarlo y dejar la pantalla en desacuerdo con el estado real.',
  transferExample: 'Modela un reproductor con estado pausado o reproduciendo. Cada botón solicita una transición y la interfaz solo muestra el estado recibido.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Produce el siguiente estado',
  challengeInstructions: 'Completa actualizarCantidad. sumar aumenta uno; restar disminuye sin bajar de cero; otra acción conserva el valor.',
  tests: [
    { id: 'estado-suma', description: 'Sumar produce el estado siguiente', validatorType: 'function-call', targetFunction: 'actualizarCantidad', args: [2, 'sumar'], expectedReturn: 3 },
    { id: 'estado-cero', description: 'No permite bajar de cero', validatorType: 'function-call', targetFunction: 'actualizarCantidad', args: [0, 'restar'], expectedReturn: 0 },
  ],
  skillsRequired: ['events', 'state-and-render', 'functions', 'conditionals'],
  skillsIntroduced: ['state-transition', 'single-source-of-truth', 'unidirectional-flow'],
  commonMistakes: ['Modificar el DOM como sustituto del estado.', 'Permitir que varias funciones cambien el mismo dato sin una regla común.'],
});
