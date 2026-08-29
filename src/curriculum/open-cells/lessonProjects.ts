export type OpenCellsWorkspaceKind = 'component' | 'application';
export type OpenCellsArtifactKind = 'component' | 'page' | 'service' | 'application';

export interface OpenCellsArtifact {
  id: string;
  tagName: string;
  label: string;
  kind: OpenCellsArtifactKind;
  firstLesson: number;
  dependencies: string[];
}

export interface OpenCellsLessonProject {
  lesson: number;
  artifactId: string;
  workspaceKind: OpenCellsWorkspaceKind;
}

export const OPEN_CELLS_ARTIFACTS: Record<string, OpenCellsArtifact> = {
  'action-button': { id: 'action-button', tagName: 'academy-action-button', label: 'Botón de acción', kind: 'component', firstLesson: 1, dependencies: [] },
  'status-badge': { id: 'status-badge', tagName: 'academy-status-badge', label: 'Indicador de estado', kind: 'component', firstLesson: 2, dependencies: [] },
  'state-panel': { id: 'state-panel', tagName: 'academy-state-panel', label: 'Panel de estados', kind: 'component', firstLesson: 3, dependencies: ['status-badge'] },
  'product-card': { id: 'product-card', tagName: 'academy-product-card', label: 'Producto reutilizable', kind: 'component', firstLesson: 6, dependencies: ['action-button', 'status-badge'] },
  'user-summary': { id: 'user-summary', tagName: 'academy-user-summary', label: 'Resumen de usuario', kind: 'component', firstLesson: 10, dependencies: ['status-badge'] },
  'notice-banner': { id: 'notice-banner', tagName: 'academy-notice-banner', label: 'Aviso recuperable', kind: 'component', firstLesson: 13, dependencies: ['action-button', 'status-badge'] },
  'product-list': { id: 'product-list', tagName: 'academy-product-list', label: 'Lista de productos', kind: 'component', firstLesson: 16, dependencies: ['product-card'] },
  'price-tag': { id: 'price-tag', tagName: 'academy-price-tag', label: 'Precio formateado', kind: 'component', firstLesson: 17, dependencies: ['status-badge'] },
  'search-filter': { id: 'search-filter', tagName: 'academy-search-filter', label: 'Filtro de búsqueda', kind: 'component', firstLesson: 21, dependencies: ['action-button'] },
  'language-switcher': { id: 'language-switcher', tagName: 'academy-language-switcher', label: 'Selector de idioma', kind: 'component', firstLesson: 23, dependencies: ['action-button'] },
  'catalog-shell': { id: 'catalog-shell', tagName: 'academy-catalog-shell', label: 'Composición del catálogo', kind: 'component', firstLesson: 37, dependencies: ['product-list', 'search-filter', 'notice-banner'] },
  'catalog-app': { id: 'catalog-app', tagName: 'academy-catalog-app', label: 'Aplicación de catálogo', kind: 'application', firstLesson: 39, dependencies: ['catalog-shell'] },
  'home-page': { id: 'home-page', tagName: 'academy-home-page', label: 'Página de inicio', kind: 'page', firstLesson: 40, dependencies: ['catalog-shell'] },
  'product-detail-page': { id: 'product-detail-page', tagName: 'academy-product-detail-page', label: 'Detalle de producto', kind: 'page', firstLesson: 43, dependencies: ['product-card', 'price-tag'] },
  'favorites-page': { id: 'favorites-page', tagName: 'academy-favorites-page', label: 'Página de favoritos', kind: 'page', firstLesson: 44, dependencies: ['product-list'] },
  'cart-page': { id: 'cart-page', tagName: 'academy-cart-page', label: 'Página de carrito', kind: 'page', firstLesson: 45, dependencies: ['product-card', 'price-tag'] },
  'not-found-page': { id: 'not-found-page', tagName: 'academy-not-found-page', label: 'Ruta no encontrada', kind: 'page', firstLesson: 47, dependencies: ['action-button'] },
  'native-adapter': { id: 'native-adapter', tagName: 'academy-native-adapter', label: 'Adaptador de plataforma', kind: 'service', firstLesson: 55, dependencies: [] },
  'search-page': { id: 'search-page', tagName: 'academy-search-page', label: 'Página de búsqueda', kind: 'page', firstLesson: 57, dependencies: ['search-filter', 'product-list'] },
  'product-data-manager': { id: 'product-data-manager', tagName: 'academy-product-data-manager', label: 'Gestor de productos', kind: 'service', firstLesson: 58, dependencies: [] },
  'app-contract-tests': { id: 'app-contract-tests', tagName: 'academy-app-contract-tests', label: 'Pruebas de contrato de la app', kind: 'service', firstLesson: 63, dependencies: ['catalog-app'] },
  'app-locales': { id: 'app-locales', tagName: 'academy-app-locales', label: 'Idiomas de la aplicación', kind: 'service', firstLesson: 64, dependencies: ['catalog-app'] },
  'delivery-config': { id: 'delivery-config', tagName: 'academy-delivery-config', label: 'Configuración de entrega', kind: 'service', firstLesson: 67, dependencies: ['catalog-app'] },
  'lifecycle-panel': { id: 'lifecycle-panel', tagName: 'academy-lifecycle-panel', label: 'Panel de ciclo de vida', kind: 'component', firstLesson: 69, dependencies: ['status-badge'] },
  'context-panel': { id: 'context-panel', tagName: 'academy-context-panel', label: 'Panel de contexto', kind: 'component', firstLesson: 70, dependencies: ['status-badge'] },
  'media-tile': { id: 'media-tile', tagName: 'academy-media-tile', label: 'Recurso visual configurable', kind: 'component', firstLesson: 71, dependencies: ['action-button'] },
  'theme-preview': { id: 'theme-preview', tagName: 'academy-theme-preview', label: 'Vista de tema', kind: 'component', firstLesson: 72, dependencies: ['state-panel'] },
  'component-workflow': { id: 'component-workflow', tagName: 'academy-component-workflow', label: 'Flujo de componente', kind: 'component', firstLesson: 73, dependencies: ['media-tile', 'theme-preview'] },
  'architecture-map': { id: 'architecture-map', tagName: 'academy-architecture-map', label: 'Mapa de arquitectura', kind: 'application', firstLesson: 74, dependencies: ['catalog-app'] },
  'route-guard': { id: 'route-guard', tagName: 'academy-route-guard', label: 'Guarda de navegación', kind: 'service', firstLesson: 75, dependencies: ['catalog-app'] },
  'delegated-shell': { id: 'delegated-shell', tagName: 'academy-delegated-shell', label: 'Shell con rutas delegadas', kind: 'application', firstLesson: 76, dependencies: ['catalog-app'] },
  'page-cache': { id: 'page-cache', tagName: 'academy-page-cache', label: 'Política de páginas', kind: 'service', firstLesson: 77, dependencies: ['delegated-shell'] },
  'feature-toggle': { id: 'feature-toggle', tagName: 'academy-feature-toggle', label: 'Resolución de capacidades', kind: 'service', firstLesson: 78, dependencies: ['catalog-app'] },
  'offline-shell': { id: 'offline-shell', tagName: 'academy-offline-shell', label: 'Shell sin conexión', kind: 'application', firstLesson: 79, dependencies: ['catalog-app'] },
  'trace-console': { id: 'trace-console', tagName: 'academy-trace-console', label: 'Consola de trazas', kind: 'service', firstLesson: 80, dependencies: ['catalog-app'] },
  'analytics-contract': { id: 'analytics-contract', tagName: 'academy-analytics-contract', label: 'Contrato analítico', kind: 'service', firstLesson: 81, dependencies: ['trace-console'] },
  'performance-budget': { id: 'performance-budget', tagName: 'academy-performance-budget', label: 'Presupuesto de rendimiento', kind: 'service', firstLesson: 82, dependencies: ['catalog-app'] },
  'release-pipeline': { id: 'release-pipeline', tagName: 'academy-release-pipeline', label: 'Puertas de entrega', kind: 'service', firstLesson: 83, dependencies: ['delivery-config'] },
  'migration-adapter': { id: 'migration-adapter', tagName: 'academy-migration-adapter', label: 'Adaptador de migración', kind: 'service', firstLesson: 84, dependencies: ['catalog-app'] },
};

