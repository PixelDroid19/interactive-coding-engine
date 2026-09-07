import type { ReadingItem } from '../../types/curriculum';

export const ACCOUNT_FEATURE_READING: ReadingItem = {
  id: 'open-cells-feature-account',
  type: 'reading',
  title: 'Feature propia: detalle de cuenta y movimientos',
  summary: 'Une componentes y vistas en un proyecto Cells que puedas ejecutar, modificar y exportar. El host coordina; las vistas presentan datos y comunican intenciones.',
  estimatedMinutes: 45,
  handsOnLab: 'open-cells-feature-playground',
  sections: [
    {
      title: 'Qué vas a construir',
      content: 'Una persona abre el resumen de su cuenta, consulta los movimientos, busca un concepto y vuelve al resumen. Hay dos vistas y un único propietario de la navegación interna: academy-account-detail. Los nombres, importes y movimientos son ficticios. No hay conexión con una cuenta real ni una petición escondida detrás del botón.',
      example: 'Resumen → Ver movimientos → Buscar «tren» → Un resultado → Volver al resumen\nSin coincidencias → Mensaje visible → Limpiar búsqueda → Colección completa',
      exampleCaption: 'La prueba de aceptación es un recorrido que una persona puede realizar.',
    },
    {
      title: 'Recorrido de archivos',
      content: 'Empieza por src/academy-account-detail.js. Sus imports conducen al botón compartido de src/components/ y a las dos vistas de src/pages/. Después abre src/config/demo-data.js: esos datos pertenecen a la demostración, no a un servicio bancario. demo/demo.js consume la entrada pública, carga locales y configura la instancia. Los SCSS y sus css.js quedan junto a cada componente; test/unit/ comprueba el recorrido desde fuera.',
    },
    {
      title: 'Leer la composición como un contrato Cells',
      content: 'La clase compone WidgetMixin(ScopedElementsMixin(LitElement)). Lit actualiza el DOM; ScopedElementsMixin resuelve las etiquetas dentro del host; WidgetMixin aporta traducción y eventos. static get properties() describe las entradas. scopedElementsFromClasses convierte las clases importadas en un registro usando su static get is(). configurationScopedElements permite añadir clases de una configuración; en este entorno educativo su lista base está vacía. No registra componentes privados de manera implícita.',
      example: 'Clase importada → is público → registro local → etiqueta en el template\nDato recibido → propiedad → render\nInteracción → emitEvent → consumidor',
      exampleCaption: 'Si falla una flecha, localiza esa frontera antes de cambiar el resto del proyecto.',
    },
    {
      title: 'La vista propone; el host decide',
      content: 'El botón emite academy-action-button-activate. El host escucha esa intención, cambia de vista y comunica academy-account-detail-navigate con accountName y view. La lista hace lo mismo con la búsqueda: recibe movements y query, y emite academy-movement-list-filter. No importa al host ni modifica la colección original. Así puedes cambiar la presentación de la lista sin reescribir la navegación.',
    },
    {
      title: 'Cuándo hace falta un data manager',
      content: 'Este proyecto no lo necesita: recibe los datos por propiedades. Si después conectas un origen remoto, el data manager será dueño de la petición, la cancelación y la transformación de la respuesta. El host entregará sus resultados a las vistas. Reintentar comunica una intención al consumidor; no cambia error por success sin haber recibido una respuesta. Añadir un manager vacío a cada componente solo introduciría una dependencia sin responsabilidad.',
    },
    {
      title: 'Variantes, estilos y traducciones propias',
      content: 'El botón es el mismo componente que construiste antes, no una aproximación que solo se parece por fuera. Los textos de las vistas pasan por this.t y la demo reúne los catálogos de todas sus dependencias. Los estilos locales se combinan con getComponentSharedStyles. En este runtime los estilos compartidos se registran antes de importar el componente; los cambios de apariencia posteriores pueden usar propiedades CSS. Ningún archivo depende de componentes o recursos privados.',
    },
    {
      title: 'Antes de editar',
      content: 'El ejercicio deja dos conexiones abiertas en el host: el botón está importado pero no registrado, y el cambio de vista aún no publica su evento. Mira custom-elements.json para conocer el nombre y el detalle del evento. Predice qué se verá en la demo y qué recibirá el consumidor; después repara una conexión cada vez. No necesitas tocar las vistas, los datos ni escribir un data manager.',
    },
    {
      title: 'Comprobar algo más que la pantalla inicial',
      content: 'Ejecuta las pruebas y recorre el proyecto: abre movimientos, busca « TREN » con espacios y mayúsculas, escribe una consulta sin coincidencias y limpia el filtro. Deben volver los tres movimientos. Comprueba la vuelta al resumen, los casos loading, empty y error de la demo, y el cambio a inglés sin recrear el host. Exporta el ZIP y lee test/unit/: el consumidor pulsa el botón y observa el evento; no compara tu solución con una línea obligatoria.',
    },
  ],
  keyPoints: [
    'Una feature compone vistas y componentes; no concentra todas sus responsabilidades en render.',
    'Las dependencias scoped son clases completas con contratos públicos.',
    'El data manager es opcional y aparece cuando existe una integración que gestionar.',
    'Loading, empty, error y success son estados distintos, no adornos de la demo.',
  ],
  frequentQuestions: [
    { question: '¿Puedo escribir el registro de otra manera?', answer: 'Sí. Puedes asociar las etiquetas a sus clases explícitamente o usar la composición por clases. Lo importante es que las dependencias se resuelvan localmente y que el recorrido y los eventos funcionen.' },
    { question: '¿Esto incorpora componentes originales de una entidad?', answer: 'No. Son implementaciones educativas propias, con nombres, datos y estilos neutrales. Se practican contratos de composición, traducción y eventos sobre Lit 3 y el entorno educativo.' },
    { question: '¿Ya es una aplicación Cells completa?', answer: 'Es una feature con vistas internas. La aplicación que la aloje seguirá siendo dueña de sus rutas, canales, sesión e integración de datos. Separar ambas cosas permite reutilizar la feature.' },
  ],
  transferPrompt: 'Añade una vista de información de la cuenta: decide qué datos recibe, qué intención devuelve para cerrar y cómo demostrarás que no necesita importar al host ni a un servicio de datos.',
};
