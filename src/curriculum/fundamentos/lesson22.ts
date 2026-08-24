import { advancedLesson } from './advancedLessonFactory';

const STARTER = `// Imagina esta función en reglas.js.
function precioConImpuesto(precio, tasa) {
  return precio;
}

console.log(precioConImpuesto(100, 0.19));
`;
const SOLUTION = `// reglas.js exporta una regla pura; no conoce botones ni HTML.
function precioConImpuesto(precio, tasa) {
  return precio + precio * tasa;
}

console.log(precioConImpuesto(100, 0.19));
`;

export const LESSON_22 = advancedLesson({
  number: 22,
  executionMode: 'logic',
  durationMs: 145_640,
  audioUrl: '/audio/fundamentos-22.mp3?v=gemini-20260824',
  slug: 'responsabilidades-modulos',
  title: 'Responsabilidades y módulos',
  bridge: 'Ya separaste reglas puras, estado e interfaz. Ahora aprenderás a agrupar responsabilidades y a reconocer qué parte puede depender de cuál.',
  problem: 'Un archivo que conoce botones, cálculos, datos y render se vuelve difícil de entender y probar sin romper algo cercano.',
  mentalModel: 'Un módulo es una caja de responsabilidades relacionadas con una puerta pequeña. export abre una capacidad; import la solicita desde otro archivo.',
  representation: 'interfaz.js depende de reglas.js; reglas.js calcula sin conocer el DOM. La flecha apunta hacia la capacidad usada y no vuelve en círculo.',
  workedExample: SOLUTION,
  workedExampleNarration: 'precioConImpuesto recibe dos números y devuelve otro número. Por eso puede vivir en un archivo de reglas. La interfaz usa el resultado, pero la regla no necesita conocer la página ni sus botones.',
  trace: 'precioConImpuesto recibe solo datos y devuelve un número. Por eso puede probarse sin página y reutilizarse desde la interfaz.',
  errorWalkthrough: 'Separar código en archivos no crea módulos útiles si todos importan a todos. Una dependencia circular hace que ninguna parte tenga una frontera clara.',
  transferExample: 'Divide una calculadora de gastos en datos, reglas e interfaz. Escribe qué exporta cada módulo y dibuja las flechas de importación antes de crear archivos.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Aísla una regla pura',
  challengeInstructions: 'Completa precioConImpuesto como regla independiente del DOM. Devuelve precio más precio por tasa.',
  tests: [
    { id: 'impuesto-19', description: 'Calcula una tasa decimal', validatorType: 'function-call', targetFunction: 'precioConImpuesto', args: [100, 0.19], expectedReturn: 119 },
    { id: 'impuesto-cero', description: 'Una tasa cero conserva el precio', validatorType: 'function-call', targetFunction: 'precioConImpuesto', args: [80, 0], expectedReturn: 80 },
  ],
  skillsRequired: ['functions', 'objects', 'state-and-render'],
  skillsIntroduced: ['module-responsibility', 'dependency', 'export-import', 'pure-rule'],
  commonMistakes: ['Separar archivos pero mantener todas las responsabilidades mezcladas.', 'Crear importaciones circulares entre interfaz y reglas.'],
});