const ARTIFACT_BY_LESSON = [
  'action-button', 'status-badge', 'state-panel', 'action-button', 'status-badge', 'product-card',
  'state-panel', 'action-button', 'state-panel', 'user-summary', 'action-button', 'state-panel', 'notice-banner', 'user-summary',
  'product-card', 'product-list', 'price-tag', 'product-card', 'product-list', 'product-card', 'search-filter', 'notice-banner',
  'language-switcher', 'notice-banner', 'user-summary', 'language-switcher', 'product-list', 'action-button', 'notice-banner', 'product-list',
  'search-filter', 'product-card', 'state-panel', 'product-list', 'language-switcher', 'notice-banner', 'catalog-shell', 'catalog-shell',
  'catalog-app', 'home-page', 'catalog-app', 'home-page', 'product-detail-page', 'favorites-page', 'cart-page', 'home-page',
  'not-found-page', 'product-detail-page', 'product-detail-page', 'favorites-page', 'favorites-page', 'cart-page', 'cart-page', 'home-page',
  'native-adapter', 'not-found-page', 'search-page', 'product-data-manager', 'search-page', 'product-data-manager', 'product-data-manager', 'search-page',
  'app-contract-tests', 'app-locales', 'app-contract-tests', 'native-adapter', 'delivery-config', 'catalog-app',
  'lifecycle-panel', 'context-panel', 'media-tile', 'theme-preview', 'component-workflow', 'architecture-map', 'route-guard', 'delegated-shell',
  'page-cache', 'feature-toggle', 'offline-shell', 'trace-console', 'analytics-contract', 'performance-budget', 'release-pipeline', 'migration-adapter',
] as const;

export const OPEN_CELLS_LESSON_PROJECTS: OpenCellsLessonProject[] = ARTIFACT_BY_LESSON.map((artifactId, index) => ({
  lesson: index + 1,
  artifactId,
  workspaceKind: index + 1 <= 38 || (index + 1 >= 69 && index + 1 <= 73) ? 'component' : 'application',
}));

export function openCellsProjectForLesson(number: number): OpenCellsLessonProject {
  const project = OPEN_CELLS_LESSON_PROJECTS[number - 1];
  if (!project || project.lesson !== number) throw new Error(`No existe proyecto acumulativo para la lección Cells ${number}.`);
  return project;
}

export function openCellsArtifactForLesson(number: number): OpenCellsArtifact {
  const project = openCellsProjectForLesson(number);
  const artifact = OPEN_CELLS_ARTIFACTS[project.artifactId];
  if (!artifact) throw new Error(`No existe el artefacto Cells ${project.artifactId}.`);
  return artifact;
}
