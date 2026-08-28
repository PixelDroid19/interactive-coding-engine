import type { OpenCellsArtifact } from '../../curriculum/open-cells/lessonProjects';
import type { WorkspaceFile } from '../../types/scrim';
import { createCellsComponentWorkspace, type CellsComponentPracticeStage } from './cellsRecipes';
import { createVersionedCellsWorkspace, type VersionedCellsWorkspace, writeCellsFile } from './cellsVirtualFileSystem';

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
  'action-button': blueprint('label', 'label', 'Continuar', 'Guardar', 'activate', '#2563eb', 'Reusable action', 'Acción reutilizable', 'One button, one public intention.', 'Un botón, una intención pública.', 'Activate', 'Activar'),
  'status-badge': blueprint('status', 'status', 'Disponible', 'Sin conexión', 'inspect', '#059669', 'Observable status', 'Estado observable', 'Color and text describe the same state.', 'Color y texto describen el mismo estado.', 'Inspect', 'Inspeccionar'),
  'state-panel': blueprint('state', 'state', 'loading', 'error', 'retry', '#d97706', 'Request states', 'Estados de una petición', 'Loading, empty, error and success cannot overlap.', 'Loading, empty, error y success no se mezclan.', 'Retry', 'Reintentar'),
  'product-card': blueprint('productName', 'product-name', 'Café de origen', 'Té verde', 'select', '#7c3aed', 'A reusable product', 'Un producto reutilizable', 'The card presents data and returns a selection.', 'La tarjeta presenta datos y devuelve una selección.', 'View detail', 'Ver detalle'),
  'user-summary': blueprint('userName', 'user-name', 'Ada', 'Lina', 'open', '#0891b2', 'User summary', 'Resumen de usuario', 'A small public API keeps private layout replaceable.', 'Una API pequeña permite cambiar el diseño interno.', 'Open profile', 'Abrir perfil'),
  'notice-banner': blueprint('message', 'message', 'Todo está sincronizado', 'No pudimos cargar los datos', 'dismiss', '#dc2626', 'Recoverable notice', 'Aviso recuperable', 'The message explains the state and offers one action.', 'El mensaje explica el estado y ofrece una acción.', 'Dismiss', 'Descartar'),
  'product-list': blueprint('category', 'category', 'Bebidas', 'Favoritos', 'filter', '#4f46e5', 'Product collection', 'Colección de productos', 'The list composes cards without copying their implementation.', 'La lista compone tarjetas sin copiar su implementación.', 'Filter list', 'Filtrar lista'),
  'price-tag': blueprint('price', 'price', '12,00 €', '19,90 €', 'explain', '#be123c', 'Formatted price', 'Precio formateado', 'Formatting remains inside a reusable visual contract.', 'El formato permanece dentro de un contrato visual reutilizable.', 'Explain price', 'Explicar precio'),
  'search-filter': blueprint('query', 'query', 'café', 'té', 'search', '#0f766e', 'Catalog search', 'Búsqueda del catálogo', 'The filter emits a query; it does not own the results.', 'El filtro emite una consulta; no es dueño de los resultados.', 'Search', 'Buscar'),
  'language-switcher': blueprint('locale', 'locale', 'es', 'en', 'change', '#9333ea', 'Language selector', 'Selector de idioma', 'The shell owns the locale and components consume it.', 'El shell posee el idioma y los componentes lo consumen.', 'Change language', 'Cambiar idioma'),
  'catalog-shell': blueprint('section', 'section', 'Destacados', 'Novedades', 'navigate', '#0f766e', 'Catalog composition', 'Composición del catálogo', 'Filter, list and notices collaborate through public contracts.', 'Filtro, lista y avisos colaboran mediante contratos públicos.', 'Open section', 'Abrir sección'),
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

