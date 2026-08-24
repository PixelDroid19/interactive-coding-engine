import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function esEdadValida(edad) {
  // El contrato acepta desde 18 hasta 120, incluidos.
  return edad > 18 && edad < 120;
}

console.log(esEdadValida(18));
`;
const SOLUTION = `function esEdadValida(edad) {
  return edad >= 18 && edad <= 120;
}

console.log(esEdadValida(18));
`;

export const LESSON_20 = advancedLesson({
  number: 20,
  executionMode: 'logic',
  durationMs: 161_480,
  audioUrl: '/audio/fundamentos-20.mp3?v=gemini-20260824',
  slug: 'casos-pruebas',
  title: 'Casos límite y pruebas',
  bridge: 'Ya sabes comparar, combinar condiciones y depurar con evidencia. Ahora aprenderás a elegir datos que puedan revelar una regla incompleta.',
  problem: 'Una función puede pasar el ejemplo habitual y fallar exactamente en la frontera que define la regla.',
  mentalModel: 'Una prueba es una pregunta deliberada al programa. Combina caso normal, límites, vacío o inválido y un caso distinto al usado al implementar.',
  representation: 'Particiones: menor de dieciocho rechaza; de dieciocho a ciento veinte acepta; mayor de ciento veinte rechaza. Prueba junto a cada frontera.',
  workedExample: SOLUTION,
  workedExampleNarration: 'La primera comparación incluye dieciocho con mayor o igual. La segunda incluye ciento veinte con menor o igual. El operador y exige que ambas fronteras se cumplan.',
  trace: 'Dieciocho debe entrar por igualdad; ciento veinte también. Diecisiete y ciento veintiuno deben caer fuera.',
  errorWalkthrough: 'Probar solo una edad intermedia no distingue mayor de mayor o igual. Cambiar el resultado esperado para hacerlo coincidir con el código elimina la utilidad de la prueba.',
  transferExample: 'Para un envío gratis desde cincuenta, prueba cuarenta y nueve, cincuenta y cincuenta y uno. Explica qué error detecta cada caso.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Haz visibles los límites',
  challengeInstructions: 'Corrige esEdadValida. Debe aceptar 18 y 120, y rechazar valores fuera de ese intervalo.',
  tests: [
    { id: 'limite-inferior', description: 'Acepta exactamente 18', validatorType: 'function-call', targetFunction: 'esEdadValida', args: [18], expectedReturn: true },
    { id: 'limite-superior', description: 'Acepta exactamente 120', validatorType: 'function-call', targetFunction: 'esEdadValida', args: [120], expectedReturn: true },
    { id: 'fuera-rango', description: 'Rechaza 121', validatorType: 'function-call', targetFunction: 'esEdadValida', args: [121], expectedReturn: false },
  ],
  skillsRequired: ['functions', 'conditionals', 'operators'],
  skillsIntroduced: ['test-case', 'boundary-case', 'invalid-case', 'regression'],
  commonMistakes: ['Probar solo el centro del rango.', 'Cambiar el resultado esperado para que coincida con el código roto.'],
});
