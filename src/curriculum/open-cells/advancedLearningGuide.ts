import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

interface Guide {
  title: string;
  owners: Array<[path: string, responsibility: string]>;
  check: string;
  limit: string;
  details?: string;
}

const home = 'app/pages/academy-home-page/academy-home-page.js';
const detail = 'app/pages/academy-product-detail-page/academy-product-detail-page.js';
const guides: Record<number, Guide> = {
  75: {
    title: 'Decidir antes de abandonar un cambio',
    owners: [
      ['app/routing/pending-changes-interceptor.js', 'decide si hace falta una confirmación y espera una respuesta explícita'],
      ['app/routing/navigation-guard.js', 'coordina la espera con el interceptor síncrono y autoriza una sola transición'],
      ['app/routing/pending-changes-shell.js', 'posee la nota de sesión, el diálogo y la respuesta de la persona'],
    ],
    check: 'Escribe una nota sin guardar e intenta ir a Guardados. Cancela: debes seguir en la misma página y conservar el borrador. Repite y acepta: debe ocurrir una sola navegación. Vuelve, guarda una nota y comprueba que navegar ya no pide confirmación.',
    limit: 'Protege rutas internas. No intercepta el cierre de la pestaña ni guarda la nota entre sesiones. Una promesa no puede reemplazar directamente la respuesta del interceptor síncrono.',
  },
  76: {
    title: 'Seguir una ruta hasta su módulo propietario',
    owners: [
      ['app/scripts/delegated-routes.js', 'valida el prefijo y decodifica un único identificador'],
      ['app/modules/catalogo/navigation.js', 'traduce el resultado válido a una navegación nombrada'],
      ['app/modules/catalogo/routes.js', 'declara las rutas que el shell incorpora sin duplicarlas'],
      ['app/scripts/delegated-shell.js', 'recibe la dirección escrita y presenta el resultado de la validación'],
    ],
    check: 'Abre /catalogo/first desde el control del shell. Comprueba el detalle y vuelve. Prueba un prefijo parecido, una URL externa y un identificador mal codificado: deben conservar la página actual. En el exportado, repite con recarga, Atrás y Adelante.',
    limit: 'El playground navega dentro de su marco aislado. Para comprobar una URL compartible usa la aplicación exportada; el adaptador del catálogo es código de esta aplicación, no una API nueva del framework.',
  },
  77: {
    title: 'Separar la vida de una página de la vida del dato',
    owners: [
      ['app/runtime/page-retention.js', 'limita las entradas retenidas y llama a cleanup al expulsarlas'],
      ['app/runtime/retained-page-mixin.js', 'conecta retención, recursos y nota de sesión con el ciclo de vida'],
      ['app/runtime/retained-page.js', 'compone el comportamiento de la aplicación con PageMixin'],
      [home, 'muestra borrador, nota guardada y contadores para comprobar el efecto'],
    ],
    check: 'Escribe un borrador, guarda otra nota y visita suficientes páginas distintas para superar el límite. Al volver, contrasta el borrador local con la nota de sesión. Envía el evento de prueba y comprueba que no aparecen respuestas duplicadas de recursos expulsados.',
    limit: 'Los contadores describen esta política de recursos; no miden memoria en bytes ni equivalen por sí solos al número de nodos del router. La nota de sesión vive fuera de la instancia, pero no es persistencia entre recargas.',
  },
  78: {
    title: 'Cambiar una capacidad sin cambiar el contrato',
    owners: [['app/config/feature-flags.js', 'valida las opciones'], ['app/config/feature-state.js', 'posee el estado compartido de la capacidad'], [home, 'permite cambiarla y entrega el valor a las tarjetas']],
    check: 'Activa y desactiva el catálogo compacto. Abre la misma tarjeta en ambos modos: su identificador y su destino deben permanecer iguales. Prueba también el cambio de idioma.',
    limit: 'Es configuración local de la aplicación, no un servicio remoto de despliegue gradual ni una autorización de acceso.',
    details: 'feature-flags.md',
  },
  79: {
    title: 'Distinguir un shell disponible de datos actuales',
    owners: [['service-worker.js', 'gestiona el caché del shell'], ['app/runtime/offline-shell.js', 'coordina el registro y el estado visible'], ['resources/live-status.json', 'aporta una respuesta de práctica cuya disponibilidad se comprueba por separado']],
    check: 'En el exportado servido por HTTP local, carga primero con conexión y espera al service worker. Desconecta y recarga: comprueba el shell y, por separado, el estado de los datos. Recupera la conexión y vuelve a intentar la consulta.',
    limit: 'El marco srcdoc del playground no demuestra control de service worker. Mostrar el shell sin conexión no demuestra que los datos estén actualizados.',
    details: 'offline-shell.md',
  },
  80: {
    title: 'Relacionar los pasos de una misma acción',
    owners: [['app/observability/trace.js', 'abre y cierra un intervalo una sola vez'], ['app/observability/trace-session.js', 'relaciona pasos con un identificador y limita el historial'], ['app/data/project-detail.js', 'carga el dato local y admite cancelación'], [detail, 'espera al render y cierra o cancela los pasos de la visita']],
    check: 'Abre Museo y vuelve. Compara los identificadores de selección, navegación, datos y render. Prueba después el proyecto inexistente: la carga falla aunque el render del mensaje de error pueda terminar bien.',
    limit: 'Son trazas locales de sesión, no telemetría enviada a un proveedor. No incluyas cuerpos de respuesta ni datos personales en el registro.',
    details: 'traces.md',
  },
  81: {
    title: 'Medir una selección sin apropiarse de la navegación',
    owners: [['app/analytics/events.js', 'valida nombre, versión y propiedades permitidas'], ['app/analytics/adapter.js', 'entrega eventos válidos al colector local acotado'], [home, 'elige los datos mínimos y conserva la navegación de negocio']],
    check: 'Selecciona una tarjeta, vuelve y examina el evento. Debe contener itemId y source, no el producto completo. Vacía el historial y repite: la selección debe seguir abriendo el detalle.',
    limit: 'El colector no envía peticiones ni persiste entre recargas. Validar que un valor sea una cadena no garantiza que esté libre de información personal.',
    details: 'analytics.md',
  },
  82: {
    title: 'Comparar una observación con un límite',
    owners: [['performance-budget.json', 'declara los máximos'], ['app/performance/measure-resources.js', 'lee recursos iniciales disponibles'], ['app/performance/navigation.js', 'mide la transición correlacionada'], ['app/performance/evaluate-budget.js', 'distingue exceso, cumplimiento y falta de medida']],
    check: 'En el exportado, recarga Inicio y abre una tarjeta. Vuelve para ver la transición cerrada. Reduce su límite por debajo del valor observado, ejecuta de nuevo y repite bajo las mismas condiciones: debe aparecer un exceso explicado.',
    limit: 'Sin medida no hay aprobación. Los KiB descomprimidos no son tamaño gzip; una transición no prueba el rendimiento de todas las rutas.',
    details: 'performance.md',
  },
  83: {
    title: 'Producir evidencia de una entrega',
    owners: [['ci/quality-gates.js', 'exige los resultados de todas las puertas para la misma ejecución y artefacto'], ['ci/run-release.js', 'crea el área de trabajo y ejecuta las comprobaciones'], ['ci/artifact.js', 'audita los archivos y calcula su identidad'], ['ci/consumer-smoke.js', 'abre el artefacto construido y recorre Inicio, detalle y regreso']],
    check: 'Sigue la preparación de release.md y ejecuta npm run release:check. Importa el report.json generado en el panel. En una copia de práctica, introduce una prueba fallida y repite: el nuevo informe debe bloquear la entrega y no presentar las puertas pendientes como aprobadas.',
    limit: 'El panel lee un informe: no ejecuta CI ni acredita su autenticidad. La construcción aislada reutiliza dependencias instaladas; no equivale a una instalación hermética. No publica automáticamente.',
    details: 'release.md',
  },
  84: {
    title: 'Retirar un contrato sin mantener dos productos',
    owners: [['app/migrations/catalog-contract.js', 'valida y normaliza los dos formatos'], ['app/migrations/adapt-catalog.js', 'cuenta usos antiguos y rechazos de la carga'], ['app/consumers/legacy-catalog.js', 'representa el consumidor de name'], ['app/consumers/current-catalog.js', 'representa el consumidor de title'], ['app/migrations/plan.js', 'declara el calendario de práctica']],
    check: 'Carga el consumidor antiguo, activa la retirada y comprueba que sus registros se rechazan. Cambia al nuevo: deben regresar las mismas tarjetas sin usos antiguos. Abre una y vuelve para verificar que conserva la navegación.',
    limit: 'Los conteos son de este lote, no de todos los consumidores en producción. La fecha es un ejemplo y no desactiva código automáticamente.',
    details: 'migration.md',
  },
};

