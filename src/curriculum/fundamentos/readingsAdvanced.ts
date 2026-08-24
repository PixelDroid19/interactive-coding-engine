import { ReadingItem, ReadingSection } from '../../types/curriculum';
import { PEDAGOGICAL_PROFILE_BY_LESSON } from './pedagogicalProfiles';

interface Draft {
  number: number;
  title: string;
  summary: string;
  definition: string;
  example: string;
  trace: string;
  errors: string;
  keyPoints: string[];
  optionalSections?: ReadingSection[];
}

function advancedReading(draft: Draft): ReadingItem {
  const lessonId = `fundamentos-${String(draft.number).padStart(2, '0')}`;
  const profile = PEDAGOGICAL_PROFILE_BY_LESSON[lessonId];
  return {
    id: `${lessonId}-lectura`,
    relatedLessonId: lessonId,
    practiceItemId: `${lessonId}-debug`,
    title: `Lectura: ${draft.title}`,
    type: 'reading',
    estimatedMinutes: 8,
    description: 'Segundo ejemplo, seguimiento, dudas frecuentes y transferencia antes de practicar.',
    summary: draft.summary,
    sections: [
      { title: 'Definición en lenguaje cotidiano', content: draft.definition },
      { title: 'Segundo ejemplo trabajado', content: draft.trace, example: draft.example, exampleCaption: 'Predice primero; después sigue cada cambio y ejecuta.' },
      { title: 'Errores comunes y cómo investigarlos', content: draft.errors },
      { title: 'Preguntas que conviene responder', content: profile.frequentQuestions.map((entry) => `${entry.question} ${entry.answer}`).join('\n\n') },
      ...(draft.optionalSections ?? []),
    ],
    keyPoints: draft.keyPoints,
    frequentQuestions: profile.frequentQuestions,
    transferPrompt: profile.transferPrompt,
  };
}

