export interface AdvancedApplicationArtifact {
  path: string;
  source: string;
}

const ARTIFACTS: Record<number, AdvancedApplicationArtifact> = {
  74: { path: 'docs/architecture.md', source: `# Diseño técnico de la aplicación

## Fronteras

- **Shell:** arranque, outlet, rutas y configuración.
- **Página:** ciclo de entrada y salida de una ruta.
- **Componente:** presentación reutilizable y eventos públicos.
- **Servicio:** datos, políticas y adaptadores sin render.

## Regla de dependencias

La página coordina componentes y servicios. Los componentes no importan el router ni el data manager.

## Evidencia

Una selección sale como evento, la página decide navegar y la ruta carga el módulo bajo demanda.
` },
  75: { path: 'app/routing/pending-changes-interceptor.js', source: `export function pendingChangesInterceptor({ target, hasPendingChanges }) {
  if (!hasPendingChanges) return { action: 'allow', target };
  return { action: 'confirm', target, reason: 'pending-changes' };
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
