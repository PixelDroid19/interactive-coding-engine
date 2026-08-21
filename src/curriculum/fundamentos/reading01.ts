import { ReadingItem } from '../../types/curriculum';

export const READING_01: ReadingItem = {
  id: 'fundamentos-01-lectura',
  relatedLessonId: 'fundamentos-01',
  practiceItemId: 'fundamentos-01-debug',
  title: 'Lectura: tu primer programa',
  type: 'reading',
  estimatedMinutes: 4,
  description: 'Repaso corto antes del reto.',
  summary:
    'Antes de arreglar el programa, repasemos las tres ideas que usaste en la clase: qué es una instrucción, cómo se busca un recuadro y por qué el orden importa.',
  sections: [
    {
      title: 'Un programa lee de arriba abajo',
      content:
        'Un programa es una lista de instrucciones. JavaScript empieza en la primera línea, la ejecuta, baja a la segunda y sigue así. Cada línea puede cambiar algo en la página. Por eso, si dos líneas hacen cosas distintas, el resultado depende del orden.',
      example:
        'document.getElementById("linea1").textContent = "Hola";\ndocument.getElementById("linea2").textContent = "Adiós";',
      exampleCaption:
        'Primero escribe "Hola" arriba. Después escribe "Adiós" abajo. Una línea, una acción.',
    },
    {
      title: 'El HTML tiene recuadros con nombre',
      content:
        'En la página hay etiquetas como <p>. Algunas tienen id="linea1" o id="linea2". Ese id es su nombre único. Cuando JavaScript busca ese nombre, encuentra exactamente ese recuadro. No hace falta poner # dentro de JavaScript: el id se escribe tal cual, entre comillas.',
      example:
        '<p id="linea1"></p>\n<p id="linea2"></p>',
      exampleCaption: 'Dos recuadros distintos, con dos ids distintos.',
    },
    {
      title: 'El patrón busca-y-escribe',
      content:
        'document.getElementById("...") busca un recuadro por su id. .textContent = "..." escribe texto dentro. Juntando ambas partes tienes una instrucción completa. Si quieres escribir en otro recuadro, necesitas otra instrucción con otro id.',
      example:
        'document.getElementById("linea1").textContent = "Primer texto";\ndocument.getElementById("linea2").textContent = "Segundo texto";',
      exampleCaption: 'Una instrucción por recuadro. El id decide a cuál escribe cada línea.',
    },
    {
      title: 'Si repites el mismo recuadro, la última gana',
      content:
        'Escribir dos veces sobre el mismo id no suma textos: reemplaza lo anterior. La primera línea se ejecuta, pero después llega la segunda y la pisa. Por eso un programa que debe llenar dos espacios necesita apuntar a los dos espacios.',
      exampleCaption:
        'Piénsalo como pasos: si el paso 2 borra al paso 1, solo queda lo que hizo el paso 2.',
    },
  ],
  keyPoints: [
    'JavaScript ejecuta las instrucciones en orden, de arriba abajo',
    'Cada recuadro del HTML tiene un id que actúa como su nombre',
    'document.getElementById("id") busca ese recuadro',
    '.textContent = "texto" escribe dentro del recuadro',
    'Para llenar dos recuadros distintos necesitas dos instrucciones con ids distintos',
    'Si dos instrucciones escriben en el mismo recuadro, la última reemplaza a la primera',
  ],
};
