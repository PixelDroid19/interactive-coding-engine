import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function contiene(lista, buscado) {
  return false;
}

console.log(contiene(["Ana", "Luis"], "Luis"));
`;
const SOLUTION = `function contiene(lista, buscado) {
  return lista.includes(buscado);
}

console.log(contiene(["Ana", "Luis"], "Luis"));
`;
const WORKED_EXAMPLE = `function esLargo(nombre) {
  return nombre.length > 4;
}

function aMayuscula(nombre) {
  return nombre.toUpperCase();
}

const nombres = ["Ana", "Lucía", "Pedro"];
console.log(nombres.includes("Lucía"));
console.log(nombres.filter(esLargo));
console.log(nombres.map(aMayuscula));
`;

export const LESSON_19 = advancedLesson({
  number: 19,
  executionMode: 'logic',
  durationMs: 144_360,
  audioUrl: '/audio/fundamentos-19.mp3?v=gemini-20260824',
  slug: 'buscar-filtrar-transformar',
  title: 'Buscar, filtrar y transformar',
  bridge: 'Ya sabes arrays, funciones y contratos de métodos. Ahora elegirás una operación según la forma del resultado que necesitas.',
  problem: 'Una colección puede responder preguntas distintas. Confundir encontrar uno, seleccionar varios y transformar todos produce estructuras equivocadas.',
  mentalModel: 'Buscar responde si existe o entrega un elemento; filtrar conserva varios; transformar produce un valor nuevo por cada elemento.',
  representation: 'Intención existe: booleano. Intención selecciona: lista posiblemente más corta. Intención transforma: lista de igual longitud.',
  workedExample: WORKED_EXAMPLE,
  workedExampleNarration: 'includes recibe el valor buscado y devuelve un booleano. filter recibe una función y conserva los elementos para los que esa función devuelve true. map recibe otra función y produce un resultado por cada elemento.',
  trace: 'includes compara el buscado con cada elemento hasta encontrarlo. Para Luis devuelve true; para Marta llega al final y devuelve false.',
  errorWalkthrough: 'map no elimina elementos y filter no los transforma. Cuando entregas una función a uno de estos métodos, escribes su nombre sin paréntesis para que el método la llame con cada dato.',
  transferExample: 'En una lista de precios, usa includes para preguntar por un valor exacto, filter para conservar los menores de cien y map para crear etiquetas de texto.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Elige la operación por su resultado',
  challengeInstructions: 'Completa contiene para devolver true cuando buscado está en lista y false en caso contrario.',
  tests: [
    { id: 'encuentra-luis', description: 'Encuentra un elemento presente', validatorType: 'function-call', targetFunction: 'contiene', args: [['Ana', 'Luis'], 'Luis'], expectedReturn: true },
    { id: 'no-inventa', description: 'No encuentra un elemento ausente', validatorType: 'function-call', targetFunction: 'contiene', args: [['Ana', 'Luis'], 'Marta'], expectedReturn: false },
  ],
  skillsRequired: ['arrays', 'methods', 'functions'],
  skillsIntroduced: ['linear-search', 'selection', 'transformation-intent', 'array-includes', 'callback'],
  commonMistakes: ['Usar map cuando querías eliminar elementos.', 'Devolver dentro de la primera vuelta antes de revisar el resto.'],
});