export const ADVANCED_READINGS: ReadingItem[] = [
  advancedReading({ number: 15, title: 'depurar con evidencia', summary: 'Una corrección confiable nace de una observación que permite descartar explicaciones.', definition: 'Reproducir fija el fallo; aislar encuentra la primera diferencia; la hipótesis predice qué observarás; verificar comprueba el caso original y uno distinto.', example: 'function convertir(minutos) {\n  return minutos * 60;\n}\nconsole.log(convertir(2)); // 120', trace: 'Si observas 62, inspecciona primero los argumentos y la operación. Cambiar el texto de la interfaz no puede explicar ese valor.', errors: 'Cambiar varias piezas elimina la posibilidad de saber cuál era la causa. Un arreglo que pasa un solo ejemplo todavía puede estar fijado a ese dato.', keyPoints: ['Reproduce antes de editar', 'Predice una observación', 'Cambia una causa', 'Comprueba regresiones'] }),
  advancedReading({ number: 16, title: 'leer métodos como contratos', summary: 'La firma de una operación responde qué recibe, qué devuelve y qué efecto produce.', definition: 'Una propiedad se consulta; un método se llama; una función independiente no necesita un receptor. Strings son inmutables y push sí modifica un array.', example: 'const texto = " aula ";\nconst limpio = texto.trim();\nconst existe = limpio.includes("ul");', trace: 'trim devuelve “aula”. includes recibe el fragmento y devuelve true. texto conserva sus espacios.', errors: 'length no lleva paréntesis. push devuelve la nueva longitud, no el array. Consulta el retorno antes de encadenar métodos.', keyPoints: ['Identifica receptor', 'Lee parámetros y retorno', 'Pregunta por mutación', 'Prueba un ejemplo mínimo'] }),
  advancedReading({ number: 17, title: 'pseudocódigo y diagramas', summary: 'Representar primero permite discutir lógica sin que la puntuación del lenguaje esconda el problema.', definition: 'Rectángulo significa proceso; rombo significa decisión; las flechas muestran el orden. El pseudocódigo usa verbos y condiciones claras.', example: 'LEER saldo\nSI saldo < 0\n  MOSTRAR "Revisar"\nSI NO\n  MOSTRAR "Disponible"', trace: 'Prueba saldo menos uno y saldo cero. Cada uno debe recorrer un camino distinto y terminar en una salida.', errors: 'Un diagrama decorativo no sirve si faltan etiquetas sí/no o existe un camino que nunca llega al final.', keyPoints: ['Empieza por entrada y salida', 'Etiqueta decisiones', 'Traza cada camino', 'Luego traduce a sintaxis'] }),
  advancedReading({ number: 18, title: 'patrones de recorrido', summary: 'Contar, sumar y elegir un máximo comparten un bucle y difieren en el estado que conservan.', definition: 'El acumulador resume lo anterior. Para suma empieza en cero; para conteo también; para máximo necesita un candidato válido o tratar la lista vacía.', example: 'function contarPositivos(lista) {\n  let cantidad = 0;\n  for (let i = 0; i < lista.length; i++) {\n    if (lista[i] > 0) cantidad++;\n  }\n  return cantidad;\n}', trace: 'Con menos uno, cuatro y dos: cantidad vale cero, luego uno y luego dos.', errors: 'Reiniciar el estado dentro de la vuelta borra la historia. Usar i en vez de lista[i] compara la posición, no el dato.', keyPoints: ['Define el estado parcial', 'Elige su valor inicial', 'Actualiza una vez por elemento', 'Prueba lista vacía'] }),
  advancedReading({ number: 19, title: 'buscar, filtrar y transformar', summary: 'La forma del resultado indica qué operación necesitas.', definition: 'includes responde booleano; find busca un elemento; filter produce una selección; map transforma cada elemento. Un for puede expresar cualquiera de forma explícita.', example: 'function esLargo(nombre) { return nombre.length > 4; }\nconst largos = ["Ana", "Lucía"].filter(esLargo);', trace: 'La función callback recibe Ana y devuelve false; recibe Lucía y devuelve true. El resultado conserva solo Lucía.', errors: 'Una callback se entrega sin llamarla. map no elimina elementos y filter no transforma los valores que conserva.', keyPoints: ['Decide la forma del resultado', 'Comprende la callback', 'No confundas map y filter', 'Un for explícito sigue siendo válido'] }),
  advancedReading({ number: 20, title: 'casos límite y pruebas', summary: 'Los buenos casos se eligen para revelar fallos, no para celebrar que el ejemplo favorito funciona.', definition: 'Una partición agrupa entradas con la misma regla. Los límites están donde cambia el resultado; prueba justo antes, exactamente allí y justo después.', example: 'function aprueba(nota) { return nota >= 60; }\n// casos: 59, 60, 61', trace: 'Si 60 falla, el operador excluye la igualdad. 59 comprueba el lado rechazado y 61 el interior aceptado.', errors: 'Copiar el caso del ejemplo no añade evidencia. Una prueba con resultado incorrecto puede esconder el bug en vez de detectarlo.', keyPoints: ['Prueba normal y límites', 'Incluye inválidos', 'Nombra la intención', 'Repite después de corregir'] }),
  advancedReading({
    number: 21,
    title: 'estado y flujo de datos',
    summary: 'Una fuente de verdad evita que la interfaz y los datos cuenten historias diferentes.',
    definition: 'Evento describe una acción; transición calcula el estado siguiente; render convierte ese estado en vista. La vista no debe inventar datos paralelos.',
    example: 'let estado = 0;\nfunction incrementar(actual) { return actual + 1; }\nestado = incrementar(estado);\nrender(estado);',
    trace: 'Antes del clic estado es cero. La regla devuelve uno, se guarda uno y render recibe uno.',
    errors: 'Leer el texto del DOM como estado crea otra fuente de verdad. Render no debería decidir reglas de negocio.',
    keyPoints: ['Nombra el estado', 'Centraliza transiciones', 'Render recibe datos', 'Dibuja la dirección del flujo'],
    optionalSections: [
      {
        title: 'Para curiosos: cuánto tiempo vive un dato',
        content: 'Una variable local deja de estar disponible cuando termina su función. Un valor puede seguir vivo si el programa todavía puede alcanzarlo desde otra variable, un objeto o una tarea pendiente. Cuando ya no existe una forma de alcanzarlo, el recolector de basura puede recuperar esa memoria automáticamente; JavaScript no permite decidir el instante exacto.',
        example: 'function calcular() {\n  const temporal = 2 * 3;\n  return temporal;\n}\n\nconst total = calcular();',
        exampleCaption: 'Al terminar calcular ya no puedes usar el nombre temporal. El resultado sigue disponible mediante total.',
        kind: 'curiosity',
      },
      {
        title: 'Para curiosos: pila, heap y direcciones físicas',
        content: 'Pila o stack y heap son palabras útiles para construir un modelo simplificado de cómo un motor puede organizar llamadas y datos. No son una promesa exacta del lenguaje JavaScript: cada motor puede optimizar y representar los valores de manera diferente. La especificación tampoco garantiza una dirección física observable, y el código normal no manipula direcciones de memoria directamente.',
        kind: 'curiosity',
      },
    ],
  }),
  advancedReading({ number: 22, title: 'responsabilidades y módulos', summary: 'Separar funciona cuando cada parte conoce menos y ofrece una frontera clara.', definition: 'Un módulo cohesivo reúne capacidades relacionadas. export define su interfaz pública; import expresa una dependencia.', example: '// reglas.js\nexport function total(precio, cantidad) { return precio * cantidad; }\n// interfaz.js\nimport { total } from "./reglas.js";', trace: 'interfaz conoce total; reglas no conoce interfaz ni document. La dependencia tiene una sola dirección.', errors: 'Mover código a archivos distintos no ayuda si todos importan a todos. Evita círculos y exportaciones que nadie necesita.', keyPoints: ['Agrupa por responsabilidad', 'Expón una puerta pequeña', 'Dirige dependencias', 'Prueba reglas sin DOM'] }),
  advancedReading({ number: 23, title: 'arquitectura elemental', summary: 'La arquitectura de una app pequeña responde dónde vive cada decisión y hacia dónde fluyen los datos.', definition: 'Datos conservan estado; reglas calculan; coordinación conecta eventos; interfaz representa. No necesitas nombres de patrones para evaluar esas fronteras.', example: 'evento → coordinación → regla → estado nuevo\n                     ↓\n                  render → DOM', trace: 'Para agregar una tarea, coordinación lee la entrada, la regla valida, estado cambia y render reconstruye la lista.', errors: 'Una carpeta llamada arquitectura no crea límites. Señala cada flecha y pregunta si la parte de destino necesita conocer a la de origen.', keyPoints: ['Asigna responsabilidades', 'Explica cada dependencia', 'Aísla reglas', 'Acepta arquitectura proporcional'] }),
  advancedReading({ number: 24, title: 'construir por cortes verticales', summary: 'El proyecto final integra lo conocido sin introducir sintaxis sorpresa.', definition: 'Un corte vertical completa una historia pequeña desde el requisito hasta una prueba observable. Después se añade prioridad y luego filtro.', example: 'Historia: agregar una tarea válida.\nDato: { texto, prioridad }.\nRegla: texto no vacío.\nPrueba: espacios se rechazan.\nVista: aparece una fila.', trace: 'Primero valida la regla pura. Luego conecta un clic. Finalmente comprueba que estado y lista visible contienen la misma tarea.', errors: 'Construir todos los archivos a la vez retrasa la evidencia. Evita estilos avanzados y capacidades no enseñadas hasta que el flujo principal funcione.', keyPoints: ['Define fuera de alcance', 'Modela los datos', 'Prueba reglas primero', 'Integra una historia completa'] }),
];