function localDependencySource(tagName: string, accent: string): string {
  const className = classNameFor(tagName);
  const dependency = BLUEPRINTS[tagName.replace(/^academy-/, '')];
  const propertyName = dependency?.propertyName ?? 'value';
  const attribute = dependency?.attribute ?? 'value';
  const defaultValue = dependency?.defaultValue ?? '';
  const eventName = dependency?.eventName ?? 'activate';
  const isButton = tagName.includes('button');
  return `import { LitElement, css, html } from 'lit';

export class ${className} extends LitElement {
  static properties = { ${propertyName}: { type: String, attribute: '${attribute}' } };
  static styles = css\`
    :host { display: inline-flex; }
    button, span, article { border: 1px solid ${accent}; border-radius: 999px; padding: .55rem .85rem; background: #fff; color: #172033; font: 700 .78rem/1 system-ui, sans-serif; }
    button { cursor: pointer; box-shadow: 0 .2rem 0 ${accent}; }
  \`;
  ${propertyName} = ${JSON.stringify(defaultValue)};
  handleAction() { this.dispatchEvent(new CustomEvent('${tagName}-${eventName}', { detail: { ${propertyName}: this.${propertyName} }, bubbles: true, composed: true })); }
  render() { return ${isButton
    ? `html\`<button type="button" @click=\${this.handleAction}><slot>\${this.${propertyName}}</slot></button>\``
    : tagName.includes('product-card')
      ? `html\`<article><slot>\${this.${propertyName}}</slot></article>\``
      : `html\`<span><slot>\${this.${propertyName}}</slot></span>\``}; }
}
`;
}

function renderMarkup(artifact: OpenCellsArtifact, blueprint: ComponentBlueprint, prefix: string): string {
  const value = `\${this.${blueprint.propertyName}}`;
  const translated = (key: string) => `\${this.t('${prefix}.${key}')}`;
  const action = `@click=\${this.handleAction}`;
  const dependency = (id: string) => `academy-${id}`;
  switch (artifact.id) {
    case 'action-button':
      return `<div class="action-stage">
          <academy-type-text as="h2">${translated('title')}</academy-type-text>
          <button class="primary-action" ${action}>${value}</button>
        </div>`;
    case 'status-badge':
      return `<div class="status-stage" ${action}>
          <span class="status-dot"></span>
          <strong>${value}</strong>
          <small>${translated('action')}</small>
        </div>`;
    case 'state-panel':
      return `<div class="state-grid">
          <academy-status-badge .status=\${this.state}></academy-status-badge>
          <strong>${value}</strong>
          <p>${translated('description')}</p>
          <academy-action-button
            .label=\${this.t('${prefix}.action')}
            ${action}
          ></academy-action-button>
        </div>`;
    case 'product-card':
      return `<article class="product-card">
          <academy-status-badge status="Disponible"></academy-status-badge>
          <h2>${value}</h2>
          <p>${translated('description')}</p>
          <academy-action-button
            .label=\${this.t('${prefix}.action')}
            ${action}
          ></academy-action-button>
        </article>`;
    case 'user-summary':
      return `<div class="profile">
          <div class="avatar">${'\${this.userName.slice(0, 1)}'}</div>
          <div>
            <h2>${value}</h2>
            <p>${translated('description')}</p>
          </div>
          <academy-status-badge status="Activo"></academy-status-badge>
        </div>`;
    case 'notice-banner':
      return `<aside class="notice" role="status">
          <academy-status-badge status="Aviso"></academy-status-badge>
          <p>${value}</p>
          <academy-action-button
            .label=\${this.t('${prefix}.action')}
            ${action}
          ></academy-action-button>
        </aside>`;
    case 'product-list':
      return `<section class="collection">
          <header>
            <h2>${value}</h2>
            <academy-action-button .label=\${this.t('${prefix}.action')} ${action}></academy-action-button>
          </header>
          <div class="product-grid">
            <academy-product-card product-name="Café"></academy-product-card>
            <academy-product-card product-name="Té"></academy-product-card>
            <academy-product-card product-name="Cacao"></academy-product-card>
          </div>
        </section>`;
    case 'price-tag':
      return `<div class="price" ${action}>
          <small>${translated('title')}</small>
          <strong>${value}</strong>
          <academy-status-badge status="IVA incluido"></academy-status-badge>
        </div>`;
    case 'search-filter':
      return `<form class="search" @submit=\${this.handleSubmit}>
          <label>
            ${translated('title')}
            <input
              .value=\${this.query}
              @input=\${(event) => { this.query = event.target.value; }}
            >
          </label>
          <academy-action-button .label=\${this.t('${prefix}.action')}></academy-action-button>
        </form>`;
    case 'language-switcher':
      return `<div class="language">
          <academy-type-text as="h2">${translated('title')}</academy-type-text>
          <button class=\${this.locale === 'es' ? 'active' : ''} @click=\${() => this.chooseLocale('es')}>ES</button>
          <button class=\${this.locale === 'en' ? 'active' : ''} @click=\${() => this.chooseLocale('en')}>EN</button>
        </div>`;
    case 'catalog-shell':
      return `<main class="catalog">
          <academy-search-filter .query=\${this.section}></academy-search-filter>
          <academy-notice-banner .message=\${this.t('${prefix}.description')}></academy-notice-banner>
          <academy-product-list .category=\${this.section}></academy-product-list>
        </main>`;
    default:
      return `<div><${dependency('type-text')}>${translated('title')}</${dependency('type-text')}></div>`;
  }
}

function componentStyles(artifact: OpenCellsArtifact, blueprint: ComponentBlueprint): string {
  const layout = artifact.id === 'product-list' || artifact.id === 'catalog-shell' ? 'min(52rem, 100%)' : 'min(34rem, 100%)';
  return `:host {
  display: block;
  width: ${layout};
  color: #172033;
  font-family: system-ui, sans-serif;
}

