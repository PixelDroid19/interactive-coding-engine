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
  const walkthrough = input.walkthrough ?? `${input.model} Recorre la entrada, el ciclo que la procesa y la salida observable antes de ejecutar.`;
  const investigation = input.investigation ?? `Abre la primera fuente oficial, localiza la firma de la API y anota entradas, salida, ciclo y errores antes de copiar un ejemplo.`;
  const keyPoints = input.keyPoints ?? [input.concepts[0].label, input.concepts[1].label, 'Contrato observable', 'Prueba con más de un caso'];
  const questions = input.questions ?? [
    { question: `¿Cuándo usar ${input.concepts[0].label}?`, answer: input.whenToUse },
    { question: '¿Cómo sé si funciona?', answer: `Comprueba ${input.appName} desde su API pública y repite la prueba con otra entrada.` },
  ];
  const diagram = input.diagram ?? input.reasoningSteps.join(' → ');
  const conceptNames = input.concepts.map((concept) => concept.label).join(' y ');
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
      `${input.summary} En esta clase construiremos ${input.appName}; la meta no es memorizar una API, sino poder predecir el contrato antes de escribir código.`,
      input.model,
      demoTransitions[transitionIndex],
      `${input.whenToUse} Si el problema no necesita esa frontera, una función o HTML normal puede ser una decisión más sencilla.`,
      `${input.bestPractices} El error que más veremos es este: ${input.commonErrors}`,
      practiceTransitions[transitionIndex],
    ],
    reading: {
      definition: input.summary,
      mentalModel: input.model,
      secondExample: input.secondExample ?? input.example,
      walkthrough,
      whenToUse: input.whenToUse,
      bestPractices: input.bestPractices,
      investigation,
      commonErrors: input.commonErrors,
      keyPoints,
      questions,
      transfer: input.transfer,
      diagram,
      sources: input.sources,
    },
  };
}

export const appHtml = (title: string, elementMarkup: string) => `<!doctype html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="style.css"></head>
<body><main><p class="eyebrow">Taller de componentes</p><h1>${title}</h1>${elementMarkup}</main><script type="module" src="app.js"></script></body>
</html>`;

export const BASE_CSS = `html,body{margin:0;min-height:100%;background:#0d1118;color:#f8fafc;font-family:system-ui,sans-serif}body{padding:32px}main{max-width:760px;margin:auto}.eyebrow{color:#ffe600;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.1em}h1{font-size:30px;border-bottom:1px solid #334155;padding-bottom:14px}button,input,select{font:inherit}button{cursor:pointer}`;
