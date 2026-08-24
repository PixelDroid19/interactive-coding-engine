import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function normalizarNombre(nombre) {
  return nombre;
}

console.log(normalizarNombre("  ana "));
`;
const SOLUTION = `function normalizarNombre(nombre) {
  return nombre.trim().toUpperCase();
}

console.log(normalizarNombre("  ana "));
`;

export const LESSON_16 = advancedLesson({
  number: 16,
  executionMode: 'logic',
  durationMs: 104_280,
  audioUrl: '/audio/fundamentos-16.mp3?v=gemini-20260824',
  slug: 'metodos-documentacion',
  title: 'Métodos y documentación',
  bridge: 'Ya conoces strings, objetos, propiedades y llamadas de función. Un método combina esas ideas: es una función disponible a través de un valor.',
  problem: 'Necesitas limpiar y comparar textos, pero memorizar una lista de métodos no explica qué reciben, qué devuelven ni qué modifican.',
  mentalModel: 'En receptor.metodo(argumento), el receptor ofrece una operación. La documentación es su contrato: parámetros, retorno, efecto y ejemplos.',
  representation: 'nombre es el receptor; trim no recibe argumentos y devuelve otro string; toUpperCase devuelve otro string en mayúsculas. Ninguno modifica el string original.',
  workedExample: SOLUTION,
  workedExampleNarration: 'nombre es el receptor. trim abre y cierra paréntesis sin argumentos y devuelve otro texto sin espacios exteriores. Sobre ese resultado, toUpperCase devuelve una versión en mayúsculas.',
  trace: 'El valor pasa de dos espacios, ana y un espacio, a ana; después pasa a ANA. Cada llamada entrega el receptor de la siguiente.',
  errorWalkthrough: 'Escribir length con paréntesis confunde una propiedad con un método. También es un error asumir que trim cambia nombre: los strings no se modifican; cada método devuelve otro valor.',
  transferExample: 'Consulta el contrato de endsWith y úsalo para decidir si un nombre termina en punto js. Identifica receptor, argumento, retorno y si existe mutación.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Lee el contrato y normaliza',
  challengeInstructions: 'Completa normalizarNombre. Quita espacios de los extremos y devuelve el texto en mayúsculas.',
  tests: [
    { id: 'normaliza-ana', description: 'Limpia espacios y convierte a mayúsculas', validatorType: 'function-call', targetFunction: 'normalizarNombre', args: ['  ana '], expectedReturn: 'ANA' },
    { id: 'normaliza-luis', description: 'Usa el parámetro, no el ejemplo', validatorType: 'function-call', targetFunction: 'normalizarNombre', args: ['Luis'], expectedReturn: 'LUIS' },
  ],
  skillsRequired: ['strings', 'functions', 'function-call-syntax'],
  skillsIntroduced: ['methods', 'api-contract', 'string-trim', 'string-uppercase'],
  commonMistakes: ['Escribir length() aunque length es una propiedad.', 'Suponer que todos los métodos modifican el receptor.'],
});
