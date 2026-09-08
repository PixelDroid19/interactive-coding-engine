import { OPEN_CELLS_ARTIFACTS, type OpenCellsArtifact } from '../../curriculum/open-cells/lessonProjects';
import { createCellsComponentWorkspace, type CellsComponentPracticeStage } from './cellsRecipes';
import { createVersionedCellsWorkspace, type VersionedCellsWorkspace, writeCellsFile } from './cellsVirtualFileSystem';
import { createCellsAccountFeaturePractice, createCellsAccountFeatureWorkspace } from './cellsAccountFeature';
import { advancedComponentRecipe } from './cellsAdvancedComponentRecipes';

interface ComponentBlueprint {
  propertyName: string;
  attribute: string;
  defaultValue: string;
  demoValue: string;
  eventName: string;
  accent: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
  action: { en: string; es: string };
}

const BLUEPRINTS: Record<string, ComponentBlueprint> = {
  'action-button': blueprint('label', 'label', '', 'Guardar', 'activate', '#2563eb', 'Reusable action', 'Acción reutilizable', 'One button, one public intention.', 'Un botón, una intención pública.', 'Activate', 'Activar'),
  'status-badge': blueprint('status', 'status', 'Disponible', 'Sin conexión', 'inspect', '#059669', 'Observable status', 'Estado observable', 'Color and text describe the same state.', 'Color y texto describen el mismo estado.', 'Inspect', 'Inspeccionar'),
  'state-panel': blueprint('state', 'state', 'loading', 'error', 'retry', '#d97706', 'Request states', 'Estados de una petición', 'Loading, empty, error and success cannot overlap.', 'Loading, empty, error y success no se mezclan.', 'Retry', 'Reintentar'),
  'product-card': blueprint('productName', 'product-name', 'Café de origen', 'Té verde', 'select', '#7c3aed', 'A reusable product', 'Un producto reutilizable', 'The card presents data and returns a selection.', 'La tarjeta presenta datos y devuelve una selección.', 'View detail', 'Ver detalle'),
  'user-summary': blueprint('userName', 'user-name', 'Ada', 'Lina', 'open', '#0891b2', 'User summary', 'Resumen de usuario', 'A small public API keeps private layout replaceable.', 'Una API pequeña permite cambiar el diseño interno.', 'Open profile', 'Abrir perfil'),
  'notice-banner': blueprint('message', 'message', 'Todo está sincronizado', 'No pudimos cargar los datos', 'dismiss', '#dc2626', 'Recoverable notice', 'Aviso recuperable', 'The message explains the state and offers one action.', 'El mensaje explica el estado y ofrece una acción.', 'Dismiss', 'Descartar'),
  'product-list': blueprint('category', 'category', 'Bebidas', 'Favoritos', 'filter', '#4f46e5', 'Product collection', 'Colección de productos', 'The list composes cards without copying their implementation.', 'La lista compone tarjetas sin copiar su implementación.', 'Show all', 'Mostrar todos'),
  'price-tag': blueprint('price', 'price', '12,00 €', '19,90 €', 'explain', '#be123c', 'Formatted price', 'Precio formateado', 'Formatting remains inside a reusable visual contract.', 'El formato permanece dentro de un contrato visual reutilizable.', 'Explain price', 'Explicar precio'),
  'search-filter': blueprint('query', 'query', 'café', 'té', 'search', '#0f766e', 'Catalog search', 'Búsqueda del catálogo', 'The filter emits a query; it does not own the results.', 'El filtro emite una consulta; no es dueño de los resultados.', 'Search', 'Buscar'),
  'language-switcher': blueprint('locale', 'locale', 'es', 'en', 'change', '#9333ea', 'Language selector', 'Selector de idioma', 'The shell owns the locale and components consume it.', 'El shell posee el idioma y los componentes lo consumen.', 'Change language', 'Cambiar idioma'),
  'catalog-shell': blueprint('section', 'section', 'Destacados', 'Novedades', 'navigate', '#0f766e', 'Catalog composition', 'Composición del catálogo', 'Filter, list and notices collaborate through public contracts.', 'Filtro, lista y avisos colaboran mediante contratos públicos.', 'Open section', 'Abrir sección'),
  'lifecycle-panel': blueprint('connectionState', 'connection-state', 'conectado', 'reconectado', 'inspect', '#0f766e', 'Lifecycle evidence', 'Evidencia del ciclo de vida', 'Subscriptions have a visible owner and cleanup.', 'Las suscripciones tienen propietario y limpieza visibles.', 'Inspect state', 'Inspeccionar estado'),
  'context-panel': blueprint('density', 'density', 'cómoda', 'compacta', 'change', '#2563eb', 'Shared context', 'Contexto compartido', 'Two consumers observe one scoped provider.', 'Dos consumidores observan un proveedor con alcance.', 'Change context', 'Cambiar contexto'),
  'media-tile': blueprint('imageLabel', 'image-label', 'Paisaje de ejemplo', 'Diagrama accesible', 'open', '#c2410c', 'Configurable media', 'Recurso configurable', 'The consumer owns the resource and its accessible description.', 'El consumidor controla el recurso y su descripción accesible.', 'Inspect media', 'Inspeccionar recurso'),
  'theme-preview': blueprint('theme', 'theme', 'claro', 'oscuro', 'change', '#1d4ed8', 'Theme contract', 'Contrato de tema', 'Tokens change the environment without duplicating the component.', 'Los tokens cambian el ambiente sin duplicar el componente.', 'Inspect theme', 'Inspeccionar tema'),
  'component-workflow': blueprint('stage', 'stage', 'desarrollo', 'entrega', 'advance', '#047857', 'Component workflow', 'Flujo del componente', 'Source, demo, tests and package advance together.', 'Fuente, demo, pruebas y paquete avanzan juntos.', 'Inspect stage', 'Inspeccionar etapa'),
};

function blueprint(
  propertyName: string,
  attribute: string,
  defaultValue: string,
  demoValue: string,
  eventName: string,
  accent: string,
  titleEn: string,
  titleEs: string,
  descriptionEn: string,
  descriptionEs: string,
  actionEn: string,
  actionEs: string,
): ComponentBlueprint {
  return {
    propertyName,
    attribute,
    defaultValue,
    demoValue,
    eventName,
    accent,
    title: { en: titleEn, es: titleEs },
    description: { en: descriptionEn, es: descriptionEs },
    action: { en: actionEn, es: actionEs },
  };
}

