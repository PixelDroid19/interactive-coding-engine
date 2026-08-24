import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function sumar(numeros) {
  let total = 0;
  // Falta actualizar el estado en cada vuelta.
  return total;
}

console.log(sumar([2, 3, 5]));
`;
const SOLUTION = `function sumar(numeros) {
  let total = 0;
  for (let i = 0; i < numeros.length; i++) {
    total = total + numeros[i];
  }
  return total;
}

console.log(sumar([2, 3, 5]));
`;

export const LESSON_18 = advancedLesson({
  number: 18,
  executionMode: 'logic',
  durationMs: 150_920,
  audioUrl: '/audio/fundamentos-18.mp3?v=gemini-20260824',
  slug: 'patrones-algoritmos',
  title: 'Patrones de algoritmos',
  bridge: 'Ya sabes recorrer arrays con un for y conservar valores en variables. Ahora convertirás ese recorrido en un patrón que puedas reconocer y explicar.',
  problem: 'Muchos problemas parecen distintos, pero todos recorren una colección y recuerdan un resultado parcial.',
  mentalModel: 'En una pasada, el acumulador resume lo visto hasta ahora. Su valor inicial debe representar “todavía no he procesado ningún elemento”.',
  representation: 'Tabla: antes total cero; lee dos y total dos; lee tres y total cinco; lee cinco y total diez.',
  workedExample: SOLUTION,
  workedExampleNarration: 'total empieza en cero antes del bucle. En cada vuelta leemos el número que ocupa la posición i y guardamos la suma nueva. return aparece después del bucle porque necesitamos recorrer la lista completa.',
  trace: 'Al inicio de cada vuelta, total contiene exactamente la suma de los elementos anteriores. Esa frase permite detectar una actualización ausente.',
  errorWalkthrough: 'Si declaras total dentro del bucle, cada vuelta borra lo acumulado. Y si sumas i en lugar del elemento que está en esa posición, acumulas índices, no los números de la lista.',
  transferExample: 'Para contar aprobados, conserva cantidad en vez de total y aumenta solo cuando una nota supera el límite. El recorrido es el mismo; cambia el estado parcial.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Completa el acumulador',
  challengeInstructions: 'Completa sumar con una sola pasada. Una lista vacía debe devolver 0 y la función debe usar todos los elementos recibidos.',
  tests: [
    { id: 'suma-varios', description: 'Suma varios números', validatorType: 'function-call', targetFunction: 'sumar', args: [[2, 3, 5]], expectedReturn: 10 },
    { id: 'suma-otro', description: 'Funciona con datos diferentes', validatorType: 'function-call', targetFunction: 'sumar', args: [[4, 1]], expectedReturn: 5 },
  ],
  skillsRequired: ['arrays', 'loops', 'functions', 'variables'],
  skillsIntroduced: ['algorithm-pattern', 'accumulator', 'single-pass'],
  commonMistakes: ['Reiniciar el acumulador dentro del bucle.', 'Usar el índice como si fuera el valor del elemento.'],
});