.surface {
  display: grid;
  gap: 1rem;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid color-mix(in srgb, ${blueprint.accent} 42%, #dbe3ef);
  border-radius: 1.35rem;
  background: linear-gradient(145deg, #ffffff, color-mix(in srgb, ${blueprint.accent} 8%, #f8fafc));
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 12%);
}

.eyebrow { margin: 0; color: ${blueprint.accent}; font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.primary-action, .language button { border: 0; border-radius: 999px; padding: .85rem 1.2rem; background: ${blueprint.accent}; color: white; font-weight: 800; cursor: pointer; }
.status-stage, .profile, .notice, .price, .collection header, .language { display: flex; align-items: center; gap: .8rem; flex-wrap: wrap; }
.status-stage, .notice, .price { border-left: .35rem solid ${blueprint.accent}; padding: 1rem; background: #f8fafc; }
.status-dot { width: .75rem; height: .75rem; border-radius: 50%; background: ${blueprint.accent}; }
.state-grid, .product-card { display: grid; gap: 1rem; }
.avatar { display: grid; width: 3rem; height: 3rem; place-items: center; border-radius: 50%; background: ${blueprint.accent}; color: white; font-size: 1.25rem; font-weight: 900; }
.collection { display: grid; gap: 1rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .8rem; }
.search { display: flex; align-items: end; gap: .8rem; }
.search label { display: grid; flex: 1; gap: .35rem; }
.search input { min-height: 2.65rem; border: 1px solid #94a3b8; border-radius: .6rem; padding: 0 .75rem; }
.language button.active { outline: 3px solid color-mix(in srgb, ${blueprint.accent} 35%, white); }
.catalog { display: grid; gap: 1rem; }
`;
}

export function createCellsCurriculumComponentWorkspace(artifact: OpenCellsArtifact): VersionedCellsWorkspace {
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
  const registry = dependencyImports.map((dependency) => `      '${dependency.tag}': ${dependency.className},`).join('\n');
  const markup = renderMarkup(artifact, blueprint, prefix);
  const styles = componentStyles(artifact, blueprint);
  const source = `import { LitElement, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { WidgetMixin } from './mixins/WidgetMixin.js';
import styles from './${artifact.tagName}.css.js';
${imports}

export class ${className} extends WidgetMixin(ScopedElementsMixin(LitElement)) {
  static get scopedElements() {
    return {
${registry}
    };
  }

  static properties = {
    ${blueprint.propertyName}: { type: String, attribute: '${blueprint.attribute}' },
  };

  static styles = styles;
  ${blueprint.propertyName} = ${JSON.stringify(blueprint.defaultValue)};

  handleAction() {
    this.emitEvent('${blueprint.eventName}', { ${blueprint.propertyName}: this.${blueprint.propertyName} });
  }

  handleSubmit(event) { event.preventDefault(); this.handleAction(); }
  chooseLocale(locale) { this.${blueprint.propertyName} = locale; this.handleAction(); }

  render() {
    return html\`
      <section class="surface">
        <p class="eyebrow">\${this.t('${prefix}.eyebrow')}</p>
        ${markup}
      </section>
    \`;
  }
}
`;
  files[sourcePath] = { ...files[sourcePath], content: source };
  files[`src/${artifact.tagName}.scss`] = { ...files[`src/${artifact.tagName}.scss`], content: styles };
  files[`src/${artifact.tagName}.css.js`] = { ...files[`src/${artifact.tagName}.css.js`], content: `import { css } from 'lit';\n\nexport default css\`\n${styles}\n\`;\n` };

  for (const dependency of dependencyImports) {
    const path = `src/components/${dependency.tag}.js`;
    files[path] = {
      path,
      name: `${dependency.tag}.js`,
      language: 'javascript',
      content: dependency.tag === 'academy-type-text' && files[path]
        ? files[path].content
        : localDependencySource(dependency.tag, BLUEPRINTS[dependency.id]?.accent ?? blueprint.accent),
    };
  }

  const catalog = {
    en: {
      [`${prefix}.eyebrow`]: artifact.label,
      [`${prefix}.title`]: blueprint.title.en,
      [`${prefix}.description`]: blueprint.description.en,
      [`${prefix}.action`]: blueprint.action.en,
    },
    es: {
      [`${prefix}.eyebrow`]: artifact.label,
      [`${prefix}.title`]: blueprint.title.es,
      [`${prefix}.description`]: blueprint.description.es,
      [`${prefix}.action`]: blueprint.action.es,
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
    <label>
      Valor
      <input id="control-value" value="${blueprint.demoValue}">
    </label>
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
    content: `import { ${className} } from '../${artifact.tagName}.js';
export { ${className} };
const subject = document.querySelector('${artifact.tagName}');
const control = document.querySelector('#control-value');
const eventLog = document.querySelector('#event-log');
control?.addEventListener('input', (event) => { subject.${blueprint.propertyName} = event.target.value; });
subject?.addEventListener('${artifact.tagName}-${blueprint.eventName}', (event) => { if (eventLog) eventLog.textContent = event.type + ' · ' + JSON.stringify(event.detail); });
`,
  };
  files[`test/unit/${artifact.tagName}.test.js`] = {
    ...files[`test/unit/${artifact.tagName}.test.js`],
    content: `import { ${className} } from '../../${artifact.tagName}.js';
describe('${artifact.tagName}', () => {
  it('expone una propiedad configurable', () => { expect(${className}.properties.${blueprint.propertyName}.attribute).toBe('${blueprint.attribute}'); });
  it('emite una intención pública completa', async () => {
    const element = new ${className}();
    element.${blueprint.propertyName} = ${JSON.stringify(blueprint.demoValue)};
    const received = new Promise((resolve) => element.addEventListener('${artifact.tagName}-${blueprint.eventName}', resolve, { once: true }));
    element.handleAction();
    const event = await received;
    expect(event.detail).toEqual({ ${blueprint.propertyName}: ${JSON.stringify(blueprint.demoValue)} });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
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
          members: [{ kind: 'field', name: blueprint.propertyName, attribute: blueprint.attribute, type: { text: 'string' }, default: JSON.stringify(blueprint.defaultValue), description: blueprint.description.es }],
          events: [{ name: `${artifact.tagName}-${blueprint.eventName}`, type: { text: `CustomEvent<{ ${blueprint.propertyName}: string }>` }, description: blueprint.action.es }],
          slots: [],
          cssProperties: [{ name: `--${artifact.id}-accent`, default: blueprint.accent, description: 'Acento visual público.' }],
        }],
        exports: [{ kind: 'custom-element-definition', name: artifact.tagName, declaration: { name: className, module: sourcePath } }],
      }],
    }, null, 2)}\n`,
  };
  files['README.md'] = {
    ...files['README.md'],
    content: `# ${artifact.tagName}\n\n${blueprint.description.es}\n\n## Evento\n\n\`${artifact.tagName}-${blueprint.eventName}\` comunica \`${blueprint.propertyName}\`.\n\n- \`cells component:dev\`\n- \`cells component:test\`\n- \`cells component:documentation\`\n`,
  };
  const manifest = JSON.parse(files['package.json'].content);
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
        `    ${blueprint.propertyName}: { type: String, attribute: '${blueprint.attribute}' },`,
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
        `      '${dependencyTag}': ${dependencyClass},`,
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
      .replace(`import { ${className} } from '../${artifact.tagName}.js';`, `import { ${className} } from '../src/${artifact.tagName}.js';`)
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