function classNameFor(tagName: string): string {
  return tagName.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function renderMarkup(artifact: OpenCellsArtifact, blueprint: ComponentBlueprint, prefix: string): string {
  const value = `\${this.${blueprint.propertyName}}`;
  const translated = (key: string) => `\${this.t('${prefix}.${key}')}`;
  const action = `@click=\${this.handleAction}`;
  const childAction = `@academy-action-button-activate=\${this.handleAction}`;
  switch (artifact.id) {
    case 'action-button':
      return `<button type="button" class="primary-action" ?disabled=\${this.disabled} ${action}><academy-type-text as="span"><slot>\${this.label || this.t('${prefix}.action')}</slot></academy-type-text></button>`;
    case 'status-badge':
      return `<button type="button" class="status-stage" ${action}>
          <span class="status-dot" aria-hidden="true"></span>
          <academy-type-text as="span">${value}</academy-type-text>
          <small>${translated('action')}</small>
        </button>`;
    case 'state-panel':
      return `<div class="state-grid" data-state=\${this.visibleState} role=\${this.visibleState === 'error' ? 'alert' : 'status'} aria-busy=\${String(this.visibleState === 'loading')}>
          <academy-status-badge .status=\${this.t('${prefix}.' + this.visibleState)}></academy-status-badge>
          <p>\${this.t('${prefix}.' + this.visibleState)}</p>
          \${this.visibleState === 'success' ? html\`<slot></slot>\` : ''}
          \${this.visibleState === 'error' ? html\`<academy-action-button
            .label=\${this.t('${prefix}.action')}
            ${childAction}
          ></academy-action-button>\` : ''}
        </div>`;
    case 'product-card':
      return `<article class="product-card">
          <academy-status-badge .status=\${this.t('${prefix}.status')}></academy-status-badge>
          <h2>${value}</h2>
          <p>${translated('description')}</p>
          <academy-action-button
            .label=\${this.t('${prefix}.action')}
            ${childAction}
          ></academy-action-button>
        </article>`;
    case 'user-summary':
      return `<div class="profile">
          <div class="avatar">${'\${this.userName.slice(0, 1)}'}</div>
          <div>
            <h2>${value}</h2>
            <p>${translated('description')}</p>
          </div>
          <academy-status-badge .status=\${this.t('${prefix}.status')}></academy-status-badge>
          <button type="button" class="primary-action" ${action}>${translated('action')}</button>
        </div>`;
    case 'notice-banner':
      return `<aside class="notice" role="status">
          <academy-status-badge .status=\${this.t('${prefix}.status')}></academy-status-badge>
          <p>${value}</p>
          <academy-action-button
            .label=\${this.t('${prefix}.action')}
            ${childAction}
          ></academy-action-button>
        </aside>`;
    case 'product-list':
      return `<section class="collection">
          <header>
            <h2>${value}</h2>
            <academy-action-button .label=\${this.t('${prefix}.action')} ${childAction}></academy-action-button>
          </header>
          <div class="product-grid">
            \${this.visibleItems.map((item) => html\`<academy-product-card .productName=\${item.name} @academy-product-card-select=\${(event) => this.handleSelection(event, item)}></academy-product-card>\`)}
          </div>
          \${this.visibleItems.length === 0 ? html\`<p role="status">\${this.t('${prefix}.empty')}</p>\` : ''}
        </section>`;
    case 'price-tag':
      return `<button type="button" class="price" ${action}>
          <small>${translated('title')}</small>
          <strong>${value}</strong>
          <academy-status-badge .status=\${this.t('${prefix}.status')}></academy-status-badge>
        </button>`;
    case 'search-filter':
      return `<form class="search" @submit=\${this.handleSubmit}>
          <label>
            ${translated('title')}
            <input
              .value=\${this.query}
              @input=\${(event) => { this.query = event.target.value; }}
              @keydown=\${this.handleInputKeydown}
            >
          </label>
          <academy-action-button .label=\${this.t('${prefix}.action')} @academy-action-button-activate=\${this.handleSubmit}></academy-action-button>
        </form>`;
    case 'language-switcher':
      return `<div class="language">
          <p>${translated('description')}</p>
          <academy-action-button .label=\${this.t('${prefix}.spanish')} @academy-action-button-activate=\${() => this.chooseLocale('es')}></academy-action-button>
          <academy-action-button .label=\${this.t('${prefix}.english')} @academy-action-button-activate=\${() => this.chooseLocale('en')}></academy-action-button>
        </div>`;
    case 'catalog-shell':
      return `<main class="catalog">
          <academy-search-filter .query=\${this.query} @academy-search-filter-search=\${this.handleSearch}></academy-search-filter>
          <academy-notice-banner .message=\${this.t('${prefix}.description')}></academy-notice-banner>
          <academy-product-list .category=\${this.section} .items=\${this.items} .query=\${this.query} @academy-product-list-filter=\${this.resetSearch} @academy-product-list-select=\${this.handleSelection}></academy-product-list>
          <button type="button" class="primary-action" ${action}>${translated('action')}</button>
        </main>`;
    default:
      return `<article class="state-grid">
          <strong>${value}</strong>
          <p>${translated('description')}</p>
          <button class="primary-action" ${action}>${translated('action')}</button>
        </article>`;
  }
}

function componentStyles(artifact: OpenCellsArtifact, blueprint: ComponentBlueprint): string {
  const accent = `var(--${artifact.id}-accent, var(--academy-accent, ${blueprint.accent}))`;
  const layout = artifact.id === 'product-list' || artifact.id === 'catalog-shell' ? 'min(52rem, 100%)' : 'min(34rem, 100%)';
  const compact = artifact.id === 'action-button' || artifact.id === 'status-badge';
  return `:host {
  display: ${compact ? 'inline-block' : 'block'};
  width: ${compact ? 'auto' : layout};
  color: var(--academy-foreground, #172033);
  font-family: system-ui, sans-serif;
}

.surface {
  display: grid;
  gap: 1rem;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid var(--academy-border, color-mix(in srgb, ${accent} 42%, #dbe3ef));
  border-radius: 1.35rem;
  background: var(--academy-surface, linear-gradient(145deg, #ffffff, color-mix(in srgb, ${accent} 8%, #f8fafc)));
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 12%);
}

.eyebrow { margin: 0; color: ${accent}; font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.primary-action, .language button { border: 0; border-radius: 999px; padding: .85rem 1.2rem; background: var(--academy-action-background, ${accent}); color: var(--academy-action-foreground, white); font-weight: 800; cursor: pointer; }
.primary-action:focus-visible, .status-stage:focus-visible, .language button:focus-visible { outline: 3px solid var(--academy-focus, ${accent}); outline-offset: 3px; }
${artifact.id === 'action-button' ? '.primary-action:disabled { opacity: .55; cursor: not-allowed; }\n' : ''}
.status-stage, .profile, .notice, .price, .collection header, .language { display: flex; align-items: center; gap: .8rem; flex-wrap: wrap; }
.status-stage, .notice, .price { border-left: .35rem solid ${accent}; padding: 1rem; background: var(--academy-muted-surface, #f8fafc); }
.status-stage, .price { width: 100%; border-top: 0; border-right: 0; border-bottom: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.status-dot { width: .75rem; height: .75rem; border-radius: 50%; background: ${accent}; }
${artifact.id === 'status-badge' ? '.status-stage { width: auto; border: 1px solid currentColor; border-radius: 999px; padding: .4rem .7rem; gap: .45rem; font-size: .8rem; }\n' : ''}
.state-grid, .product-card { display: grid; gap: 1rem; }
.avatar { display: grid; width: 3rem; height: 3rem; place-items: center; border-radius: 50%; background: ${accent}; color: white; font-size: 1.25rem; font-weight: 900; }
.collection { display: grid; gap: 1rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .8rem; }
.search { display: flex; align-items: end; gap: .8rem; }
.search label { display: grid; flex: 1; gap: .35rem; }
.search input { min-height: 2.65rem; border: 1px solid #94a3b8; border-radius: .6rem; padding: 0 .75rem; }
.language button.active { outline: 3px solid color-mix(in srgb, ${accent} 35%, white); }
.catalog { display: grid; gap: 1rem; }
`;
}

export function createCellsCurriculumComponentWorkspace(artifact: OpenCellsArtifact): VersionedCellsWorkspace {
  if (artifact.id === 'account-detail') return createCellsAccountFeatureWorkspace(createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS['action-button']));
  const blueprint = BLUEPRINTS[artifact.id];
  if (!blueprint) throw new Error(`No existe recipe visual para ${artifact.id}.`);
  const base = createCellsComponentWorkspace({ name: artifact.tagName });
  const files = Object.fromEntries(Object.entries(base.snapshot.files).map(([path, source]) => [path, { ...source }]));
  const className = classNameFor(artifact.tagName);
  const sourcePath = `src/${artifact.tagName}.js`;
  const prefix = artifact.id.replaceAll('-', '.');
  const dependencyIds = artifact.dependencies.length > 0 ? artifact.dependencies : ['type-text'];
  const dependencyImports = dependencyIds.map((id) => {
    const tag = id === 'type-text' ? 'academy-type-text' : `academy-${id}`;
    return { id, tag, className: classNameFor(tag) };
  });
  const imports = dependencyImports.map((dependency) => `import { ${dependency.className} } from './components/${dependency.tag}.js';`).join('\n');
  const registry = dependencyImports.map((dependency) => `      ${dependency.className},`).join('\n');
  const unitDependencyImports = dependencyImports
    .map((dependency) => `import { ${dependency.className} } from '../../src/components/${dependency.tag}.js';`)
    .join('\n');
  const unitDependencyAssertions = dependencyImports
    .map((dependency) => `    const ${dependency.id.replaceAll('-', '_')} = component.shadowRoot.querySelector('${dependency.tag}');
    await ${dependency.id.replaceAll('-', '_')}.updateComplete;
    expect(${dependency.id.replaceAll('-', '_')}.constructor).toBe(${dependency.className});
    expect(customElements.get('${dependency.tag}')).toBeUndefined();`)
    .join('\n');
  const advanced = advancedComponentRecipe(artifact.id);
  const markup = advanced?.markup ?? renderMarkup(artifact, blueprint, prefix);
  const styles = componentStyles(artifact, blueprint) + (advanced?.styles ?? '');
  const isCollection = artifact.id === 'product-list' || artifact.id === 'catalog-shell';
  const compact = artifact.id === 'action-button' || artifact.id === 'status-badge';
  const source = `import { LitElement, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { WidgetMixin } from './mixins/WidgetMixin.js';
import { getComponentSharedStyles } from './styles/shared-styles.js';
import styles from './${artifact.tagName}.css.js';
${imports}
${advanced?.imports ?? ''}

export class ${className} extends WidgetMixin(ScopedElementsMixin(LitElement)) {
  static get is() { return '${artifact.tagName}'; }

  static get scopedElements() {
    const classes = [
${registry}
      ...this.configurationScopedElements(),
    ];
    return {
      ...super.scopedElements,
      ...this.scopedElementsFromClasses(classes),
    };
  }

  static get properties() {
    return {
      ...super.properties,
      ${blueprint.propertyName}: { type: String, attribute: '${blueprint.attribute}' },
${artifact.id === 'action-button' ? '      disabled: { type: Boolean, attribute: \'disabled\', reflect: true },\n' : ''}
${isCollection ? "      items: { type: Array, attribute: false },\n      query: { type: String, attribute: 'query' },\n" : ''}
${advanced?.properties ?? ''}
    };
  }

  static get styles() {
    return [styles, getComponentSharedStyles('${artifact.tagName}-shared-styles')];
  }

  constructor() {
    super();
    this.${blueprint.propertyName} = ${JSON.stringify(blueprint.defaultValue)};
${artifact.id === 'action-button' ? '    this.disabled = false;\n' : ''}
${isCollection ? "    this.items = [{ id: 'coffee', name: 'Café' }, { id: 'tea', name: 'Té' }, { id: 'cocoa', name: 'Cacao' }];\n    this.query = '';\n" : ''}
${advanced?.initialize ?? ''}
  }

  handleAction(event) {
    event?.stopPropagation();
${artifact.id === 'action-button' ? '    if (this.disabled) return;\n' : ''}
${artifact.id === 'state-panel' ? "    if (this.state !== 'error') return;\n" : ''}
    this.emitEvent('${blueprint.eventName}', { ${blueprint.propertyName}: this.${blueprint.propertyName} });
  }

${artifact.id === 'state-panel' ? "  get visibleState() { return ['loading', 'empty', 'error', 'success'].includes(this.state) ? this.state : 'loading'; }\n" : ''}${artifact.id === 'search-filter' ? `  handleSubmit(event) { event.preventDefault(); this.handleAction(event); }

  handleInputKeydown(event) {
    if (event.key === 'Enter' && !event.isComposing) this.handleSubmit(event);
  }
` : ''}${artifact.id === 'language-switcher' ? `  chooseLocale(locale) { this.${blueprint.propertyName} = locale; this.handleAction(); }\n` : ''}
${artifact.id === 'product-list' ? `  get visibleItems() {
    const query = String(this.query ?? '').trim().toLocaleLowerCase();
    return (Array.isArray(this.items) ? this.items : []).filter((item) => item && typeof item.name === 'string' && item.name.toLocaleLowerCase().includes(query));
  }

  handleSelection(event, item) {
    event.stopPropagation();
    this.emitEvent('select', { id: item.id, productName: item.name });
  }
` : ''}${artifact.id === 'catalog-shell' ? `  handleSearch(event) {
    event.stopPropagation();
    this.query = String(event.detail.query ?? '').trim();
  }

  resetSearch(event) {
    event.stopPropagation();
    this.query = '';
  }

  handleSelection(event) {
    event.stopPropagation();
    this.emitEvent('select', { id: event.detail.id, productName: event.detail.productName });
  }
` : ''}

  render() {
    return html\`
      ${compact ? markup : `<section class="surface">
        ${dependencyIds.includes('type-text') ? `<academy-type-text as="h2">\${this.t('${prefix}.title')}</academy-type-text>` : `<h2>\${this.t('${prefix}.title')}</h2>`}
        ${markup}
      </section>`}
    \`;
  }
${advanced?.methods ?? ''}
}
`;
  files[sourcePath] = { ...files[sourcePath], content: source };
  files[`src/${artifact.tagName}.scss`] = { ...files[`src/${artifact.tagName}.scss`], content: styles };
  files[`src/${artifact.tagName}.css.js`] = { ...files[`src/${artifact.tagName}.css.js`], content: `import { css } from 'lit';\n\nexport default css\`\n${styles}\n\`;\n` };

  const dependencyCatalogs: Array<Record<string, Record<string, string>>> = [];
  for (const path of Object.keys(files)) {
    if (path.startsWith('src/components/')) delete files[path];
  }
  for (const dependency of dependencyImports) {
    const path = `src/components/${dependency.tag}.js`;
    if (dependency.id === 'type-text') {
      files[path] = { ...base.snapshot.files[path] };
      continue;
    }
    const dependencyWorkspace = createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS[dependency.id]).snapshot;
    dependencyCatalogs.push(JSON.parse(dependencyWorkspace.files['locales/locales.json'].content));
    for (const [childPath, childFile] of Object.entries(dependencyWorkspace.files)) {
      if (!childPath.startsWith('src/')) continue;
      const isRootArtifact = childPath.startsWith(`src/${dependency.tag}.`);
      const target = isRootArtifact ? childPath.replace('src/', 'src/components/') : childPath;
      if (!isRootArtifact && !childPath.startsWith('src/components/')) continue;
      const content = target === path
        ? childFile.content.replaceAll("from './components/", "from './").replaceAll("from './mixins/", "from '../mixins/").replaceAll("from './styles/", "from '../styles/")
        : childFile.content;
      files[target] = { ...childFile, path: target, name: target.split('/').at(-1)!, content };
    }
  }

  const catalog = {
    en: {
      ...Object.assign({}, ...dependencyCatalogs.map((catalog) => catalog.en)),
      ...advanced?.locales?.en,
      [`${prefix}.eyebrow`]: artifact.label,
      [`${prefix}.title`]: blueprint.title.en,
      [`${prefix}.description`]: blueprint.description.en,
      [`${prefix}.action`]: blueprint.action.en,
      [`${prefix}.status`]: artifact.id === 'price-tag' ? 'Tax included' : artifact.id === 'notice-banner' ? 'Notice' : 'Available',
      [`${prefix}.spanish`]: 'Spanish',
      [`${prefix}.english`]: 'English',
      ...(artifact.id === 'state-panel' ? { 'state.panel.loading': 'Loading data', 'state.panel.empty': 'No results', 'state.panel.error': 'We could not load the data', 'state.panel.success': 'Data available' } : {}),
      ...(artifact.id === 'product-list' ? { 'product.list.empty': 'No products match this search.' } : {}),
    },
    es: {
      ...Object.assign({}, ...dependencyCatalogs.map((catalog) => catalog.es)),
      ...advanced?.locales?.es,
      [`${prefix}.eyebrow`]: artifact.label,
      [`${prefix}.title`]: blueprint.title.es,
      [`${prefix}.description`]: blueprint.description.es,
      [`${prefix}.action`]: blueprint.action.es,
      [`${prefix}.status`]: artifact.id === 'price-tag' ? 'Impuestos incluidos' : artifact.id === 'notice-banner' ? 'Aviso' : 'Disponible',
      [`${prefix}.spanish`]: 'Español',
      [`${prefix}.english`]: 'Inglés',
      ...(artifact.id === 'state-panel' ? { 'state.panel.loading': 'Cargando datos', 'state.panel.empty': 'No hay resultados', 'state.panel.error': 'No pudimos cargar los datos', 'state.panel.success': 'Datos disponibles' } : {}),
      ...(artifact.id === 'product-list' ? { 'product.list.empty': 'No hay productos para esta búsqueda.' } : {}),
    },
  };
  for (const path of ['locales/locales.json', 'demo/locales/locales.json', 'test/unit/locales/locales.json']) {
    files[path] = { ...files[path], content: `${JSON.stringify(catalog, null, 2)}\n` };
  }

  files['demo/index.html'] = {
    ...files['demo/index.html'],
    content: `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${artifact.label}</title>
  </head>
  <body>
    <form aria-label="Controles de la demostración" onsubmit="return false">
      <label>
        Valor
        <input id="control-value" value="${blueprint.demoValue}">
      </label>
      <label>
        Idioma
        <select id="locale">
          <option value="es" selected>Español</option>
          <option value="en">English</option>
        </select>
      </label>
    </form>
    ${advanced?.demoControls ?? ''}
    <${artifact.tagName}
      data-cells-demo-subject
      ${blueprint.attribute}="${blueprint.demoValue}"
    ></${artifact.tagName}>
    <output id="event-log"></output>
    <script type="module" src="./demo.js"></script>
  </body>
</html>\n`,
  };
  files['demo/basic.html'] = {
    ...files['demo/basic.html'],
    content: `<!doctype html>
<html lang="es">
  <body>
    <${artifact.tagName}
      ${blueprint.attribute}="${blueprint.defaultValue}"
    ></${artifact.tagName}>
    <script type="module" src="./demo.js"></script>
  </body>
</html>\n`,
  };
  files['demo/demo.js'] = {
    ...files['demo/demo.js'],
    content: `${advanced?.demoImports ?? ''}
import { installIntlMsg } from '../src/runtime/academy-intl-msg.js';
const intlMsg = installIntlMsg({ language: document.documentElement.lang || 'es' });
intlMsg.localesHost = new URL('./locales/locales.json', import.meta.url).href;
void intlMsg.loadUrlResources();
await intlMsg.loadUrlResourcesComplete;
const { ${className} } = await import('../${artifact.tagName}.js');
const subject = document.querySelector('${artifact.tagName}');
const control = document.querySelector('#control-value');
const locale = document.querySelector('#locale');
const eventLog = document.querySelector('#event-log');
control?.addEventListener('input', (event) => { subject.${blueprint.propertyName} = event.target.value;${advanced?.demoControlChanged ? ` ${advanced.demoControlChanged}` : ''} });
locale?.addEventListener('change', async (event) => {
  await intlMsg.setLanguage(event.target.value);
  document.documentElement.lang = event.target.value;
  await subject?.updateComplete;
});
subject?.addEventListener('${artifact.tagName}-${blueprint.eventName}', (event) => { if (eventLog) eventLog.textContent = event.type + ' · ' + JSON.stringify(event.detail); });
export { ${className} };
${advanced?.demoSetup ?? ''}
`,
  };
  files[`test/unit/${artifact.tagName}.test.js`] = {
    ...files[`test/unit/${artifact.tagName}.test.js`],
    content: `import catalogs from './locales/locales.json' with { type: 'json' };
${unitDependencyImports}
import { installIntlMsg } from '../../src/runtime/academy-intl-msg.js';
import { ${className} } from '../../${artifact.tagName}.js';

async function renderComponent() {
  const component = document.createElement('${artifact.tagName}');
  component.${blueprint.propertyName} = ${JSON.stringify(blueprint.demoValue)};
  document.body.replaceChildren(component);
  await component.updateComplete;
  return component;
}

async function activate(component) {
  const directButton = component.shadowRoot.querySelector('button');
  if (directButton) {
    directButton.click();
    return;
  }
  const action = component.shadowRoot.querySelector('academy-action-button');
  if (!action) throw new Error('El componente no expone una acción interactiva.');
  await action.updateComplete;
  action.shadowRoot.querySelector('button').click();
}

describe('${artifact.tagName}', () => {
  beforeEach(async () => {
    const intlMsg = installIntlMsg({ catalogs, language: 'es' });
    await intlMsg.loadUrlResourcesComplete;
  });

  afterEach(() => document.body.replaceChildren());

  it('expone una propiedad configurable y resuelve sus dependencias scoped', async () => {
    const component = await renderComponent();
    expect(component.localName).toBe(${className}.is);
    expect(customElements.get(${className}.is)).toBe(${className});
    expect(${className}.properties.${blueprint.propertyName}.attribute).toBe('${blueprint.attribute}');
${unitDependencyAssertions}
    expect(component.shadowRoot.textContent).toContain(${JSON.stringify(compact ? blueprint.demoValue : blueprint.title.es)});
  });

  it('cambia a inglés sobre el mismo host', async () => {
    const component = await renderComponent();
${artifact.id === 'action-button' ? '    component.label = "";\n' : ''}
    await globalThis.IntlMsg.setLanguage('en');
    await globalThis.IntlMsg.loadUrlResourcesComplete;
    await component.updateComplete;
    expect(component.shadowRoot.textContent).toContain(${JSON.stringify(compact ? blueprint.action.en : blueprint.title.en)});
  });

  it('emite una intención pública completa desde el control visible', async () => {
    const component = await renderComponent();
    const received = new Promise((resolve) => component.addEventListener('${artifact.tagName}-${blueprint.eventName}', resolve, { once: true }));
    await activate(component);
    const event = await received;
    expect(event.detail).toEqual({ ${blueprint.propertyName}: ${JSON.stringify(artifact.id === 'language-switcher' ? 'es' : blueprint.demoValue)} });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.cancelable).toBe(true);
    const programmatic = new Promise((resolve) => component.addEventListener('${artifact.tagName}-${blueprint.eventName}', resolve, { once: true }));
    component.handleAction(${artifact.id === 'language-switcher' ? "new Event('change')" : ''});
    expect((await programmatic).detail).toEqual(event.detail);
  });
${artifact.id === 'language-switcher' ? `
  it('permite elegir inglés con el segundo control sin cambiar el idioma del shell', async () => {
    const component = await renderComponent();
    const action = component.shadowRoot.querySelectorAll('academy-action-button')[1];
    await action.updateComplete;
    const received = new Promise((resolve) => component.addEventListener('academy-language-switcher-change', resolve, { once: true }));
    action.shadowRoot.querySelector('button').click();
    expect((await received).detail).toEqual({ locale: 'en' });
    expect(component.locale).toBe('en');
    expect(globalThis.IntlMsg.lang).toBe('es');
  });
` : ''}
${artifact.id === 'action-button' ? `
  it('sincroniza disabled y no emite acciones mientras está bloqueado', async () => {
    const component = await renderComponent();
    const events = [];
    component.addEventListener('academy-action-button-activate', (event) => events.push(event));
    component.disabled = true;
    await component.updateComplete;
    const button = component.shadowRoot.querySelector('button');
    expect(component.hasAttribute('disabled')).toBe(true);
    expect(button.disabled).toBe(true);
    button.click();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    component.handleAction();
    expect(events.length).toBe(0);
    component.removeAttribute('disabled');
    await component.updateComplete;
    expect(component.disabled).toBe(false);
    expect(button.disabled).toBe(false);
    button.click();
    expect(events.length).toBe(1);
    component.setAttribute('disabled', '');
    await component.updateComplete;
    expect(component.disabled).toBe(true);
    expect(button.disabled).toBe(true);
    button.click();
    expect(events.length).toBe(1);
  });
` : ''}
${artifact.id === 'state-panel' ? `
  it('retira resultados y reintentos al cambiar el estado principal', async () => {
    const component = await renderComponent();
    const retries = [];
    component.addEventListener('academy-state-panel-retry', (event) => retries.push(event));
    for (const state of ['loading', 'empty', 'error', 'success', 'unknown']) {
      component.state = state;
      await component.updateComplete;
      const panel = component.shadowRoot.querySelector('[data-state]');
      const expected = state === 'unknown' ? 'loading' : state;
      expect(panel.getAttribute('data-state')).toBe(expected);
      expect(panel.getAttribute('aria-busy')).toBe(String(expected === 'loading'));
      expect(panel.getAttribute('role')).toBe(expected === 'error' ? 'alert' : 'status');
      expect(Boolean(panel.querySelector('slot'))).toBe(state === 'success');
      expect(Boolean(panel.querySelector('academy-action-button'))).toBe(state === 'error');
      component.handleAction();
    }
    expect(retries.length).toBe(1);
    expect(retries[0].detail).toEqual({ state: 'error' });
  });
` : ''}
${artifact.id === 'search-filter' ? `
  it('envía la consulta por botón y Enter sin duplicar ni interrumpir composición', async () => {
    const component = await renderComponent();
    const queries = [];
    component.addEventListener('academy-search-filter-search', (event) => queries.push(event.detail.query));
    const input = component.shadowRoot.querySelector('input');
    input.value = 'por botón';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await component.updateComplete;
    await activate(component);
    input.value = 'por teclado';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }));
    expect(queries).toEqual(['por botón', 'por teclado']);
  });
