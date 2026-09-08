export interface AdvancedApplicationArtifact {
  path: string;
  source: string;
}

const ARTIFACTS: Record<number, AdvancedApplicationArtifact> = {
  74: { path: 'docs/architecture.md', source: `# Diseño técnico del Estudio Cells

## Recorre una decisión real

Abre la aplicación y selecciona un proyecto del catálogo. La tarjeta publica la selección; la página comunica el proyecto y solicita la ruta de detalle. El shell aplica la navegación. No hace falta que la tarjeta conozca una URL ni que importe el router.

## Propietarios y duración

| Frontera | Archivo de entrada | Responsabilidad | Duración |
| --- | --- | --- | --- |
| Shell | [app.js](../app/scripts/app.js) | Inicializa mensajes y arranca el outlet; usa las [rutas declaradas](../app/scripts/app-routes.js). | Sesión de la aplicación. |
| Página de catálogo | [academy-home-page.js](../app/pages/academy-home-page/academy-home-page.js) | Entrega productos a las tarjetas, recibe intenciones, publica en el canal y solicita navegación. | Instancia de página; la suscripción solo existe entre entrada y salida. |
| Página de detalle | [academy-product-detail-page.js](../app/pages/academy-product-detail-page/academy-product-detail-page.js) | Recibe el parámetro id en onPageEnter y presenta la visita. | Instancia de página; los parámetros se actualizan al entrar. |
| Componente compartido | [academy-product-card.js](../app/components/academy-product-card/academy-product-card.js) | Recibe product por propiedad y emite una copia como intención pública. | Instancia scoped dentro de la página. |
| Servicio de datos | [academy-product-data-manager.js](../app/data/academy-product-data-manager.js) | Encapsula carga, estados y cancelación sin renderizar. | La decide el consumidor que lo cree. |

El catálogo actual usa productos de demostración en su constructor. El data manager está disponible y probado por separado, pero todavía no alimenta esa pantalla. No dibujes una dependencia página → servicio como si ya existiera: al conectarla tendrás que definir quién escucha sus estados y quién cancela la petición al salir.

## Contratos entre fronteras

| Emisor → receptor | Entrada o evento | Quién decide el siguiente paso |
| --- | --- | --- |
| Página → tarjeta | Propiedad product con id, name y price. | La tarjeta decide cómo presentarla, no cómo cargarla. |
| Tarjeta → página | academy-product-card-select; detail contiene una copia del producto. | handleProductSelected de la página. |
| Página → canal | academy:studio:project:selected, declarado en [channels.js](../app/scripts/channels.js). | Cada suscriptor interpreta la selección; el canal no navega. |
| Página → router | navigate('product-detail', { id: product.id }). | El router resuelve la ruta nombrada y carga su módulo. |
| Router → detalle | onPageEnter({ id }). | La página de detalle actualiza su estado local. |

La selección por canal y el parámetro de ruta no son lo mismo. El canal comunica el objeto durante la sesión; la ruta transporta el identificador navegable. En este ejemplo el detalle muestra ese identificador: no obtiene automáticamente el objeto completo del catálogo.

## Dependencias permitidas

Las páginas pueden componer componentes y coordinar servicios. Una tarjeta presentacional no importa páginas, configuración de rutas ni el data manager. El shell conoce módulos de página a través de las rutas, no sus controles internos. Estas direcciones evitan el ciclo tarjeta → página → tarjeta.

El botón, la tipografía y el registro de estilos compartidos son capacidades transversales, no propietarios del producto seleccionado. Cada componente registra sus dependencias scoped y comunica intenciones con emitEvent. Las traducciones se inicializan en [app-messages.js](../app/scripts/app-messages.js); no se reparte un catálogo independiente por cada pantalla.

## Criterios de aceptación

1. Cambia un id de los datos de demostración y selecciona esa tarjeta. El detalle debe mostrar el nuevo id, no un valor fijo.
2. El evento de la tarjeta conserva id, name y price; la propiedad original no se modifica al emitirlo.
3. Sal del catálogo y vuelve. onPageLeave retira la suscripción y onPageEnter la establece para la nueva visita.
4. Selecciona desde Inicio, Favoritos y Búsqueda. Las tres superficies solicitan product-detail con el id elegido.
5. Ejecuta cells app:test y cells app:build -c prod.js tras exportar. Consulta [app.test.js](../test/unit/app.test.js): sus pruebas verifican contratos aislados, no sustituyen el recorrido en navegador.

## Tu decisión de diseño

Antes de añadir persistencia de favoritos, escribe qué servicio conserva los ids, qué página lo consulta y qué evento solicita un cambio. Conserva la tarjeta sin conocimiento de almacenamiento. Define dos casos observables: guardar un proyecto y volver a abrir la página sin duplicarlo. Solo después conecta los archivos y comprueba ambos recorridos.
` },
  75: { path: 'app/routing/pending-changes-interceptor.js', source: `/**
 * @typedef {{ page: string, params?: Record<string, unknown> }} NavigationTarget
 * @typedef {{ action: 'allow' | 'cancel', target: NavigationTarget, reason?: 'pending-changes' | 'confirmation-unavailable' }} NavigationDecision
 */

/**
 * Decide antes de navegar; no renderiza ni modifica el historial.
 * @param {{ target: NavigationTarget, hasPendingChanges: boolean, confirmLeave?: (target: NavigationTarget) => boolean | Promise<boolean> }} request
 * @returns {Promise<NavigationDecision>}
 */
export async function pendingChangesInterceptor({ target, hasPendingChanges, confirmLeave }) {
  if (!hasPendingChanges) return { action: 'allow', target };
  if (typeof confirmLeave !== 'function') return { action: 'cancel', target, reason: 'confirmation-unavailable' };
  try {
    const accepted = await confirmLeave(target);
    return accepted === true
      ? { action: 'allow', target }
      : { action: 'cancel', target, reason: 'pending-changes' };
  } catch {
    return { action: 'cancel', target, reason: 'confirmation-unavailable' };
  }
}
` },
  76: { path: 'app/scripts/delegated-routes.js', source: `export function delegateRoute(url) {
  const match = /^\\/catalogo(?:\\/([^/?#]+))?/.exec(url);
  if (!match) return undefined;
  return { module: 'catalogo', route: match[1] ? 'detail' : 'home', params: { id: match[1] } };
}
` },
  77: { path: 'app/runtime/page-retention.js', source: `export class PageRetention {
  constructor(limit = 2) { this.limit = limit; this.pages = new Map(); }
  keep(name, page) {
    this.pages.delete(name);
    this.pages.set(name, page);
    while (this.pages.size > this.limit) {
      const oldest = this.pages.keys().next().value;
      this.pages.get(oldest)?.onPageLeave?.();
      this.pages.delete(oldest);
    }
  }
}
` },
  78: { path: 'app/config/feature-flags.js', source: `const DEFAULT_FLAGS = { compactCatalog: false };

export function resolveFeatureFlags(input = {}) {
  return {
    compactCatalog: typeof input.compactCatalog === 'boolean'
      ? input.compactCatalog
      : DEFAULT_FLAGS.compactCatalog,
  };
}
` },
  79: { path: 'service-worker.js', source: `const SHELL_CACHE = 'academy-shell-v1';
const SHELL_FILES = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)));
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
  }
});
` },
  80: { path: 'app/observability/trace.js', source: `export function createTrace(name, correlationId, now = performance.now()) {
  return {
    name,
    correlationId,
    startedAt: now,
    finish(status, finishedAt = performance.now()) {
      return { name, correlationId, status, durationMs: finishedAt - now };
    },
  };
}
` },
  81: { path: 'app/analytics/events.js', source: `const CONTRACTS = { 'catalog:item-selected': ['itemId', 'source'] };

export function createAnalyticsEvent(name, properties) {
  const allowed = CONTRACTS[name];
  if (!allowed) return undefined;
  return { name, version: 1, properties: Object.fromEntries(allowed.map((key) => [key, properties[key]])) };
}
` },
  82: { path: 'performance-budget.json', source: `{
  "initialJavaScriptKb": 180,
  "initialCssKb": 45,
  "routeTransitionMs": 250,
  "retainedPages": 2
}
` },
  83: { path: 'ci/quality-gates.js', source: `export const QUALITY_GATES = [
  { name: 'tests', command: 'npm test' },
  { name: 'build', command: 'npm run build' },
  { name: 'package-audit', command: 'npm run package:audit' },
  { name: 'consumer-smoke', command: 'npm run test:consumer' },
];

export function canPromote(results) {
  return QUALITY_GATES.every((gate) => results[gate.name] === 'passed');
}
` },
  84: { path: 'app/migrations/catalog-contract.js', source: `export function normalizeCatalogItem(input, warn = () => {}) {
  if ('title' in input) return { id: input.id, name: input.title };
  if ('name' in input) {
    warn('La propiedad name se retirará en la próxima versión mayor.');
    return { id: input.id, name: input.name };
  }
  return undefined;
}
` },
};

export function advancedApplicationArtifactForLesson(number: number): AdvancedApplicationArtifact | undefined {
  return ARTIFACTS[number];
}
