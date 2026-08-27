import type { ReadingItem, ReasoningActivity, ReasoningExerciseItem } from '../../types/curriculum';

function sequence(number: number, title: string, prompt: string, labels: string[], explanation: string): ReasoningExerciseItem {
  const ids = labels.map((_, index) => `step-${number}-${index + 1}`);
  return {
    id: `open-cells-${String(number).padStart(2, '0')}-razona`,
    type: 'reasoning',
    relatedLessonId: `open-cells-${String(number).padStart(2, '0')}-lectura`,
    title,
    description: prompt,
    estimatedMinutes: 8,
    activity: {
      kind: 'sequence', prompt,
      steps: labels.map((label, index) => ({ id: ids[index], label })),
      expectedOrder: ids,
    },
    hints: [
      { level: 1, text: 'Empieza por la causa que existe antes de que la interfaz produzca una salida.' },
      { level: 2, text: 'Busca qué paso entrega información al siguiente; evita ordenar por el lugar donde aparece en el archivo.' },
      { level: 3, text: 'Une cada salida con la entrada que necesita el paso siguiente y deja la comprobación observable al final.' },
    ],
    explanation,
  };
}

function decisions(
  number: number,
  title: string,
  prompt: string,
  cases: Array<[string, string, string[]]>,
  outcomes: Record<string, string>,
  explanation: string,
): ReasoningExerciseItem {
  return {
    id: `open-cells-${String(number).padStart(2, '0')}-razona`,
    type: 'reasoning',
    relatedLessonId: `open-cells-${String(number).padStart(2, '0')}-lectura`,
    title,
    description: prompt,
    estimatedMinutes: 10,
    activity: {
      kind: 'decision-table', prompt,
      cases: cases.map(([id, label, options]) => ({ id, label, options })),
      expectedOutcomes: outcomes,
    },
    hints: [
      { level: 1, text: 'Decide por alcance, duración y propietario del dato, no por cuál API recuerdas primero.' },
      { level: 2, text: 'La opción correcta deja a cada pieza con una sola responsabilidad observable.' },
      { level: 3, text: 'Pregunta quién produce el dato, quién debe reaccionar y si esa relación sobrevive a un cambio de página.' },
    ],
    explanation,
  };
}