export function connectAdvancedLearningGuide(base: VersionedCellsWorkspace, number: number): VersionedCellsWorkspace {
  const guide = guides[number];
  if (!guide) return base;
  const content = `# ${guide.title}

Esta guía complementa la clase grabada con las conexiones de la aplicación actual. No sustituye su audio ni sus subtítulos. Puedes abrir estos archivos desde el árbol del editor o después de exportar el proyecto.

## Sigue los propietarios

${guide.owners.map(([path, responsibility], index) => `${index + 1}. [${path}](../${path}): ${responsibility}.`).join('\n')}

## Comprueba el resultado

${guide.check}

Antes de editar, predice qué resultado cambiará. Modifica una sola responsabilidad, ejecuta otra vez y compara con tu predicción. Conserva el caso anterior para comprobar que no has roto otro consumidor.

## Qué demuestra y qué no

${guide.limit}
${guide.details ? `\nContinúa con [la guía específica](${guide.details}) para preparar y repetir la comprobación.\n` : ''}`;
  const workspace = writeCellsFile(base, 'docs/recorrido.md', content);
  return writeCellsFile(workspace, 'README.md', `${workspace.snapshot.files['README.md'].content}\n\n## Continúa esta clase\n\nAbre el [recorrido de la aplicación](docs/recorrido.md): archivos propietarios, comprobación observable y límites del ejemplo.\n`);
}