` : ''}
${artifact.id === 'product-list' ? `
  it('filtra datos del consumidor y devuelve el identificador de la tarjeta elegida', async () => {
    const component = await renderComponent();
    const products = [{ id: 'a', name: 'Café' }, { id: 'b', name: 'Té' }, { id: 'c', name: 'Té' }];
    component.items = products;
    component.query = ' TÉ ';
    await component.updateComplete;
    const cards = component.shadowRoot.querySelectorAll('academy-product-card');
    expect(cards.length).toBe(2);
    const received = new Promise((resolve) => component.addEventListener('academy-product-list-select', resolve, { once: true }));
    await cards[1].updateComplete;
    await activate(cards[1]);
    const event = await received;
    expect(event.detail).toEqual({ id: 'c', productName: 'Té' });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    component.query = 'sin coincidencias';
    await component.updateComplete;
    expect(component.shadowRoot.querySelectorAll('academy-product-card').length).toBe(0);
    expect(component.shadowRoot.textContent).toContain('No hay productos para esta búsqueda.');
    expect(component.items).toBe(products);
    expect(products.length).toBe(3);
    component.query = null;
    component.items = [...JSON.parse('[null, { "id": "invalid", "name": 42 }]'), products[0]];
    await component.updateComplete;
    expect(component.shadowRoot.querySelectorAll('academy-product-card').length).toBe(1);
    component.items = null;
    await component.updateComplete;
    expect(component.shadowRoot.querySelectorAll('academy-product-card').length).toBe(0);
    expect(component.shadowRoot.textContent).toContain('No hay productos para esta búsqueda.');
  });
