import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function puedeReservar(cupos, solicitados) {
  // Traduce primero las dos decisiones del diagrama.
  return true;
}

console.log(puedeReservar(5, 2));
`;
const SOLUTION = `function puedeReservar(cupos, solicitados) {
  if (solicitados <= 0) return false;
  if (solicitados > cupos) return false;
  return true;
}

console.log(puedeReservar(5, 2));
`;

export const LESSON_17 = advancedLesson({
  number: 17,
  executionMode: 'logic',
  durationMs: 132_800,
  audioUrl: '/audio/fundamentos-17.mp3?v=gemini-20260824',
  slug: 'pseudocodigo-diagramas',
  title: 'Pseudocódigo y diagramas',
  bridge: 'Ya escribiste condiciones y funciones. Ahora separarás la lógica de la sintaxis para revisar todos los caminos antes de programarlos.',
  problem: 'Una regla con varios caminos se vuelve confusa si empiezas por llaves y paréntesis sin decidir primero qué preguntas debe responder.',
  mentalModel: 'El pseudocódigo nombra pasos; el diagrama muestra caminos. Ambos permiten revisar la lógica antes de comprometerse con sintaxis.',
  representation: 'Inicio; si solicitados es cero o menos, rechazar; si supera cupos, rechazar; en caso contrario, aceptar; fin.',
  workedExample: SOLUTION,
  workedExampleNarration: 'Las dos primeras condiciones son guardas: cada una rechaza un caso inválido y termina con return false. Solo si ambas se superan, la última línea devuelve true.',
  trace: 'Para cinco cupos y dos solicitados, la primera pregunta es no, la segunda también es no y el flujo llega a aceptar.',
  errorWalkthrough: 'Un diagrama con una rama sin salida está incompleto. En código, devolver true al principio oculta las demás decisiones aunque la sintaxis sea válida.',
  transferExample: 'Dibuja primero el flujo para retirar dinero: rechaza cantidades no positivas, rechaza las que superan el saldo y acepta las demás. Luego tradúcelo a if.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Traduce el flujo a código',
  challengeInstructions: 'Implementa el diagrama en puedeReservar. Rechaza cantidades no positivas y solicitudes mayores que los cupos.',
  tests: [
    { id: 'reserva-normal', description: 'Acepta una solicitud posible', validatorType: 'function-call', targetFunction: 'puedeReservar', args: [5, 2], expectedReturn: true },
    { id: 'reserva-supera', description: 'Rechaza una solicitud que supera cupos', validatorType: 'function-call', targetFunction: 'puedeReservar', args: [2, 3], expectedReturn: false },
    { id: 'reserva-cero', description: 'Rechaza cero lugares', validatorType: 'function-call', targetFunction: 'puedeReservar', args: [5, 0], expectedReturn: false },
  ],
  skillsRequired: ['functions', 'conditionals', 'booleans'],
  skillsIntroduced: ['pseudocode', 'flowchart', 'trace-path'],
  commonMistakes: ['Dibujar un camino sin salida.', 'Traducir símbolos sin comprobar un ejemplo en cada rama.'],
});
