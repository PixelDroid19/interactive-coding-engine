import { ChallengeTest } from '../../types/scrim';
import { ComponentCourseLessonSpec } from './types';

export const MDN = 'MDN Web Docs';
export const LIT = 'Lit';

export const source = (title: string, url: string, purpose: string, publisher = MDN) => ({ title, url, purpose, publisher });

export const sourceTest = (id: string, description: string, regexPattern: string): ChallengeTest => ({
  id,
  description,
  validatorType: 'source-regex',
  regexPattern,
});

export const browserTest = (id: string, description: string, customValidatorScript: string): ChallengeTest => ({
  id,
  description,
  validatorType: 'browser-script',
  customValidatorScript,
});

interface LessonInput extends Omit<ComponentCourseLessonSpec, 'script' | 'reading'> {
  model: string;
  secondExample?: string;
  walkthrough?: string;
  whenToUse: string;
  bestPractices: string;
  investigation?: string;
  commonErrors: string;
  keyPoints?: string[];
  questions?: { question: string; answer: string }[];
  transfer: string;
  diagram?: string;
  sources: ComponentCourseLessonSpec['reading']['sources'];
}

export function lesson(input: LessonInput): ComponentCourseLessonSpec {
  const baseWalkthrough = input.walkthrough ?? `${input.model} Recorre la entrada, el ciclo que la procesa y la salida observable antes de ejecutar.`;
  const baseInvestigation = input.investigation ?? 'Abre la primera fuente oficial, localiza la firma de la API y anota entradas, salida, ciclo y errores antes de copiar un ejemplo.';
  const keyPoints = input.keyPoints ?? [input.concepts[0].label, input.concepts[1].label, 'Contrato observable', 'Prueba con más de un caso'];
  const questions = input.questions ?? [
    { question: `¿Cuándo usar ${input.concepts[0].label}?`, answer: input.whenToUse },
    { question: '¿Cómo sé si funciona?', answer: `Comprueba ${input.appName} desde su API pública y repite la prueba con otra entrada.` },
  ];
  const diagram = input.diagram ?? input.reasoningSteps.join(' → ');
  const conceptNames = input.concepts.map((concept) => concept.label).join(' y ');
  const conceptExplanation = input.concepts
    .map((concept) => {
      const description = concept.desc.replace(/[.!?]+$/, '');
      return `${concept.label} significa ${description.charAt(0).toLowerCase()}${description.slice(1)}`;
    })
    .join(' En cambio, ');
  const orderedSteps = input.reasoningSteps
    .map((step, index) => `${['Primero', 'Después', 'A continuación', 'Por último'][index]}, ${step.charAt(0).toLowerCase()}${step.slice(1)}.`)
    .join(' ');
  const mentalModel = `${input.model} En términos concretos, ${conceptExplanation}. La relación entre ambos conceptos importa más que memorizar sus nombres: uno explica la responsabilidad y el otro permite observar si esa responsabilidad se cumple. Antes de programar, identifica quién recibe la entrada, quién posee el dato, qué momento del ciclo puede cambiarlo y qué salida pública verá otra parte de la aplicación.`;
  const walkthrough = `${baseWalkthrough} ${orderedSteps} Detente después de cada paso y predice el estado siguiente. Si tu predicción y la vista previa no coinciden, no cambies varias líneas a la vez: localiza la primera transición que dejó de cumplir el contrato. Repite el recorrido con una segunda entrada y con un caso límite; una explicación que solo funciona para el ejemplo feliz todavía está incompleta.`;
  const whenToUse = `${input.whenToUse} La señal más útil para decidir es la frontera: pregunta si ${conceptNames} reducen acoplamiento, hacen visible un ciclo o protegen un contrato que otra pieza realmente consumirá. No introduzcas la abstracción solo porque existe en Lit o en la plataforma. Si una función, una propiedad o HTML semántico resuelven el mismo problema con menos estado y menos ciclo de vida, esa opción más pequeña suele ser preferible. Documenta también el coste: dependencias, limpieza, accesibilidad y pruebas que la decisión añade.`;
  const bestPractices = `${input.bestPractices} Trabaja con una lista de control: define entradas y salidas públicas; asigna un único dueño al estado; conserva identidad estable; limpia listeners, timers y suscripciones; usa semántica nativa antes de ARIA; y prueba el comportamiento desde la API que usaría un consumidor. Incluye como mínimo un valor alternativo, un estado vacío o inválido y una reconexión cuando exista ciclo de vida. Una buena práctica no es estilo personal: debe reducir un fallo concreto o hacer más claro el contrato para otra persona.`;
  const investigation = `${baseInvestigation} Para investigar ${input.appName}, abre primero la consola y la vista previa, reproduce el fallo sin editar y escribe la diferencia entre lo esperado y lo observado. Después sigue este flujo: ${input.reasoningSteps.join(' → ')}. Comprueba valores y referencias en la frontera, no cada línea interna. En la documentación oficial busca el receptor de la API, sus parámetros, el valor que devuelve, el momento del ciclo donde se permite y si exige limpieza. Formula una sola hipótesis, cambia una causa y vuelve a ejecutar el caso original más una variante.`;
  const commonErrors = `${input.commonErrors} Estos errores suelen aparecer como síntomas distintos: una vista que no cambia, un evento que no cruza Shadow DOM, una suscripción duplicada o un test que solo acepta una línea exacta. Empieza por clasificar el síntoma como contrato, estado, ciclo, render o recurso externo. Luego busca la primera causa observable; no añadas requestUpdate, setTimeout, reflexión o acceso privado como parche hasta explicar por qué el modelo actual no avisó del cambio. La corrección debe conservar el comportamiento anterior y cubrir el caso que reveló el problema.`;
  const diagramExplanation = `${diagram}. Lee el diagrama de izquierda a derecha como una secuencia causal, no como una lista de archivos. Cada flecha significa “este paso entrega información o control al siguiente”. Para depurar, marca la última flecha que sí ocurrió y la primera que no. Para diseñar otra aplicación, conserva las responsabilidades de los nodos aunque cambien nombres, datos y aspecto visual.`;
  const demoTransitions = [
    `Vamos con una aplicación distinta antes del reto. En ${input.appName}, sigue la entrada, el cambio y la salida; después señala dónde aparecen ${conceptNames}.`,
    `No leas el ejemplo como una receta. Pausa en cada paso de ${input.appName} y predice qué observará el navegador antes de continuar.`,
    `La demostración cambia de contexto a propósito. Recorre ${input.appName} desde su contrato público hasta el DOM y pregunta qué sabe cada pieza.`,
    `Ahora pondremos el modelo bajo presión con ${input.appName}. Primero identifica los datos; luego el ciclo que actúa sobre ellos; al final comprueba la interfaz.`,
    `Fíjate en la frontera, no solo en la sintaxis. Mientras construimos ${input.appName}, separa responsabilidades de plataforma, componente y consumidor.`,
    `Antes de ejecutar, haz una apuesta: ¿qué debería ocurrir en ${input.appName} y por qué? Usa ${conceptNames} para justificar tu predicción.`,
    `Este ejemplo no es el ejercicio disfrazado. ${input.appName} nos permitirá observar el mismo principio en un problema diferente y comparar decisiones.`,
    `Vamos a leer el código de ${input.appName} como un flujo. Nombra la entrada, quién posee el estado, qué dispara el cambio y qué evidencia aparece en pantalla.`,
  ];
  const practiceTransitions = [
    `Ahora cambia el contexto: construye ${input.appName}. Empieza por el contrato observable, resuelve una decisión cada vez y prueba una variante antes de Comprobar.`,
    `Te toca tomar las decisiones en ${input.appName}. El starter prepara el escenario, pero la regla central sigue abierta; usa la vista previa como evidencia.`,
    `Cierra la explicación y trabaja desde el comportamiento esperado. Para completar ${input.appName}, predice, implementa y comprueba más de una entrada.`,
    `El siguiente paso ya no es copiar. Construye ${input.appName}, explica por qué funciona y busca un caso límite antes de enviar tu respuesta.`,
    `Lleva el modelo a ${input.appName}. Si te atascas, vuelve al flujo de cuatro pasos; las pistas orientan la investigación, pero no entregan el programa.`,
    `Es tu turno con ${input.appName}. Haz primero el camino mínimo completo, compruébalo en el navegador y después añade el caso alternativo.`,
    `Resuelve ${input.appName} desde la API pública hacia dentro. El código inicial conserva contexto, no la respuesta; deja que las comprobaciones guíen tu diagnóstico.`,
    `Construye ${input.appName} sin perseguir líneas exactas. Cualquier solución que cumpla el contrato, los casos límite y la interacción observable es válida.`,
  ];
  const transitionIndex = (input.number - 1) % demoTransitions.length;
  return {
    ...input,
    script: [
      `${input.summary} En esta clase construiremos ${input.appName}. Antes de tocar el editor, vamos a nombrar el problema, el contrato público y la evidencia que demostraría que funciona. La meta no es recordar una forma exacta de escribir la API: es poder predecir qué ocurre, justificar la frontera del componente y reconocer cuándo esa decisión no conviene.`,
      `${mentalModel} Quédate con esta pregunta: si otra persona usa el componente sin leer su implementación, ¿qué debería poder configurar, observar y esperar? Esa respuesta será nuestra guía durante toda la clase.`,
      `${demoTransitions[transitionIndex]} ${orderedSteps} No avances por inercia: en cada transición señala el dueño del estado y la salida observable. Después cambia mentalmente una entrada y decide qué partes deberían permanecer estables.`,
      `${whenToUse} En un equipo real también tendrás que explicar por qué no elegiste una alternativa más sencilla. Una abstracción gana su lugar cuando hace el contrato más claro y el cambio futuro menos peligroso, no cuando solo reduce unas pocas líneas.`,
      `${bestPractices} El error que más veremos es este: ${input.commonErrors} Cuando aparezca, reproduce primero el síntoma, clasifícalo y corrige una sola causa. Así podrás distinguir una solución real de un parche que casualmente hace pasar el ejemplo.`,
      `${practiceTransitions[transitionIndex]} Tu entrega debe cubrir el camino principal, un caso alternativo y una explicación breve del flujo. Si una prueba falla aunque la interfaz parezca correcta, compara el contrato y el dato recibido; no copies una línea para satisfacer el patrón.`,
    ],
    reading: {
      definition: `${input.summary} Esta lectura conecta el concepto con decisiones de arquitectura, ciclo de vida, accesibilidad y pruebas para que puedas transferirlo a una aplicación distinta.`,
      mentalModel,
      secondExample: input.secondExample ?? input.example,
      walkthrough,
      whenToUse,
      bestPractices,
      investigation,
      commonErrors,
      keyPoints,
      questions,
      transfer: input.transfer,
      diagram: diagramExplanation,
      sources: input.sources,
    },
  };
}

export const appHtml = (title: string, elementMarkup: string) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <main>
      <p class="eyebrow">Taller de componentes</p>
      <h1>${title}</h1>
      ${elementMarkup}
    </main>
    <script type="module" src="app.js"></script>
  </body>
</html>`;

export const BASE_CSS = `html,
body {
  min-height: 100%;
  margin: 0;
  background: #0d1118;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}

body {
  padding: 32px;
}

main {
  max-width: 760px;
  margin: auto;
}

.eyebrow {
  color: #ffe600;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1 {
  padding-bottom: 14px;
  border-bottom: 1px solid #334155;
  font-size: 30px;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}`;
