import { compileLesson } from '../../engine/lessonCompiler';
import { L09_OBJ, L09_SOLUTION, lesson09Workspace } from './preDomWorkspaces';

const AUDIO_MS = 104_840;

export const LESSON_09 = compileLesson({
  id: 'fundamentos-09',
  title: '9. Objetos',
  description: 'Agrupa datos por nombre: ficha, punto, y una función que los usa.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-09.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson09Workspace,
  executionMode: 'logic',
  concepts: ['Objeto { }', 'item.nombre'],
  skillsRequired: ['variables', 'functions', 'arrays'],
  skillsIntroduced: ['objects'],
  learningObjectives: [
    'Agrupar datos relacionados en un objeto con claves claras.',
    'Leer propiedades con notación de punto.',
  ],
  commonMistakes: [
    'Intentar leer un objeto por posición como si fuera un array.',
    'Confundir el nombre de una variable con el nombre de una propiedad.',
  ],
  teachNotes: [
    {
      title: 'Nombre, no posición',
      body: 'persona.nombre entra al campo. El punto es el camino. Un array era la fila. El objeto es la ficha.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Fichas' },
    {
      at: 200,
      type: 'speak',
      text: 'Los arrays organizan valores por posición. Los objetos sirven para representar algo mediante características con nombre, como una persona, un producto o una tarea.',
    },
    {
      at: 8100,
      type: 'speak',
      text: 'Para describir a una persona resulta más claro hablar de su nombre, su edad y si está activa que recordar qué significa cada posición de una lista. Un objeto agrupa esas características.',
    },
    {
      at: 18120,
      type: 'speak',
      text: 'Aquí creamos el objeto persona. Las llaves contienen sus propiedades y cada propiedad relaciona un nombre con un valor. Las comas separan una propiedad de la siguiente.',
    },
    { at: 19000, type: 'write', filePath: 'app.js', mode: 'replace', content: L09_OBJ },
    { at: 25000, type: 'run' },
    {
      at: 27720,
      type: 'speak',
      text: 'Para leer una propiedad escribimos persona punto nombre. El punto nos permite acceder a una característica por su nombre, en lugar de buscarla con un índice como haríamos en un array.',
    },
    {
      at: 29000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 54, y: 44, targetArea: 'preview' },
        { x: 32, y: 36, targetArea: 'editor' },
      ],
    },
    {
      at: 38040,
      type: 'speak',
      text: 'También podemos entregar el objeto completo a una función. Dentro, la función puede consultar únicamente las propiedades que necesita para realizar su trabajo.',
    },
    {
      at: 45960,
      type: 'speak',
      text: 'Los arrays y los objetos suelen trabajar juntos. Podemos tener un array de personas donde cada elemento es un objeto con sus propios datos. Así representamos colecciones de elementos más completos.',
    },
    { at: 57220, type: 'chapter', title: 'Tu turno' },
    {
      at: 57220,
      type: 'speak',
      text: 'Ahora crea un objeto producto con las propiedades nombre y precio. Después escribe una función que reciba cualquier producto y devuelva un texto formado con esos dos valores.',
    },
    {
      at: 62000,
      type: 'challenge',
      challenge: {
        id: 'reto-producto',
        title: 'Reto: producto y etiqueta',
        instructions: `Crea un objeto producto y elige los valores que quieras para nombre y precio.

Después escribe etiqueta(item): debe leer esos dos campos y devolver un texto con el formato “Nombre — precio”. Debe funcionar con cualquier producto.

Puedes usar console.log(etiqueta(producto)) para observar tu ejemplo, pero no es obligatorio. Las pruebas llamarán directamente a tu función con otros productos.`,
        tests: [
          {
            id: 'etiqueta-te',
            description: 'Usa el nombre y el precio del producto recibido',
            validatorType: 'function-call',
            targetFunction: 'etiqueta',
            args: [{ nombre: 'Té', precio: 4 }],
            expectedReturn: 'Té — 4',
            errorMessage: 'La etiqueta no usa correctamente el nombre y el precio recibidos.',
            hintTip: 'Lee los dos campos por su nombre y júntalos con la raya del formato pedido.',
          },
          {
            id: 'etiqueta-cafe',
            description: 'También funciona con un producto distinto',
            validatorType: 'function-call',
            targetFunction: 'etiqueta',
            args: [{ nombre: 'Café', precio: 12 }],
            expectedReturn: 'Café — 12',
            errorMessage: 'La función parece depender de los valores de tu ejemplo.',
            hintTip: 'Lee item.nombre y item.precio con punto.',
          },
        ],
        hints: [
          { level: 1, title: 'Llaves', text: 'El objeto va entre { }.' },
          { level: 2, title: 'Punto', text: 'item.nombre entra al campo.' },
          { level: 3, title: 'Observa si lo necesitas', text: 'console.log(etiqueta(producto)) es opcional: sirve para ver tu ejemplo. Las pruebas llaman a etiqueta con otros productos para comprobar que no dependa de valores fijos.' },
        ],
        solutionExplanation: 'El objeto agrupa. La función lee los campos y arma un texto.',
      },
    },
    { at: 65500, type: 'write', filePath: 'app.js', mode: 'replace', content: L09_SOLUTION },
    { at: 67800, type: 'run' },
  ],
});
