import { compileLesson } from '../../engine/lessonCompiler';
import {
  L03_SOLUTION,
  L03_TYPES,
  L03_VARS,
  lesson03Workspace,
} from './preDomWorkspaces';

const AUDIO_MS = 57_750;

export const LESSON_03 = compileLesson({
  id: 'fundamentos-03',
  title: '3. Variables y tipos',
  description: 'Guarda un dato con let o const y entiende texto, número y verdadero o falso.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-03.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson03Workspace,
  executionMode: 'logic',
  concepts: ['Qué es una variable', 'let y const'],
  skillsRequired: ['strings'],
  skillsIntroduced: ['variables', 'types'],
  learningObjectives: [
    'Guardar texto, números y booleanos con nombres claros.',
    'Elegir const o let según si el valor necesita cambiar.',
  ],
  commonMistakes: [
    'Poner comillas a un número y convertirlo accidentalmente en texto.',
    'Usar let para todos los datos aunque nunca cambien.',
  ],
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
      text: 'Los programas necesitan recordar información: el nombre de una persona, una edad o si una opción está activa. Para darle un nombre a cada valor usamos variables.',
    },
    {
      at: 10610,
      type: 'speak',
      text: 'Puedes imaginar una variable como una etiqueta asociada a un valor. La etiqueta nos permite encontrarlo después. Si el valor cambia, podemos seguir usando el mismo nombre para acceder al nuevo dato.',
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
      text: 'En JavaScript comenzaremos con dos formas de crear variables. Usamos let cuando necesitaremos cambiar el valor y const cuando queremos mantener la misma asociación.',
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
      text: 'En la primera línea guardamos el número veinticinco con el nombre edad. En la segunda guardamos el texto Lima con el nombre ciudad. El signo igual asocia cada nombre con su valor.',
    },
    { at: 34800, type: 'write', filePath: 'app.js', mode: 'replace', content: L03_VARS },
    { at: 43000, type: 'run' },
    {
      at: 45790,
      type: 'speak',
      text: 'Después cambiamos edad de veinticinco a veintiséis. Eso se llama reasignar: el nombre sigue siendo edad, pero ahora apunta a otro valor. JavaScript no permite hacer lo mismo con ciudad porque la declaramos con const.',
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
      text: 'Ahora fijémonos en los valores. No toda la información se comporta de la misma manera porque existen distintos tipos de datos.',
    },
    {
      at: 64550,
      type: 'speak',
      text: 'Un texto se escribe entre comillas y su tipo se llama string. Los números se escriben sin comillas. true y false representan dos posibilidades y pertenecen al tipo booleano.',
    },
    {
      at: 76450,
      type: 'speak',
      text: 'El operador typeof nos permite preguntar por el tipo de un valor. Con un texto responde string, con veinticinco responde number y con true responde boolean.',
    },
    { at: 77200, type: 'write', filePath: 'app.js', mode: 'replace', content: L03_TYPES },
    { at: 84000, type: 'run' },
    {
      at: 87310,
      type: 'speak',
      text: 'Las comillas cambian el significado. Veinticinco sin comillas es un número, pero entre comillas es texto. Aunque se vean parecidos, JavaScript los trata de forma diferente.',
    },
    { at: 96550, type: 'chapter', title: 'Tu turno' },
    {
      at: 96550,
      type: 'speak',
      text: 'Ahora crea tres variables desde cero. Guarda tu nombre como texto con const, tu edad como número con let y en listo un valor booleano. Después muestra las tres variables en la consola para comprobarlas.',
    },
    {
      at: 103200,
      type: 'challenge',
      challenge: {
        id: 'reto-tres-datos',
        title: 'Reto: tres datos',
        instructions: `Crea tres variables y comprueba sus valores en la consola.

1. Guarda tu nombre como texto en un dato que no necesite reasignarse.
2. Guarda tu edad como número en un dato que pueda cambiar más adelante.
3. Guarda en una variable llamada listo un booleano que represente si estás preparado.
4. Muestra los tres valores con console.log y pulsa Ejecutar.`,
        tests: [
          {
            id: 'const-nombre',
            description: 'El nombre se guarda como texto fijo',
            validatorType: 'source-regex',
            regexPattern: 'const\\s+nombre\\s*=\\s*["\'][^"\']+["\']',
            errorMessage: 'El nombre todavía no está guardado como un dato fijo de tipo texto.',
            hintTip: 'Elige la declaración que no permite reasignar y recuerda cómo se escribe un string.',
          },
          {
            id: 'let-edad',
            description: 'La edad se guarda como número reasignable',
            validatorType: 'source-regex',
            regexPattern: 'let\\s+edad\\s*=\\s*-?\\d+',
            errorMessage: 'La edad todavía no está guardada como un número que pueda reasignarse.',
            hintTip: 'Elige la declaración para valores que cambian y no conviertas el número en texto.',
          },
          {
            id: 'boolean-listo',
            description: 'listo se guarda como booleano',
            validatorType: 'source-regex',
            regexPattern: '(const|let)\\s+listo\\s*=\\s*(true|false)',
            errorMessage: 'listo todavía no contiene un valor booleano.',
            hintTip: 'Los dos valores booleanos se escriben sin comillas.',
          },
        ],
        hints: [
          { level: 1, title: 'Tres líneas', text: 'Una para el nombre, una para la edad, una para listo.' },
          { level: 2, title: 'Comillas', text: 'El nombre lleva comillas. El número y true/false no.' },
          {
            level: 3,
            title: 'Comprueba los valores',
            text: 'Usa las variables dentro de console.log. No vuelvas a escribir los datos como textos fijos.',
          },
        ],
        solutionExplanation: 'const para lo que no cambia. let para lo que sí. El tipo lo decide cómo escribes el valor.',
      },
    },
    { at: 110200, type: 'write', filePath: 'app.js', mode: 'replace', content: L03_SOLUTION },
    { at: 114200, type: 'run' },
    {
      at: 110790,
      type: 'speak',
      text: 'Si la consola muestra los tres valores, ya sabes nombrar información y elegir su tipo. En la próxima lección aprenderás a calcular y comparar usando esos datos.',
    },
  ],
});
