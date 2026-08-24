import { advancedLesson } from './advancedLessonFactory';
import { capstoneWorkspace } from './engineeringWorkspaces';

const STARTER = `function esPlanValido(texto, prioridad) {
  // prioridad llega desde el select como texto: "1", "2" o "3".
  return true;
}

console.log(esPlanValido("Estudiar", "2"));
`;
const SOLUTION = `function esPlanValido(texto, prioridad) {
  if (texto.trim() === "") return false;
  return prioridad === "1" || prioridad === "2" || prioridad === "3";
}

console.log(esPlanValido("Estudiar", "2"));
`;

export const LESSON_24 = advancedLesson({
  number: 24,
  executionMode: 'browser',
  durationMs: 170_280,
  audioUrl: '/audio/fundamentos-24.mp3?v=gemini-20260824',
  slug: 'proyecto-final',
  title: 'Proyecto final: planificador personal',
  bridge: 'Ya construiste una aplicación pequeña y aprendiste a depurar, probar y separar responsabilidades. Ahora integrarás esas herramientas sin añadir sintaxis sorpresa.',
  problem: 'Construir una app completa parece inmanejable si intentas escribir toda la interfaz antes de definir requisitos, datos, reglas y pruebas.',
  mentalModel: 'Construye por cortes verticales: una historia pequeña atraviesa dato, regla, evento y vista; se prueba antes de añadir la siguiente.',
  representation: 'Requisito; modelo de tarea; regla de validación; casos de prueba; flujo agregar; render; filtro; revisión de dependencias.',
  workedExample: SOLUTION,
  workedExampleNarration: 'esPlanValido es la primera regla del corte. trim permite tratar un texto de espacios como vacío. Como value entrega texto, la prioridad válida debe ser exactamente uno, dos o tres entre comillas.',
  trace: 'Con el texto Estudiar y la prioridad dos, ambas comprobaciones se cumplen y el plan se acepta. Si el texto solo contiene espacios, se rechaza antes de modificar el estado.',
  errorWalkthrough: 'Empezar por colores, filtros o almacenamiento deja la regla principal sin evidencia. También es un error validar solo el texto visible y guardar datos inválidos en el estado.',
  transferExample: 'Convierte el planificador en un registro de hábitos: conserva el flujo requisito, modelo, regla, casos, evento y vista; cambia únicamente los datos y las reglas del dominio.',
  starter: STARTER,
  solution: SOLUTION,
  challengeTitle: 'Primera regla del planificador',
  challengeInstructions: 'Completa esPlanValido. Rechaza texto vacío o de espacios. prioridad llega desde el select como "1", "2" o "3"; cualquier otro texto se rechaza. No uses DOM dentro de la regla.',
  tests: [
    { id: 'plan-valido', description: 'Acepta un plan completo', validatorType: 'function-call', targetFunction: 'esPlanValido', args: ['Estudiar', '2'], expectedReturn: true },
    { id: 'plan-vacio', description: 'Rechaza espacios', validatorType: 'function-call', targetFunction: 'esPlanValido', args: ['   ', '2'], expectedReturn: false },
    { id: 'plan-prioridad', description: 'Rechaza prioridad fuera de rango', validatorType: 'function-call', targetFunction: 'esPlanValido', args: ['Estudiar', '4'], expectedReturn: false },
  ],
  skillsRequired: ['test-case', 'state-transition', 'module-responsibility', 'small-app-architecture', 'string-trim'],
  skillsIntroduced: ['guided-capstone', 'vertical-slice', 'technical-retrospective'],
  commonMistakes: ['Empezar por detalles visuales sin una regla comprobable.', 'Agregar sintaxis nueva cuando las capacidades existentes bastan.'],
  workspace: capstoneWorkspace(STARTER),
  filePath: 'rules.js',
});
