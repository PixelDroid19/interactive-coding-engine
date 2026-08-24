import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function calcularTotal(precio, cantidad) {
  // El fallo está en la operación. Formula una hipótesis antes de cambiarla.
  return precio + cantidad;
}

console.log(calcularTotal(4, 3));
`;
const SOLUTION = `function calcularTotal(precio, cantidad) {
  return precio * cantidad;
}

console.log(calcularTotal(4, 3));
`;

export const LESSON_15 = advancedLesson({
  number: 15,
  executionMode: 'logic',
  durationMs: 144_560,
  audioUrl: '/audio/fundamentos-15.mp3?v=gemini-20260824',
  slug: 'depuracion',
  title: 'Depurar sin adivinar',
  bridge: 'Ya sabes seguir funciones, parámetros y operadores. Ahora usarás esas piezas para encontrar la primera diferencia entre lo esperado y lo observado.',
  problem: 'Un total funciona con algunos números por casualidad y falla con otros. Cambiar líneas al azar puede esconder la causa.',
  mentalModel: 'Depurar es un ciclo: reproduce el fallo, escribe qué esperabas, aísla la primera diferencia, formula una hipótesis, cambia una cosa y vuelve a comprobar.',
  representation: 'Esperado doce; observado siete. Los parámetros están bien y la primera diferencia aparece en la operación de la función.',
  workedExample: SOLUTION,
  workedExampleNarration: 'calcularTotal recibe precio y cantidad. El contrato pide un total, por eso ambos parámetros participan en una multiplicación y return entrega el número calculado.',
  trace: 'Con precio cuatro y cantidad tres, la multiplicación produce doce. La suma produce siete; esa observación distingue las dos hipótesis.',
  errorWalkthrough: 'Cambiar el console.log o devolver doce directamente puede hacer pasar un ejemplo, pero no corrige la regla. La causa está dentro de la operación y debe funcionar con otros datos.',
  transferExample: 'Usa el mismo ciclo para una función de descuento: escribe esperado y observado, localiza la primera diferencia y prueba un segundo precio antes de cerrar el fallo.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Corrige con evidencia',
  challengeInstructions: 'Corrige calcularTotal sin cambiar su nombre ni parámetros. Debe devolver precio por cantidad para casos distintos.',
  tests: [
    { id: 'total-4x3', description: 'Calcula cuatro por tres', validatorType: 'function-call', targetFunction: 'calcularTotal', args: [4, 3], expectedReturn: 12 },
    { id: 'total-7x2', description: 'La regla funciona con otro caso', validatorType: 'function-call', targetFunction: 'calcularTotal', args: [7, 2], expectedReturn: 14 },
  ],
  skillsRequired: ['functions', 'operators'],
  skillsIntroduced: ['debug-cycle', 'hypothesis', 'regression-check'],
  commonMistakes: ['Cambiar varias líneas antes de reproducir.', 'Probar únicamente el caso que inspiró la corrección.'],
});
