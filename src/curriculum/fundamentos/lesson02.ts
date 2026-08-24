import { compileLesson } from '../../engine/lessonCompiler';
import { LESSON2_JS_SOLUTION, LESSON2_JS_START, lesson2Workspace } from './workspaces';

const AUDIO_MS = 96_200;

export const LESSON_02 = compileLesson({
  id: 'fundamentos-02',
  title: '2. Pensar en pasos',
  description: 'Aprende a dividir una tarea cotidiana en instrucciones pequeñas y a colocarlas en el orden correcto.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-02.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson2Workspace,
  executionMode: 'logic',
  concepts: ['Dividir una tarea', 'Orden de ejecución', 'Comentarios'],
  skillsRequired: ['instructions', 'strings', 'function-call-syntax', 'console-output'],
  skillsIntroduced: ['decomposition', 'comments'],
  learningObjectives: [
    'Separar una tarea cotidiana en instrucciones pequeñas y observables.',
    'Ordenar varias instrucciones y comprobar su ejecución en la consola.',
    'Distinguir un comentario de una instrucción ejecutable.',
  ],
  commonMistakes: [
    'Escribir una instrucción demasiado grande que contiene varias acciones ambiguas.',
    'Colocar pasos correctos en un orden que produce un resultado incorrecto.',
    'Esperar que una línea comentada se ejecute.',
  ],
  teachNotes: [
    {
      title: 'Una acción por paso',
      body: '“Preparar té” es una meta. “Calentar el agua” es una instrucción concreta que puede ocupar un lugar en la secuencia.',
    },
    {
      title: 'El orden cambia el resultado',
      body: 'Las mismas acciones pueden fallar si se ejecutan en otro orden. JavaScript sigue el archivo de arriba abajo.',
    },
    {
      title: 'Los comentarios explican',
      body: 'Una línea que empieza por // sirve como nota para quien lee el código. JavaScript no la ejecuta.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Una meta no es un paso' },
    {
      at: 500,
      type: 'speak',
      text: 'En la primera lección escribiste instrucciones y viste que el orden importa. Ahora vamos a detenernos un momento antes del código para decidir qué pasos necesita realmente un programa.',
    },
    { at: 12_000, type: 'switch', filePath: 'app.js' },
    {
      at: 12_400,
      type: 'speak',
      text: 'Imagina que la meta es preparar una taza de té. Esa frase dice qué queremos lograr, pero no explica cómo. Para convertirla en un plan, necesitamos acciones pequeñas y ordenadas.',
    },
    {
      at: 25_000,
      type: 'write',
      filePath: 'app.js',
      mode: 'replace',
      content: `// Plan: preparar una taza de té.\n\nconsole.log("Calentar el agua");\n`,
    },
    {
      at: 25_400,
      type: 'speak',
      text: 'La primera línea resume el plan y comienza con dos barras, así que es un comentario. JavaScript la ignora. La línea siguiente sí es una instrucción que puede ejecutar.',
    },
    { at: 39_000, type: 'run' },
    {
      at: 39_400,
      type: 'speak',
      text: 'Cuando ejecutamos, la consola muestra solamente la acción de calentar el agua. El comentario nos ayuda a entender la intención, pero no produce ningún resultado.',
    },
    { at: 51_000, type: 'chapter', title: 'El orden importa' },
    {
      at: 51_300,
      type: 'write',
      filePath: 'app.js',
      mode: 'replace',
      content: `// Este orden todavía tiene un problema.\n\nconsole.log("Servir el agua");\nconsole.log("Poner el té en la taza");\n`,
    },
    {
      at: 51_700,
      type: 'speak',
      text: 'Estas dos instrucciones están bien escritas, pero aparecen en el orden equivocado. Este es un detalle importante: un programa puede ejecutarse sin errores y aun así resolver mal el problema.',
    },
    { at: 64_000, type: 'write', filePath: 'app.js', mode: 'replace', content: LESSON2_JS_START },
    {
      at: 64_400,
      type: 'speak',
      text: 'Ahora completa el plan. Escribe una instrucción para calentar el agua, otra para poner el té en la taza y una última para servir el agua. Revisa el orden antes de ejecutar.',
    },
    {
      at: 69_000,
      type: 'challenge',
      challenge: {
        id: 'reto-pasos-en-orden',
        title: 'Reto: tres pasos en orden',
        instructions: `Escribe tres instrucciones con console.log en app.js.

1. Primero muestra "Calentar el agua".
2. Después muestra "Poner el té en la taza".
3. Al final muestra "Servir el agua".
4. Ejecuta y comprueba el orden en la consola.`,
        tests: [
          {
            id: 'pasos-ordenados',
            description: 'Las tres instrucciones aparecen en el orden correcto',
            validatorType: 'source-regex',
            regexPattern: 'console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Calentar el agua["\\\']\\s*\\)\\s*;?[\\s\\S]*console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Poner el té en la taza["\\\']\\s*\\)\\s*;?[\\s\\S]*console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Servir el agua["\\\']\\s*\\)\\s*;?',
            errorMessage: 'Falta un paso, una instrucción está incompleta o el orden no coincide con el plan.',
            hintTip: 'Lee las tres llamadas de arriba abajo y compáralas con la secuencia pedida.',
          },
        ],
        hints: [
          { level: 1, title: 'Una acción por línea', text: 'Necesitas tres instrucciones completas, no una sola frase con todo el plan.' },
          { level: 2, title: 'Repite la forma conocida', text: 'Las tres líneas usan la misma forma de console.log que practicaste en la lección anterior.' },
          { level: 3, title: 'Comprueba la secuencia', text: 'La línea de calentar debe quedar arriba, la de colocar el té en el centro y la de servir abajo.' },
        ],
        solutionExplanation: 'Dividir la meta produjo tres acciones concretas. Colocarlas de arriba abajo definió el orden de ejecución.',
      },
    },
    { at: 80_000, type: 'write', filePath: 'app.js', mode: 'replace', content: LESSON2_JS_SOLUTION },
    { at: 81_000, type: 'run' },
    {
      at: 82_000,
      type: 'speak',
      text: 'La consola muestra los tres pasos en la secuencia correcta. Eso es pensar como programador: tomar una meta grande y convertirla en acciones pequeñas que podamos comprobar una por una.',
    },
    {
      at: 93_000,
      type: 'speak',
      text: 'En la siguiente lección aprenderás a guardar información con nombres claros para poder usarla y cambiarla más adelante.',
    },
  ],
});