` : ''}
${artifact.id === 'catalog-shell' ? `
  it('conecta búsqueda y limpieza con la lista sin modificar los productos', async () => {
    const component = await renderComponent();
    component.items = [{ id: 'first', name: 'Café' }, { id: 'second', name: 'Té' }];
    await component.updateComplete;
    const search = component.shadowRoot.querySelector('academy-search-filter');
    await search.updateComplete;
    const input = search.shadowRoot.querySelector('input');
    input.value = 'TÉ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await search.updateComplete;
    await activate(search);
    await component.updateComplete;
    const list = component.shadowRoot.querySelector('academy-product-list');
    await list.updateComplete;
    expect(list.items).toBe(component.items);
    expect(list.shadowRoot.querySelectorAll('academy-product-card').length).toBe(1);
    const card = list.shadowRoot.querySelector('academy-product-card');
    await card.updateComplete;
    const selected = new Promise((resolve) => component.addEventListener('academy-catalog-shell-select', resolve, { once: true }));
    await activate(card);
    const selection = await selected;
    expect(selection.detail).toEqual({ id: 'second', productName: 'Té' });
    expect(selection.bubbles).toBe(true);
    expect(selection.composed).toBe(true);
    await activate(list);
    await component.updateComplete;
    await search.updateComplete;
    await list.updateComplete;
    expect(input.value).toBe('');
    expect(list.shadowRoot.querySelectorAll('academy-product-card').length).toBe(2);
    expect(component.items.length).toBe(2);
    search.dispatchEvent(new CustomEvent('academy-search-filter-search', { detail: {}, bubbles: true, composed: true }));
    await component.updateComplete;
    expect(component.query).toBe('');
  });
