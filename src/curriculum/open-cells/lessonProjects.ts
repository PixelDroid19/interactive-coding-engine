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
] as const;

export const OPEN_CELLS_LESSON_PROJECTS: OpenCellsLessonProject[] = ARTIFACT_BY_LESSON.map((artifactId, index) => ({
  lesson: index + 1,
  artifactId,
  workspaceKind: index + 1 <= 38 ? 'component' : 'application',
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
