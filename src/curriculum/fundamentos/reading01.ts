import { ReadingItem } from '../../types/curriculum';

export const READING_01: ReadingItem = {
  id: 'fundamentos-01-lectura',
  relatedLessonId: 'fundamentos-01',
  practiceItemId: 'fundamentos-01-debug',
  title: 'Lectura: tu primer programa',
  type: 'reading',
  estimatedMinutes: 4,
  description: 'Repasa la forma de una instrucción antes de corregir un programa pequeño.',
  summary: 'Antes de practicar, repasemos qué ejecuta JavaScript, cómo se reconoce un texto y por qué cada signo de console.log importa.',
  sections: [
    {
      title: 'Una instrucción completa',
      content: 'JavaScript ejecuta instrucciones de arriba abajo. console.log muestra un dato en la consola. Los paréntesis contienen el dato y el punto y coma marca el final.',
      example: 'console.log("Hola");',
      exampleCaption: 'Una instrucción, un mensaje de salida.',
    },
    {
      title: 'Las comillas delimitan texto',
      content: 'Un texto comienza con una comilla y termina con otra. Sin comillas, JavaScript interpreta la palabra como un nombre de variable, un concepto que aprenderás después.',
      example: 'console.log("Estoy aprendiendo");',
      exampleCaption: 'El texto es únicamente lo que queda dentro de las dos comillas.',
    },
    {
      title: 'Error común: dejar un signo abierto',
      content: 'Cada paréntesis que abre necesita uno que cierre. Cada texto necesita dos comillas. Cuando falta una parte, JavaScript no puede entender dónde termina la instrucción.',
      example: 'console.log("Correcto");\nconsole.log("También correcto");',
      exampleCaption: 'Revisa una línea a la vez y cuenta los pares.',
    },
    {
      title: 'El orden cambia la salida',
      content: 'La primera llamada produce el primer mensaje. La segunda produce el siguiente. Intercambiar las líneas intercambia el orden que ves en la consola.',
      example: 'console.log("Primero");\nconsole.log("Después");',
      exampleCaption: 'JavaScript sigue el archivo de arriba abajo.',
    },
  ],
  keyPoints: [
    'Un programa ejecuta instrucciones en orden',
    'console.log muestra un dato en la consola',
    'Los paréntesis contienen el dato entregado',
    'Las comillas delimitan el texto',
    'Cada signo que abre necesita su cierre',
    'Dos instrucciones producen dos salidas en el mismo orden',
  ],
};
