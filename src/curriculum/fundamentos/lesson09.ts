import { compileLesson } from '../../engine/lessonCompiler';
import { L09_OBJ, L09_SOLUTION, lesson09Workspace } from './pages';

const AUDIO_MS = 68_960;

export const LESSON_09 = compileLesson({
  id: 'fundamentos-09',
  title: '9. Objetos',
  description: 'Agrupa datos por nombre: ficha, punto, y una función que los usa.',
  audioUrl: '/audio/fundamentos-09.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson09Workspace,
  concepts: ['Objeto { }', 'item.nombre'],
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
      text: 'Un array es una fila. Un objeto es una ficha. Cada dato tiene nombre, no número.',
    },
    {
      at: 8100,
      type: 'speak',
      text: 'Una persona no es posición cero, posición uno. Es nombre, edad, si está activa. Eso se agrupa en un objeto.',
    },
    {
      at: 18120,
      type: 'speak',
      text: 'const persona igual, llaves. nombre Ana, edad 25, activo true.',
    },
    { at: 19000, type: 'write', filePath: 'app.js', mode: 'replace', content: L09_OBJ },
    { at: 25000, type: 'run' },
    {
      at: 27720,
      type: 'speak',
      text: 'persona punto nombre es Ana. El punto entra a un campo. También puedes usar corchetes si el nombre del campo está en una variable.',
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
      text: 'Puedes meter funciones adentro. Entonces se llaman métodos. Hacen algo con los datos de esa ficha.',
    },
    {
      at: 45960,
      type: 'speak',
      text: 'Los objetos se combinan con arrays. Una lista de personas. Cada elemento es una ficha. Así se construyen apps de verdad: listas de cosas con nombre.',
    },
    { at: 57220, type: 'chapter', title: 'Tu turno' },
    {
      at: 57220,
      type: 'speak',
      text: 'Tu turno. Crea un objeto producto con nombre y precio. Y una función que reciba ese producto y devuelva un texto: el nombre, una raya, y el precio.',
    },
    {
      at: 62000,
      type: 'challenge',
      challenge: {
        id: 'reto-producto',
        title: 'Reto: producto y etiqueta',
        instructions: `Crea un producto con nombre y precio.

Después escribe etiqueta(item): debe leer esos dos campos y devolver un texto con el formato “Nombre — precio”. Debe funcionar con cualquier producto.`,
        tests: [
          {
            id: 'etiqueta-te',
            description: 'etiqueta({nombre:"Té",precio:4}) es "Té — 4"',
            validatorType: 'function-call',
            targetFunction: 'etiqueta',
            args: [{ nombre: 'Té', precio: 4 }],
            expectedReturn: 'Té — 4',
            errorMessage: 'Con {nombre:"Té",precio:4} debe devolver "Té — 4".',
            hintTip: 'Lee los dos campos por su nombre y júntalos con la raya del formato pedido.',
          },
          {
            id: 'etiqueta-cafe',
            description: 'etiqueta({nombre:"Café",precio:12}) es "Café — 12"',
            validatorType: 'function-call',
            targetFunction: 'etiqueta',
            args: [{ nombre: 'Café', precio: 12 }],
            expectedReturn: 'Café — 12',
            errorMessage: 'Prueba con otro producto, debe usar los campos.',
            hintTip: 'Lee item.nombre y item.precio con punto.',
          },
        ],
        hints: [
          { level: 1, title: 'Llaves', text: 'El objeto va entre { }.' },
          { level: 2, title: 'Punto', text: 'item.nombre entra al campo.' },
          { level: 3, title: 'Raya', text: 'Junta con + " — " +' },
        ],
        solutionExplanation: 'El objeto agrupa. La función lee los campos y arma un texto.',
      },
    },
    { at: 65500, type: 'write', filePath: 'app.js', mode: 'replace', content: L09_SOLUTION },
    { at: 67800, type: 'run' },
  ],
});
