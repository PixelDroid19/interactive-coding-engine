import { advancedLesson } from './advancedLessonFactory';

const STARTER = `function crearResumen(pendientes, completadas) {
  return "Sin datos";
}

console.log(crearResumen(3, 2));
`;
const SOLUTION = `function crearResumen(pendientes, completadas) {
  const total = pendientes + completadas;
  return "Total: " + total + " · Pendientes: " + pendientes;
}

console.log(crearResumen(3, 2));
`;

export const LESSON_23 = advancedLesson({
  number: 23,
  executionMode: 'logic',
  durationMs: 126_360,
  audioUrl: '/audio/fundamentos-23.mp3?v=gemini-20260824',
  slug: 'arquitectura-app',
  title: 'Arquitectura para una app pequeña',
  bridge: 'Ya identificas estado, reglas, módulos y dependencias. Arquitectura significa decidir cómo cooperan esas partes sin mezclar sus responsabilidades.',
  problem: 'Al crecer una app, cada cambio duele si no está claro dónde viven los datos, las reglas, la coordinación y la interfaz.',
  mentalModel: 'Arquitectura no es memorizar nombres: es asignar una responsabilidad a cada parte y permitir dependencias en una dirección comprensible.',
  representation: 'Datos guardan estado; reglas calculan; coordinación responde a eventos; interfaz renderiza. Las reglas no importan la interfaz.',
  workedExample: SOLUTION,
  workedExampleNarration: 'crearResumen es una regla porque recibe datos y devuelve texto sin consultar la página. Coordinación puede llamarla después de un evento y entregar su resultado a render.',
  trace: 'crearResumen pertenece a reglas porque solo recibe números y devuelve texto. El DOM puede mostrar su retorno sin que la regla conozca la página.',
  errorWalkthrough: 'Crear carpetas llamadas datos y vistas no arregla una dependencia invertida. Si una regla necesita document, ya no puede probarse ni reutilizarse fuera de esa pantalla.',
  transferExample: 'Diseña una app de lecturas con estado, reglas, coordinación e interfaz. Para cada flecha explica qué dato cruza la frontera y por qué la dirección es necesaria.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Coloca la regla en la frontera correcta',
  challengeInstructions: 'Completa crearResumen sin usar document. Debe devolver “Total: 5 · Pendientes: 3” para 3 y 2, usando los parámetros.',
  tests: [
    { id: 'resumen-3-2', description: 'Resume los datos recibidos', validatorType: 'function-call', targetFunction: 'crearResumen', args: [3, 2], expectedReturn: 'Total: 5 · Pendientes: 3' },
    { id: 'resumen-otro', description: 'No fija el ejemplo', validatorType: 'function-call', targetFunction: 'crearResumen', args: [1, 4], expectedReturn: 'Total: 5 · Pendientes: 1' },
  ],
  skillsRequired: ['module-responsibility', 'unidirectional-flow', 'functions', 'state-and-render'],
  skillsIntroduced: ['small-app-architecture', 'boundary', 'data-rules-ui'],
  commonMistakes: ['Llamar arquitectura a una lista de carpetas sin responsabilidades.', 'Hacer que las reglas necesiten document para poder probarse.'],
});