export const OPEN_CELLS_REASONING: ReasoningExerciseItem[] = [
  sequence(2, 'Traza el contrato del componente', 'Ordena cómo una entrada se convierte en una salida pública sin saltar capas.', ['El consumidor configura una propiedad', 'Lit detecta el cambio', 'El componente renderiza', 'WidgetMixin emite una intención', 'El consumidor observa el evento'], 'Las entradas viajan hacia el componente; la actualización produce DOM y la intención pública vuelve hacia el consumidor.'),
  sequence(5, 'Versiona una escritura segura', 'Ordena una modificación del workspace virtual hasta su exportación.', ['Normalizar la ruta', 'Comprobar límites y colisiones', 'Crear un snapshot nuevo', 'Aumentar la generación', 'Persistir o exportar'], 'Validar antes de mutar conserva un snapshot coherente y la generación permite rechazar resultados antiguos.'),
  sequence(6, 'Conecta las fronteras del componente', 'Ordena el recorrido desde una entrada pública hasta una intención que observa el consumidor.', ['El consumidor asigna learnerName', 'Lit solicita una actualización', 'this.t resuelve el texto visible', 'El botón dispara la acción', 'emitEvent publica continue'], 'La propiedad entra, el render produce una salida traducida y el evento devuelve una intención sin filtrar detalles privados.'),
  decisions(10, '¿API pública o estado interno?', 'Clasifica cada dato según quién necesita controlarlo.', [
    ['disabled', 'El consumidor debe impedir interacción', ['Propiedad pública', 'Estado interno']],
    ['hover', 'El puntero está sobre un detalle visual', ['Propiedad pública', 'Estado interno']],
    ['request', 'Identificador de la petición activa', ['Propiedad pública', 'Estado interno']],
  ], { disabled: 'Propiedad pública', hover: 'Estado interno', request: 'Estado interno' }, 'La frontera pública incluye decisiones del consumidor; detalles transitorios pertenecen al componente.'),
  sequence(14, 'Sigue el artefacto de estilos', 'Ordena el camino correcto desde una edición hasta el CSS consumido.', ['Editar la fuente SCSS', 'Ejecutar la transformación', 'Generar CSS determinista', 'Cargar el CSS en la demo', 'Empaquetar ambos artefactos'], 'La fuente se modifica una vez y el artefacto se regenera; editar el resultado rompe reproducibilidad.'),
  sequence(18, 'Resuelve una etiqueta scoped', 'Ordena los eslabones que permiten renderizar una dependencia sin registro global.', ['Importar la clase', 'Componer ScopedElementsMixin', 'Asociar tag y clase en scopedElements', 'Usar el tag en el template', 'Renderizar dentro del Shadow Root'], 'Importar obtiene la clase; scopedElements decide dónde resolver el nombre.'),
  sequence(22, 'Aísla una dependencia rota', 'Ordena una investigación que cambie una sola causa por vez.', ['Confirmar el tag del template', 'Confirmar el import de la clase', 'Confirmar la clave en scopedElements', 'Comparar clave y tag', 'Volver a construir el preview'], 'La cadena tag → import → registro produce evidencia concreta sin adivinar varias correcciones.'),
  sequence(26, 'Cambia el idioma sin carreras', 'Ordena el cambio de locale y la comprobación del texto.', ['Publicar el idioma solicitado', 'Cargar el catálogo', 'Actualizar el locale activo', 'Esperar updateComplete', 'Comprobar el texto visible'], 'La prueba espera las causas reales: recurso cargado y actualización terminada.'),
  decisions(30, 'Elige una frontera de comunicación', 'Elige la superficie más pequeña que conserva desacoplamiento.', [
    ['parentInput', 'El padre entrega un producto al hijo', ['Propiedad', 'Evento', 'Canal']],
    ['childAction', 'El hijo avisa que se seleccionó el producto', ['Propiedad', 'Evento', 'Canal']],
    ['distantState', 'Una página futura necesita la sesión actual', ['Propiedad', 'Evento', 'Canal']],
  ], { parentInput: 'Propiedad', childAction: 'Evento', distantState: 'Canal' }, 'Propiedades bajan datos, eventos suben intenciones cercanas y canales comunican participantes desacoplados.'),
  decisions(34, 'Interpreta coverage con criterio', 'Decide qué evidencia responde cada pregunta.', [
    ['executed', '¿La rama de error llegó a ejecutarse?', ['Coverage', 'Aserción pública']],
    ['correct', '¿El evento trae el detail esperado?', ['Coverage', 'Aserción pública']],
    ['missing', '¿Qué archivo nunca participó?', ['Coverage', 'Aserción pública']],
  ], { executed: 'Coverage', correct: 'Aserción pública', missing: 'Coverage' }, 'Coverage localiza ejecución; una aserción decide si el resultado observado es correcto.'),
  sequence(38, 'Entrega un paquete continuable', 'Ordena la verificación de una exportación real.', ['Construir el workspace completo', 'Crear entradas ZIP con CRC', 'Abrir el ZIP con una herramienta estándar', 'Importar la entrada pública', 'Ejecutar demo y tests'], 'Un Blob no prueba compatibilidad; el consumidor limpio es la evidencia final.'),
  sequence(42, 'Arranca una app Cells', 'Ordena el bootstrap sin cargar páginas innecesarias.', ['Leer configuración', 'Registrar rutas', 'Conectar el outlet', 'Resolver la ruta inicial', 'Importar y activar la página'], 'El bootstrap coordina una sola vez y la ruta carga su página bajo demanda.'),
  sequence(46, 'Abandona una página con seguridad', 'Ordena el cleanup antes de activar otra página.', ['Invocar onPageLeave', 'Cancelar la petición activa', 'Desuscribir canales', 'Retirar la página anterior', 'Activar la página siguiente'], 'La página anterior pierde autoridad antes de que la siguiente comience a gobernar la interfaz.'),
  decisions(50, 'Evento, canal o navegación', 'Elige el mecanismo por intención y alcance.', [
    ['card', 'Una tarjeta comunica selección a su página', ['Evento', 'Canal', 'Navegación']],
    ['session', 'Dos páginas necesitan la última sesión', ['Evento', 'Canal', 'Navegación']],
    ['detail', 'La página cambia al detalle del producto', ['Evento', 'Canal', 'Navegación']],
  ], { card: 'Evento', session: 'Canal', detail: 'Navegación' }, 'La tarjeta no conoce el router; la página media el evento y decide navegar.'),
  sequence(54, 'Demuestra la desuscripción', 'Ordena una prueba que verifique ausencia de entregas posteriores.', ['Suscribir la página', 'Publicar un primer valor', 'Ejecutar onPageLeave', 'Publicar un segundo valor', 'Confirmar que el contador no cambia'], 'La ausencia de la segunda entrega demuestra cleanup mejor que inspeccionar una llamada interna.'),
  sequence(58, 'Traza una petición completa', 'Ordena una transición de datos recuperable.', ['Publicar loading', 'Ejecutar el loader', 'Validar que la petición sigue vigente', 'Publicar success, empty o error', 'Permitir reintento o nueva entrada'], 'Cada resultado terminal pertenece a la petición más reciente y reemplaza estados incompatibles.'),
  sequence(62, 'Resuelve una carrera', 'Ordena dos solicitudes donde la segunda debe ganar.', ['Iniciar petición A', 'Iniciar petición B y abortar A', 'Resolver B con success', 'Recibir tarde la respuesta A', 'Descartar A por requestId'], 'AbortController reduce trabajo; requestId protege incluso cuando una respuesta antigua no pudo cancelarse.'),
  sequence(65, 'Verifica producción desde cero', 'Ordena una comprobación que no dependa del estado de desarrollo.', ['Seleccionar configuración prod', 'Construir artefactos', 'Inspeccionar secretos y URLs de desarrollo', 'Abrir un entorno limpio', 'Recorrer ruta inicial y una ruta lazy'], 'Build verde no basta: el artefacto debe arrancar y navegar sin estado previo.'),
  sequence(68, 'Continúa fuera de la plataforma', 'Ordena la entrega final de una app Cells exportada.', ['Descargar el ZIP', 'Validar su integridad', 'Descomprimir en una carpeta nueva', 'Instalar dependencias declaradas', 'Ejecutar tests, build y navegación'], 'La entrega termina cuando un consumidor limpio reproduce el proyecto con sus contratos intactos.'),
];