` : ''}
${advanced?.tests ?? ''}
});
`,
  };
  files['custom-elements.json'] = {
    ...files['custom-elements.json'],
    content: `${JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [{
        kind: 'javascript-module',
        path: sourcePath,
        declarations: [{
          kind: 'class',
          name: className,
          tagName: artifact.tagName,
          description: blueprint.description.es,
          members: [
            { kind: 'field', name: blueprint.propertyName, attribute: blueprint.attribute, type: { text: artifact.id === 'state-panel' ? "'error' | 'loading' | 'empty' | 'success'" : 'string' }, default: JSON.stringify(blueprint.defaultValue), description: blueprint.description.es },
            ...(artifact.id === 'action-button' ? [{ kind: 'field', name: 'disabled', attribute: 'disabled', type: { text: 'boolean' }, default: 'false', reflects: true, description: 'Bloquea la interacción y la emisión de acciones.' }] : []),
            ...(isCollection ? [
              { kind: 'field', name: 'items', type: { text: 'Array<{ id: string, name: string }>' }, description: 'Productos del consumidor; se asignan como propiedad, no como atributo.' },
              { kind: 'field', name: 'query', attribute: 'query', type: { text: 'string' }, default: '""', description: 'Filtro por nombre sin distinguir mayúsculas y sin modificar items.' },
            ] : []),
            ...advanced?.members ?? [],
          ],
          events: [
            { name: `${artifact.tagName}-${blueprint.eventName}`, type: { text: `CustomEvent<{ ${blueprint.propertyName}: string }>` }, description: blueprint.action.es },
            ...(isCollection ? [{ name: `${artifact.tagName}-select`, type: { text: 'CustomEvent<{ id: string, productName: string }>' }, description: 'Selecciona el producto concreto, incluso si comparte nombre con otro.' }] : []),
            ...advanced?.events ?? [],
          ],
          slots: artifact.id === 'action-button' ? [{ name: '', description: 'Etiqueta alternativa a la propiedad label.' }] : artifact.id === 'state-panel' ? [{ name: '', description: 'Contenido del consumidor, visible únicamente en success.' }] : [],
          cssProperties: [
            { name: `--${artifact.id}-accent`, default: blueprint.accent, description: 'Acento visual público; tiene prioridad sobre el acento ambiental.' },
            ...['surface', 'foreground', 'muted-surface', 'border', 'accent', 'action-background', 'action-foreground', 'focus'].map((token) => ({ name: `--academy-${token}`, description: 'Token ambiental heredable para la composición del curso.' })),
            ...advanced?.cssProperties ?? [],
          ],
        }],
        exports: [{ kind: 'custom-element-definition', name: artifact.tagName, declaration: { name: className, module: sourcePath } }],
      }],
    }, null, 2)}\n`,
  };
  // Keep the source contract discoverable when the CLI regenerates the manifest.
  const publicApi = JSON.parse(files['custom-elements.json'].content).modules[0].declarations[0] as {
    description: string;
    members: Array<{ name: string; attribute?: string; type: { text: string }; description: string }>;
    events: Array<{ name: string; type: { text: string }; description: string }>;
    slots: Array<{ name: string; description: string }>;
    cssProperties: Array<{ name: string; description: string }>;
  };
  const apiDocumentation = [
    '/**',
    ` * ${publicApi.description}`,
    ` * @tag ${artifact.tagName}`,
    ...publicApi.members.flatMap((member) => [
      ` * @property {${member.type.text}} ${member.name} - ${member.description}`,
      ...(member.attribute ? [` * @attribute {${member.type.text}} ${member.attribute} - ${member.description}`] : []),
    ]),
    ...publicApi.events.map((event) => ` * @fires {${event.type.text}} ${event.name} - ${event.description}`),
    ...publicApi.slots.map((slot) => ` * @slot ${slot.name} - ${slot.description}`),
    ...publicApi.cssProperties.map((property) => ` * @cssprop ${property.name} - ${property.description}`),
    ' */',
  ].join('\n');
  files[sourcePath].content = files[sourcePath].content.replace(`export class ${className}`, `${apiDocumentation}\nexport class ${className}`);
  files['README.md'] = {
    ...files['README.md'],
    content: `# ${artifact.tagName}\n\n${blueprint.description.es}\n\n## Evento\n\n\`${artifact.tagName}-${blueprint.eventName}\` comunica \`${blueprint.propertyName}\`.\n${artifact.id === 'action-button' ? '\n## Contrato público\n\n`label` configura el texto; el slot por defecto permite sustituirlo. `disabled` es una propiedad Boolean reflejada en el atributo homónimo. Su presencia bloquea el botón nativo y evita emitir acciones, también por teclado. Elimina el atributo o asigna `false` a la propiedad para habilitarlo; `disabled="false"` sigue siendo un atributo presente.\n' : ''}\n- \`cells component:dev\`\n- \`cells component:test\`\n- \`cells component:documentation\`\n`,
  };
  if (artifact.id === 'state-panel') {
    files['README.md'].content += '\n## Estados y recuperación\n\n`state` acepta `loading`, `empty`, `error` o `success`. Una entrada desconocida muestra carga como salida segura. Solo `success` muestra el contenido del slot; los otros estados lo retiran. Solo `error` ofrece reintentar y emite `academy-state-panel-retry` con `{ state: "error" }`. El consumidor inicia la petición y actualiza la propiedad; el panel no realiza llamadas de red ni modifica el estado por su cuenta.\n';
    for (const state of ['loading', 'empty', 'error', 'success']) {
      const path = `demo/${state}.html`;
      files[path] = {
        path, name: `${state}.html`, language: 'html',
        content: `<!doctype html>\n<html lang="es"><head><title>Estado ${state}</title></head><body><${artifact.tagName} state="${state}"></${artifact.tagName}><script type="module" src="./demo.js"></script></body></html>\n`,
      };
    }
  }
  if (isCollection) {
    files['README.md'].content += '\n## Datos y selección\n\nAsigna `items` como un array de `{ id, name }` y `query` como texto. El filtro ignora mayúsculas y espacios exteriores, conserva el array original y muestra un mensaje cuando no hay coincidencias. Cada selección emite `select` con `{ id, productName }`, no solo el nombre: dos productos pueden llamarse igual.\n';
    files['README.md'].content += artifact.id === 'catalog-shell'
      ? '\nEl catálogo entrega propiedades a la búsqueda y la lista. Recibe sus eventos públicos, actualiza `query` y reemite la selección desde su propio host. “Mostrar todos” limpia el filtro y sincroniza el campo de búsqueda. No consulta el Shadow DOM de sus hijos ni necesita un data manager.\n'
      : '\nEl evento `filter` solicita mostrar todos; el consumidor puede responder asignando `query = ""`. La lista recibe datos, no realiza peticiones.\n';
  }
  if (artifact.id === 'search-filter') {
    files['README.md'].content += '\n## Envío accesible\n\nLa búsqueda reutiliza el botón scoped del curso. Clic y Enter emiten una sola consulta con el texto actual; Enter durante composición de texto no envía. La búsqueda no decide qué resultados mostrar: esa responsabilidad pertenece al consumidor.\n';
  }
  const manifest = JSON.parse(files['package.json'].content);
  files['README.md'].content += advanced?.readme ?? '';
  for (const [path, content] of Object.entries(advanced?.files ?? {})) {
    files[path] = { path, name: path.split('/').at(-1)!, content, language: path.endsWith('.ts') ? 'typescript' : path.endsWith('.json') ? 'json' : 'javascript' };
  }
  manifest.dependencies = { ...manifest.dependencies, ...advanced?.dependencies };
  manifest.devDependencies = { ...manifest.devDependencies, ...advanced?.devDependencies };
  manifest.learningArtifact = artifact.id;
  manifest.learningDependencies = artifact.dependencies;
  files['package.json'] = { ...files['package.json'], content: `${JSON.stringify(manifest, null, 2)}\n` };
  const snapshot = { ...base.snapshot, files, activeFilePath: sourcePath };
  return createVersionedCellsWorkspace(snapshot, 0);
}

