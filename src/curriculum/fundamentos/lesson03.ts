import { compileLesson } from '../../engine/lessonCompiler';
import {
  L03_SOLUTION,
  L03_TYPES,
  L03_VARS,
  lesson03Workspace,
} from './pages';

const AUDIO_MS = 118_200;

export const LESSON_03 = compileLesson({
  id: 'fundamentos-03',
  title: '3. Variables y tipos',
  description: 'Guarda un dato con let o const y entiende texto, número y verdadero o falso.',
  audioUrl: '/audio/fundamentos-03.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson03Workspace,
  concepts: ['Qué es una variable', 'let y const'],
  teachNotes: [
    {
      title: 'Una etiqueta, un valor',
      body: 'La variable es el nombre. El valor es lo que hay detrás. Si el valor puede cambiar, usa let. Si no, const.',
    },
    {
      title: 'El tipo importa',
      body: 'El texto va entre comillas. Los números no. true y false son sí y no. typeof te dice qué hay dentro.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Recordar datos' },
    {
      at: 110,
      type: 'speak',
      text: 'Un programa necesita recordar cosas. Un nombre. Un número. Si algo está encendido o no. Eso se guarda en variables.',
    },
    {
      at: 10610,
      type: 'speak',
      text: 'Piensa en una etiqueta pegada a un valor. La etiqueta es el nombre. El valor es lo que hay detrás. Si más tarde cambias el valor, la etiqueta sigue siendo la misma.',
    },
    {
      at: 11200,
      type: 'gesture',
      durationMs: 1400,
      points: [
        { x: 52, y: 30, targetArea: 'preview' },
        { x: 62, y: 48, targetArea: 'preview' },
        { x: 48, y: 58, targetArea: 'preview' },
      ],
    },
    { at: 23630, type: 'chapter', title: 'let y const' },
    {
      at: 23630,
      type: 'speak',
      text: 'En JavaScript hay dos formas que nos importan. let, cuando el valor puede cambiar. const, cuando no quieres que cambie.',
    },
    { at: 24800, type: 'switch', filePath: 'app.js' },
    {
      at: 24800,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 48, y: 32, targetArea: 'files', clicked: true },
        { x: 30, y: 22, targetArea: 'editor' },
      ],
    },
    {
      at: 33850,
      type: 'speak',
      text: 'Voy a escribir dos líneas. let edad igual a 25. const ciudad igual a Lima, entre comillas.',
    },
    { at: 34800, type: 'write', filePath: 'app.js', mode: 'replace', content: L03_VARS },
    { at: 43000, type: 'run' },
    {
      at: 45790,
      type: 'speak',
      text: 'edad se puede actualizar. ciudad queda fija. Si intentas cambiar ciudad, JavaScript se queja. Empieza con const. Pasa a let solo si de verdad va a cambiar.',
    },
    {
      at: 47000,
      type: 'gesture',
      durationMs: 1100,
      points: [
        { x: 58, y: 42, targetArea: 'preview' },
        { x: 70, y: 42, targetArea: 'preview' },
      ],
    },
    { at: 60050, type: 'chapter', title: 'Tipos' },
    {
      at: 60050,
      type: 'speak',
      text: 'Los valores no son todos iguales. Hay tipos.',
    },
    {
      at: 64550,
      type: 'speak',
      text: 'El texto va entre comillas. Se llama string. Los números van sin comillas. true y false son sí y no. Se llaman booleanos.',
    },
    {
      at: 76450,
      type: 'speak',
      text: 'typeof de hola, entre comillas, da string. typeof de 25 da number. typeof de true da boolean.',
    },
    { at: 77200, type: 'write', filePath: 'app.js', mode: 'replace', content: L03_TYPES },
    { at: 84000, type: 'run' },
    {
      at: 87310,
      type: 'speak',
      text: 'Si pones comillas alrededor de 25, ya no es un número. Es texto. Y no puedes sumarlo como número hasta convertirlo.',
    },
    { at: 96550, type: 'chapter', title: 'Tu turno' },
    {
      at: 96550,
      type: 'speak',
      text: 'Ahora te toca a ti. Crea tres datos. Un nombre con const. Una edad con let. Y un boolean que se llame listo. Muéstralos en la página. Deja las comillas en el nombre.',
    },
    {
      at: 103200,
      type: 'challenge',
      challenge: {
        id: 'reto-tres-datos',
        title: 'Reto: tres datos',
        instructions: `Crea tres variables y muéstralas.

1. const nombre = "tu nombre";
2. let edad = un número;
3. const listo = true o false;
4. Escríbelas en la página (textContent) y pulsa Run.`,
        tests: [
          {
            id: 'const-nombre',
            description: 'Hay un nombre con const, entre comillas',
            validatorType: 'source-regex',
            regexPattern: 'const\\s+nombre\\s*=\\s*["\'][^"\']+["\']',
            errorMessage: 'Necesito const nombre = "algo";',
            hintTip: 'Revisa que el nombre lleve comillas.',
          },
          {
            id: 'let-edad',
            description: 'Hay una edad con let',
            validatorType: 'source-regex',
            regexPattern: 'let\\s+edad\\s*=\\s*-?\\d+',
            errorMessage: 'Necesito let edad = 25; (sin comillas).',
            hintTip: 'La edad es número, sin comillas.',
          },
          {
            id: 'boolean-listo',
            description: 'Hay un boolean listo',
            validatorType: 'source-regex',
            regexPattern: '(const|let)\\s+listo\\s*=\\s*(true|false)',
            errorMessage: 'Necesito const listo = true; o false.',
            hintTip: 'listo es true o false, sin comillas.',
          },
          {
            id: 'nombre-se-muestra',
            description: 'El nombre aparece en la página',
            validatorType: 'dom-check',
            domSelector: '#val-nombre',
            domProperty: 'innerText',
            regexPattern: '[^—\\s]{2,}',
            errorMessage: 'No vemos el nombre en #val-nombre. ¿Asignaste textContent?',
            hintTip: 'document.getElementById("val-nombre").textContent = nombre;',
          },
        ],
        hints: [
          { level: 1, title: 'Tres líneas', text: 'Una para el nombre, una para la edad, una para listo.' },
          { level: 2, title: 'Comillas', text: 'El nombre lleva comillas. El número y true/false no.' },
          { level: 3, title: 'Pintar', text: 'document.getElementById("val-nombre").textContent = nombre;' },
        ],
        solutionExplanation: 'const para lo que no cambia. let para lo que sí. El tipo lo decide cómo escribes el valor.',
      },
    },
    { at: 110200, type: 'write', filePath: 'app.js', mode: 'replace', content: L03_SOLUTION },
    { at: 114200, type: 'run' },
    {
      at: 110790,
      type: 'speak',
      text: 'Si los ves a la derecha, ya sabes guardar información. La próxima vez vamos a operar con esos datos. Sumar, comparar, decidir.',
    },
  ],
});