export function addOpenCellsReasoning(items: ReadingItem[]): Array<ReadingItem | ReasoningExerciseItem> {
  const byLesson = new Map(OPEN_CELLS_REASONING.map((item) => [item.relatedLessonId, item]));
  return items.flatMap((item) => {
    const practice = byLesson.get(item.id) ?? generatedReasoning(item);
    return practice ? [item, practice] : [item];
  });
}

function concise(text: string, maximum = 104): string {
  const firstSentence = text.trim().split(/(?<=[.!?])\s+/)[0] ?? text.trim();
  return firstSentence.length <= maximum ? firstSentence : `${firstSentence.slice(0, maximum - 1).trimEnd()}…`;
}

function generatedActivity(item: ReadingItem, number: number): ReasoningActivity {
  const sections = item.sections.slice(0, 3);
  const nodes = sections.map((section, index) => ({
    id: `cells-${number}-concepto-${index + 1}`,
    label: `${section.title}: ${concise(section.content)}`,
  }));

  if (number % 3 === 0) {
    const options = nodes.map((node) => node.label);
    return {
      kind: 'decision-table',
      prompt: `Relaciona cada situación de “${item.title}” con la responsabilidad que realmente la explica.`,
      cases: sections.map((section, index) => ({
        id: `cells-${number}-caso-${index + 1}`,
        label: concise(section.example ?? section.content, 132),
        options: [...options.slice(index + 1), ...options.slice(0, index + 1)],
      })),
      expectedOutcomes: Object.fromEntries(nodes.map((node, index) => [`cells-${number}-caso-${index + 1}`, node.label])),
    };
  }

  if (number % 3 === 2) {
    const expectedDependencies = nodes.slice(0, -1).map((node, index) => ({ from: node.id, to: nodes[index + 1].id }));
    return {
      kind: 'dependency-map',
      prompt: `Conecta las ideas de “${item.title}” según qué comprensión necesita existir antes de la siguiente.`,
      modules: nodes,
      dependencyOptions: [
        ...expectedDependencies,
        { from: nodes[0].id, to: nodes.at(-1)!.id },
        { from: nodes.at(-1)!.id, to: nodes[0].id },
      ],
      expectedDependencies,
    };
  }

  return {
    kind: 'sequence',
    prompt: `Ordena el recorrido de “${item.title}” desde el modelo mental hasta la comprobación del error frecuente.`,
    steps: nodes,
    expectedOrder: nodes.map((node) => node.id),
  };
}

function generatedReasoning(item: ReadingItem): ReasoningExerciseItem | undefined {
  const match = item.id.match(/open-cells-(\d+)-lectura/);
  if (!match) return undefined;
  const number = Number(match[1]);
  const title = item.title;
  const keyPoints = item.keyPoints.filter(Boolean);
  return {
    id: `open-cells-${String(number).padStart(2, '0')}-razona`,
    type: 'reasoning',
    relatedLessonId: item.id,
    title: `Razona: ${title}`,
    description: `Representa las decisiones específicas de “${title}” y comprueba que puedes relacionar modelo, contrato y error frecuente sin memorizar una línea de código.`,
    estimatedMinutes: 7,
    activity: generatedActivity(item, number),
    hints: [
      { level: 1, text: keyPoints[0] ?? `Vuelve al modelo mental de “${title}” y localiza quién posee la primera decisión.` },
      { level: 2, text: keyPoints[1] ?? 'Relaciona cada responsabilidad con la salida pública que puede observar un consumidor.' },
      { level: 3, text: item.transferPrompt ?? 'Traslada el contrato a otro dominio y conserva el mismo orden de causas y evidencias.' },
    ],
    explanation: item.sections.map((section) => `${section.title}: ${section.content}`).join(' '),
  };
}