export function createCellsCurriculumPracticeWorkspace(
  artifact: OpenCellsArtifact,
  stage: CellsComponentPracticeStage = 'composition',
): VersionedCellsWorkspace {
  const complete = createCellsCurriculumComponentWorkspace(artifact);
  if (artifact.id === 'account-detail') return createCellsAccountFeaturePractice(complete);
  const blueprint = BLUEPRINTS[artifact.id];
  if (!blueprint) throw new Error(`No existe práctica visual para ${artifact.id}.`);
  const sourcePath = `src/${artifact.tagName}.js`;

  if (stage === 'scaffold') {
    const manifest = JSON.parse(complete.snapshot.files['package.json'].content);
    delete manifest.exports;
    delete manifest.scripts.documentation;
    const changed = writeCellsFile(complete, 'package.json', `${JSON.stringify(manifest, null, 2)}\n`);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: 'package.json' }, 0);
  }

  if (stage === 'api') {
    const source = complete.snapshot.files[sourcePath].content
      .replace(
        `      ${blueprint.propertyName}: { type: String, attribute: '${blueprint.attribute}' },`,
        `    // TODO: declara ${blueprint.propertyName} como propiedad String y atributo ${blueprint.attribute}.`,
      )
      .replace(
        `    this.emitEvent('${blueprint.eventName}', { ${blueprint.propertyName}: this.${blueprint.propertyName} });`,
        `    // TODO: publica la intención con el valor actual de ${blueprint.propertyName}.`,
      );
    return createVersionedCellsWorkspace(writeCellsFile(complete, sourcePath, source).snapshot, 0);
  }

  if (stage === 'composition') {
    const dependencyId = artifact.dependencies[0] ?? 'type-text';
    const dependencyTag = dependencyId === 'type-text' ? 'academy-type-text' : `academy-${dependencyId}`;
    const dependencyClass = classNameFor(dependencyTag);
    const source = complete.snapshot.files[sourcePath].content
      .replace(
        `      ${dependencyClass},`,
        `      // TODO: registra ${dependencyTag}; la clase ya está importada.`,
      )
      .replace(
        `    this.emitEvent('${blueprint.eventName}', { ${blueprint.propertyName}: this.${blueprint.propertyName} });`,
        `    // TODO: comunica la acción pública con ${blueprint.propertyName}.`,
      );
    return createVersionedCellsWorkspace(writeCellsFile(complete, sourcePath, source).snapshot, 0);
  }

  if (stage === 'styles') {
    const stylePath = `src/${artifact.tagName}.css.js`;
    const staleRuntimeStyle = `import { css } from 'lit';\n\nexport default css\`:host { display: block; }\`;\n`;
    const changed = writeCellsFile(complete, stylePath, staleRuntimeStyle);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: stylePath }, 0);
  }

  if (stage === 'i18n') {
    const localePath = 'locales/locales.json';
    const catalog = JSON.parse(complete.snapshot.files[localePath].content);
    const prefix = artifact.id.replaceAll('-', '.');
    delete catalog.en[`${prefix}.action`];
    catalog.es[`${prefix}.title`] = `Valor: \${dato}`;
    const changed = writeCellsFile(complete, localePath, `${JSON.stringify(catalog, null, 2)}\n`);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: localePath }, 0);
  }

  if (stage === 'demo') {
    const demoPath = 'demo/demo.js';
    const className = classNameFor(artifact.tagName);
    const controller = complete.snapshot.files[demoPath].content
      .replace(`const { ${className} } = await import('../${artifact.tagName}.js');`, `const { ${className} } = await import('../src/${artifact.tagName}.js');`)
      .replace(
        `control?.addEventListener('input', (event) => { subject.${blueprint.propertyName} = event.target.value; });`,
        `control?.addEventListener('input', () => {\n  // TODO: conecta el valor del control con ${blueprint.propertyName}.\n});`,
      );
    const changed = writeCellsFile(complete, demoPath, controller);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: demoPath }, 0);
  }

  if (stage === 'tests') {
    const testPath = `test/unit/${artifact.tagName}.test.js`;
    const testSource = complete.snapshot.files[testPath].content
      .replace('    expect(event.composed).toBe(true);', '    // TODO: comprueba que el evento cruza el límite del Shadow DOM.');
    const changed = writeCellsFile(complete, testPath, testSource);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: testPath }, 0);
  }

  const metadata = JSON.parse(complete.snapshot.files['custom-elements.json'].content);
  metadata.modules[0].declarations[0].tagName = 'academy-componente-incompleto';
  const withMetadata = writeCellsFile(complete, 'custom-elements.json', `${JSON.stringify(metadata, null, 2)}\n`);
  const changed = writeCellsFile(
    withMetadata,
    'README.md',
    `# ${artifact.tagName}\n\nTODO: documenta su propiedad, evento público, demo y comandos Cells.\n`,
  );
  return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: 'custom-elements.json' }, 0);
}
