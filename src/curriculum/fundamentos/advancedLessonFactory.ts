import { compileLesson } from '../../engine/lessonCompiler';
import { ChallengeTest, ScrimLessonData, WorkspaceSnapshot } from '../../types/scrim';
import { thinkingWorkspace } from './thinkingWorkspaces';

export interface AdvancedLessonSpec {
  number: number;
  executionMode: 'logic' | 'browser';
  slug: string;
  title: string;
  problem: string;
  bridge: string;
  mentalModel: string;
  representation: string;
  workedExample: string;
  workedExampleNarration: string;
  trace: string;
  errorWalkthrough: string;
  transferExample: string;
  starter: string;
  solution: string;
  challengeTitle: string;
  challengeInstructions: string;
  tests: ChallengeTest[];
  skillsRequired: string[];
  skillsIntroduced: string[];
  commonMistakes: string[];
  workspace?: WorkspaceSnapshot;
  filePath?: string;
  audioUrl?: string;
  durationMs?: number;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase('es') + text.slice(1);
}

export function advancedLesson(spec: AdvancedLessonSpec): ScrimLessonData {
  const id = `fundamentos-${String(spec.number).padStart(2, '0')}`;
  const filePath = spec.filePath ?? 'app.js';
  const tone = spec.number % 3;
  const problemLead = [
    'Veamos por qué esto importa.',
    'Imagina que estás construyendo algo real.',
    'Aquí aparece una dificultad muy común.',
  ][tone];
  const modelLead = [
    'Quédate con esta idea:',
    'La forma más útil de pensarlo es esta:',
    'Antes de mirar la sintaxis, piensa así:',
  ][tone];
  const exampleLead = [
    'Vamos a recorrer un ejemplo.',
    'Mira qué ocurre en un caso concreto.',
    'Probemos la idea con datos pequeños.',
  ][tone];
  const trapLead = [
    'Hay una trampa habitual.',
    'Este es el fallo que más se repite.',
    'Si el resultado no coincide, revisa esto primero.',
  ][tone];
  const advancedIndex = spec.number - 15;
  const representationLead = [
    'Antes de tocar el código, anotemos la evidencia:',
    'Podemos leer la cadena de llamadas como una pequeña ruta:',
    'Dibujemos el recorrido completo con palabras:',
    'Una tabla sencilla nos deja ver cómo avanza el cálculo:',
    'La forma del resultado nos ayuda a escoger:',
    'Partamos el dominio en grupos y fronteras:',
    'Sigue la flecha desde la acción hasta la pantalla:',
    'El dibujo de dependencias queda así:',
    'Repartamos el trabajo antes de escribir archivos:',
    'Este será el orden de construcción:',
  ][advancedIndex];
  const traceLead = [
    'Comparemos las dos operaciones con los mismos datos.',
    'Mira cómo cambia el texto después de cada llamada.',
    'Sigamos una reserva concreta desde la primera pregunta.',
    'Detengámonos en cada vuelta del bucle.',
    'Veamos una búsqueda completa con dos nombres distintos.',
    'Los valores de la frontera dejan visible la diferencia.',
    'Sigamos dos acciones para comprobar que la regla se mantiene.',
    'Fíjate en los datos que entran y salen de la regla.',
    'La frontera se entiende mejor siguiendo un único resultado.',
    'Probemos primero la regla central del proyecto.',
  ][advancedIndex];
  const challengeLead = [
    'Ahora investiga tú el fallo de “Corrige con evidencia”.',
    'Es momento de aplicar el contrato en “Lee el contrato y normaliza”.',
    'Convierte el recorrido en código en “Traduce el flujo a código”.',
    'Completa el patrón de “Completa el acumulador”.',
    'En “Elige la operación por su resultado”, empieza por decidir qué forma debe tener la salida.',
    'Diseña la corrección de “Haz visibles los límites” desde los casos de frontera.',
    'Aplica la transición pedida en “Produce el siguiente estado”.',
    'Separa el cálculo en “Aísla una regla pura”.',
    'Corrige la dependencia en “Coloca la regla en la frontera correcta”.',
    'Construye la primera pieza en “Primera regla del planificador”.',
  ][advancedIndex];
  const verificationLead = [
    'No cierres el fallo con un solo ejemplo.',
    'Después cambia el nombre y también los espacios.',
    'Antes de avanzar, recorre un caso aceptado y dos rechazados.',
    'Compruébalo con una lista vacía y con otra lista de números.',
    'Prueba después una búsqueda que falle y otra que tenga éxito.',
    'Ejecuta los cuatro grupos: debajo, en cada límite y por encima.',
    'Ensaya sumar, restar desde cero y una acción desconocida.',
    'Cambia precio e impuesto para confirmar que la regla usa ambos parámetros.',
    'Usa otros datos para comprobar que la regla no depende del ejemplo visible.',
    'Prueba un plan válido, uno vacío y otro con una prioridad fuera del rango.',
  ][advancedIndex];
  const transferLead = [
    'El mismo método sirve para otro fallo.',
    'Puedes practicar la lectura de contratos con otro método.',
    'Lleva ahora el diagrama a una regla cotidiana.',
    'El acumulador también puede contar en vez de sumar.',
    'Cambia de dominio sin cambiar la pregunta por la forma del resultado.',
    'Aplica la misma estrategia a una condición comercial.',
    'Imagina ahora otra interfaz con estados pequeños.',
    'Haz el mismo reparto en una calculadora de gastos.',
    'Prueba la arquitectura con una aplicación diferente.',
    'Por último, reutiliza el proceso con otro producto.',
  ][advancedIndex];
  const closing = [
    'Quédate con el hábito: observa, formula una hipótesis, cambia una cosa y vuelve a comprobar. Esa secuencia vale más que acertar por casualidad.',
    'Cuando consultes documentación, busca siempre receptor, argumentos, retorno y efectos. Con esas cuatro preguntas puedes aprender métodos nuevos sin memorizarlos todos.',
    'Si puedes explicar cada camino antes de escribir llaves y paréntesis, el código deja de ser una adivinanza y pasa a ser la traducción de un plan.',
    'Un acumulador no es una receta para copiar. Es un valor que resume lo visto hasta ese momento. Si puedes decir qué resume, puedes construirlo.',
    'Antes de elegir un método, describe la salida: un sí o no, un elemento, varios elementos o una lista transformada. Esa decisión suele revelar la herramienta correcta.',
    'Una buena prueba no intenta demostrar que el programa funciona; intenta encontrar dónde deja de cumplir la regla. Por eso los límites son tan valiosos.',
    'Cuando exista estado, deja una sola fuente de verdad y haz que cada cambio siga un recorrido visible. Así la pantalla no termina contando una historia distinta.',
    'Separar módulos no consiste en crear muchos archivos. Consiste en dar a cada parte una responsabilidad clara y reducir lo que necesita conocer de las demás.',
    'La arquitectura de una aplicación pequeña debe ayudarte a responder tres preguntas: dónde viven los datos, dónde se aplican las reglas y quién actualiza la interfaz.',
    'Ya tienes un proceso completo: define una historia pequeña, representa sus datos, escribe una regla, pruébala y conéctala a la interfaz. Construye la siguiente pieza solo cuando esa funcione.',
  ][advancedIndex];
  const speaks = [
    spec.bridge,
    `${problemLead} ${spec.problem}`,
    `${modelLead} ${lowerFirst(spec.mentalModel)}`,
    `${representationLead} ${lowerFirst(spec.representation)}`,
    `${exampleLead} ${spec.workedExampleNarration}`,
    `${traceLead} ${spec.trace}`,
    `${trapLead} ${spec.errorWalkthrough}`,
    `${challengeLead} Lee el contrato, predice un caso y cambia únicamente la regla incompleta.`,
    `${verificationLead} Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.`,
    `${transferLead} ${spec.transferExample}`,
    closing,
  ];

  return compileLesson({
    id,
    title: `${spec.number}. ${spec.title}`,
    description: spec.problem,
    templateId: 'vanilla-js',
    executionMode: spec.executionMode,
    initialWorkspace: spec.workspace ?? thinkingWorkspace(spec.title, spec.starter),
    concepts: spec.skillsIntroduced,
    skillsRequired: spec.skillsRequired,
    skillsIntroduced: spec.skillsIntroduced,
    learningObjectives: [
      `Representar ${spec.title.toLowerCase()} antes de escribir la solución.`,
      'Predecir un caso, comprobarlo y explicar la causa del resultado.',
      'Transferir el patrón a un problema diferente.',
    ],
    commonMistakes: spec.commonMistakes,
    audioUrl: spec.audioUrl,
    durationMs: spec.durationMs,
    fitTimelineToDuration: Boolean(spec.audioUrl && spec.durationMs),
    teachNotes: [
      { title: 'Modelo mental', body: spec.mentalModel },
      { title: 'Representación', body: spec.representation },
      { title: 'Transferencia', body: 'Cambia los datos del ejemplo y vuelve a explicar el flujo antes de ejecutar.' },
    ],
    beats: [
      { type: 'chapter', title: 'Problema y modelo' },
      { type: 'speak', text: speaks[0] },
      { type: 'speak', text: speaks[1] },
      { type: 'speak', text: speaks[2] },
      { type: 'speak', text: speaks[3] },
      { type: 'chapter', title: 'Ejemplo trabajado' },
      { type: 'write', filePath, content: spec.workedExample, mode: 'replace' },
      { type: 'speak', text: speaks[4] },
      { type: 'run' },
      { type: 'speak', text: speaks[5] },
      { type: 'speak', text: speaks[6] },
      { type: 'chapter', title: 'Práctica guiada' },
      { type: 'write', filePath, content: spec.starter, mode: 'replace' },
      { type: 'speak', text: speaks[7] },
      {
        type: 'challenge',
        challenge: {
          id: `${id}-reto`,
          title: spec.challengeTitle,
          instructions: spec.challengeInstructions,
          tests: spec.tests,
          hints: [
            { level: 1, title: 'Vuelve al modelo', text: spec.mentalModel },
            { level: 2, title: 'Traza un caso', text: spec.trace },
            { level: 3, title: 'Aísla la regla', text: 'Cambia el cuerpo de la función; conserva su nombre, parámetros y contrato.' },
          ],
          solutionExplanation: `La solución respeta el contrato y la representación: ${spec.representation}`,
        },
      },
      { type: 'write', filePath, content: spec.solution, mode: 'replace' },
      { type: 'run' },
      { type: 'speak', text: speaks[8] },
      { type: 'speak', text: speaks[9] },
      { type: 'speak', text: speaks[10] },
    ],
  });
}
