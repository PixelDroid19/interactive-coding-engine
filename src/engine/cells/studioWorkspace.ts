import { createVersionedCellsWorkspace, type VersionedCellsWorkspace } from './cellsVirtualFileSystem';

const translations = {
  es: {
    'app.title': 'Estudio Cells', 'home.eyebrow': 'CREA / PRUEBA / APRENDE',
    'home.title': 'Estudio Cells', 'home.description': 'Un espacio para construir, explorar y entender cómo funciona una aplicación.',
    'home.productLabel': 'Proyecto de práctica', 'home.viewDetail': 'Abrir proyecto', 'home.favorites': 'Guardados',
    'favorites.kicker': 'Tu biblioteca', 'favorites.title': 'Proyectos guardados',
    'search.title': 'Encuentra tu próximo proyecto', 'search.label': 'Buscar por nombre', 'search.results': 'proyectos',
    'detail.kicker': 'Dentro del proyecto', 'detail.title': 'Exploración',
    'detail.description': 'Esta vista recibe el identificador del proyecto. Vuelve al estudio para seguir experimentando con las páginas.',
    'detail.back': 'Volver al estudio', 'studio.generic': 'Explora sus componentes, recorre las páginas y observa sus conexiones.',
    'studio.museum': 'Una colección de ideas. Explora las piezas y las conexiones entre sus páginas.',
    'studio.climate': 'Datos que cuentan una historia. Experimenta con estados, vistas y componentes.',
    'studio.empty': 'No encontramos proyectos con ese nombre. Prueba con Museo o Clima.',
  },
  en: {
    'app.title': 'Cells Studio', 'home.eyebrow': 'BUILD / TEST / LEARN',
    'home.title': 'Cells Studio', 'home.description': 'A space to build, explore and understand how an application works.',
    'home.productLabel': 'Practice project', 'home.viewDetail': 'Open project', 'home.favorites': 'Saved',
    'favorites.kicker': 'Your library', 'favorites.title': 'Saved projects',
    'search.title': 'Find your next project', 'search.label': 'Search by name', 'search.results': 'projects',
    'detail.kicker': 'Inside the project', 'detail.title': 'Exploration',
    'detail.description': 'This view receives the project identifier. Return to the studio to keep experimenting with pages.',
    'detail.back': 'Back to studio', 'studio.generic': 'Explore its components, visit its pages and observe their connections.',
    'studio.museum': 'A collection of ideas. Explore the pieces and the connections between their pages.',
    'studio.climate': 'Data that tells a story. Experiment with states, views and components.',
    'studio.empty': 'No projects match that name. Try Museo or Clima.',
  },
};

const baseStyles = `
:host { display: block; min-height: 100vh; background: #f5f2eb; color: #242520; font-family: 'Outfit', 'Trebuchet MS', sans-serif; }
main { box-sizing: border-box; width: min(1180px, 100%); margin: 0 auto; padding: 36px 40px 56px; }
h1, h2, p { margin: 0; }
h1, h2 { font-family: 'Space Grotesk', 'Trebuchet MS', sans-serif; letter-spacing: -.045em; }
h1 { font-size: clamp(30px, 4vw, 46px); line-height: 1.08; }
p { line-height: 1.65; }
button { box-sizing: border-box; min-height: 44px; padding: 10px 18px; border: 1.5px solid #242520; border-radius: 0; background: #fffdf7; color: inherit; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
button:hover { background: #ffe600; }
:focus-visible { outline: 3px solid #2455b5; outline-offset: 4px; }
.shelf, .results, .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.shelf, .results { margin-top: 28px; }
main > button { margin-bottom: 28px; }
label { display: grid; gap: 10px; margin-top: 28px; font-size: 14px; font-weight: 700; }
input { box-sizing: border-box; width: 100%; min-height: 48px; padding: 12px; border: 1.5px solid #242520; border-radius: 0; background: #fffdf7; color: inherit; font: inherit; }
@media (max-width: 700px) { main { padding: 24px 20px 40px; } .shelf, .results, .grid { grid-template-columns: 1fr; } }
`;

const homeStyles = baseStyles + `
header { display: grid; grid-template-columns: 1fr auto; gap: 16px 24px; padding-bottom: 28px; margin-bottom: 28px; border-bottom: 2px solid #242520; }
.eyebrow { grid-column: 1; font: 700 11px/1.5 monospace; letter-spacing: .13em; }
.eyebrow::before { content: 'C'; display: inline-grid; place-items: center; width: 26px; height: 26px; margin-right: 12px; border: 1.5px solid #242520; background: #ffe600; font: 900 20px/1 'Trebuchet MS', sans-serif; vertical-align: middle; }
header h1 { grid-column: 1 / -1; }
header > p { grid-column: 1 / -1; max-width: 62ch; color: #62635b; font-size: 15px; }
nav { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
nav button { min-height: 40px; padding: 8px 16px; }
.language { grid-column: 2; grid-row: 1; display: flex; align-items: center; gap: 4px; }
.language span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.language button { min-height: 36px; padding: 6px 10px; border-color: transparent; background: transparent; font-size: 12px; }
.language button[aria-pressed='true'] { border-color: #242520; background: #fffdf7; }
main:has(.retention-lab) { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); column-gap: 32px; align-items: start; }
main:has(.retention-lab) header { grid-column: 1 / -1; }
main:has(.retention-lab) > .grid { grid-column: 1; grid-row: 2; grid-template-columns: 1fr; }
main:has(.retention-lab) > .retention-lab { grid-column: 2; grid-row: 2; }
@media (max-width: 800px) { main:has(.retention-lab) { display: block; } main:has(.retention-lab) > .grid { margin-top: 28px; } }
@media (max-width: 420px) { header { column-gap: 8px; } .eyebrow { font-size: 9px; letter-spacing: .05em; } .eyebrow::before { margin-right: 7px; } .language button { padding: 6px; font-size: 11px; } }
`;

const cardStyles = `
:host { display: block; color: #242520; font-family: 'Outfit', 'Trebuchet MS', sans-serif; }
article { border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.project-art { height: 108px; position: relative; overflow: hidden; display: flex; align-items: end; justify-content: center; gap: 12px; border-bottom: 2px solid #242520; background: #e4eacb; }
.project-art i { display: block; width: 44px; height: 64px; border: 2px solid #242520; border-bottom: 0; border-radius: 24px 24px 0 0; background: #f5f2eb; transform: translateY(2px); }
.project-art i:nth-child(2) { height: 82px; background: #ffe600; }
.project-art[data-project='second'] { background: #d9e6ee; align-items: center; gap: 10px; }
.project-art[data-project='second'] i { width: 54px; height: 54px; border: 2px solid #242520; border-radius: 50%; background: #ffe600; }
.project-art[data-project='second'] i:nth-child(2) { height: 32px; width: 100px; border-radius: 30px; background: #fffdf7; margin-left: -36px; margin-top: 30px; }
.project-art[data-project='second'] i:nth-child(3) { display: none; }
.project-body { display: grid; gap: 10px; padding: 20px 22px; }
.project-body > span { font: 700 10px/1.5 monospace; text-transform: uppercase; letter-spacing: .12em; color: #68695f; }
h2 { margin: 0; font-size: 24px; line-height: 1.15; letter-spacing: -.04em; }
p { margin: 0 0 4px; color: #62635b; font-size: 14px; line-height: 1.55; }
academy-action-button { --action-button-accent: #242520; }
`;

/** Adapts the educational studio without changing the store lessons. */
export function adaptStudioWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  const files = { ...base.snapshot.files };
  const put = (path: string, content: string) => { files[path] = { ...files[path], content }; };
  for (const [path, file] of Object.entries(files)) {
    if (path.startsWith('app/pages/academy-cart-page/')) { delete files[path]; continue; }
    if (path.endsWith('locales.json')) {
      const catalogs = JSON.parse(file.content);
      for (const lang of ['es', 'en'] as const) {
        for (const key of Object.keys(catalogs[lang] ?? {})) {
          if (key.startsWith('cart.') || key === 'home.cart') delete catalogs[lang][key];
          else if (key in translations[lang]) catalogs[lang][key] = translations[lang][key as keyof typeof translations[typeof lang]];
        }
        if (path === 'app/locales-app/locales.json') Object.assign(catalogs[lang], Object.fromEntries(Object.entries(translations[lang]).filter(([key]) => key.startsWith('studio.'))));
      }
      put(path, JSON.stringify(catalogs, null, 2));
    }
  }
  const messagePath = 'app/scripts/app-messages.js';
  const match = files[messagePath].content.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo del estudio.');
  const catalogs = JSON.parse(match[1]);
  for (const lang of ['es', 'en'] as const) {
    Object.assign(catalogs[lang], translations[lang]);
    for (const key of Object.keys(catalogs[lang])) if (key.startsWith('cart.') || key === 'home.cart') delete catalogs[lang][key];
  }
  put(messagePath, files[messagePath].content.replace(match[0], `Object.freeze(${JSON.stringify(catalogs, null, 2)});`));
  const routesPath = 'app/scripts/app-routes.js';
  put(routesPath, files[routesPath].content.replace(/  \{\n    path: '\/cart',[\s\S]*?\n  \},\n/, ''));
  for (const [path, file] of Object.entries(files)) {
    if (path.startsWith('app/pages/') && path.endsWith('.js')) put(path, file.content
      .replace(/\s*<button @click=\$\{\(\) => this\.navigate\('cart'\)\}>[\s\S]*?<\/button>/, '')
      .replaceAll("name: 'Té verde'", "name: 'Proyecto Museo'").replaceAll("name: 'Café de origen'", "name: 'Proyecto Clima'")
      .replaceAll("name: 'Selección guardada'", "name: 'Proyecto Museo'")
      .replace(/, price: (?:4|12)/g, ''));
  }
  const cardPath = 'app/components/academy-product-card/academy-product-card.js';
  put(cardPath, files[cardPath].content.replace(", price: 0", '').replace('<article>', '<article>\n        <div class="project-art" data-project=${this.product.id} aria-hidden="true"><i></i><i></i><i></i></div>\n        <div class="project-body">')
    .replace('<p class="price">${this.product.price} €</p>', "<p>${this.t(this.product.id === 'first' ? 'studio.museum' : this.product.id === 'second' ? 'studio.climate' : 'studio.generic')}</p>")
    .replace('      </article>', '        </div>\n      </article>'));
  const searchPath = 'app/pages/academy-search-page/academy-search-page.js';
  put(searchPath, files[searchPath].content.replace('<div class="results"', "${this.results.length === 0 ? html`<p role=\"status\">${this.t('studio.empty')}</p>` : ''}\n        <div class=\"results\""));
  const style = (tag: string, source: string) => {
    const folder = tag.endsWith('-page') ? 'pages' : 'components';
    const prefix = `app/${folder}/${tag}/${tag}`;
    put(`${prefix}.scss`, source);
    put(`${prefix}.css.js`, `import { css } from 'lit';\nexport default css\`\n${source}\n\`;\n`);
  };
  style('academy-home-page', homeStyles);
  style('academy-product-card', cardStyles);
  const actionPrefix = 'app/components/shared/academy-action-button';
  const actionStyles = files[`${actionPrefix}.scss`].content + `
:host { display: block; font-family: 'Outfit', 'Trebuchet MS', sans-serif; }
.primary-action { display: flex; justify-content: space-between; align-items: center; gap: 16px; width: 100%; min-height: 44px; padding: 10px 14px; border: 1.5px solid #242520; border-radius: 0; background: #242520; color: #fffdf7; font: inherit; font-size: 13px; font-weight: 700; }
.primary-action::after { content: '↗'; font-size: 20px; }
.primary-action:hover { background: #ffe600; color: #242520; }
.primary-action:focus-visible { outline: 3px solid #2455b5; outline-offset: 3px; }
`;
  put(`${actionPrefix}.scss`, actionStyles);
  put(`${actionPrefix}.css.js`, `import { css } from 'lit';\nexport default css\`\n${actionStyles}\n\`;\n`);
  for (const tag of ['academy-favorites-page', 'academy-search-page', 'academy-not-found-page']) style(tag, baseStyles);
  style('academy-product-detail-page', baseStyles + '\nmain { max-width: 780px; } .visual { display: grid; place-items: center; height: 160px; margin-bottom: 24px; border: 2px solid #242520; background: #e4eacb; font-size: 64px; } main > p { margin: 18px 0; }\n');
  const indexPath = 'index.html';
  put(indexPath, files[indexPath].content.replace('#eef2f6', '#f5f2eb').replace('#102a43', '#242520'));
  const testPath = 'test/unit/app.test.js';
  put(testPath, files[testPath].content.replace("'favorites', 'cart', 'search'", "'favorites', 'search'")
    .replace('Un catálogo hecho de fronteras reales', 'Estudio Cells').replace('Producto del catálogo', 'Proyecto de práctica')
    .replace('A catalog made from real boundaries', 'Cells Studio').replaceAll(', price: 7', ''));
  return createVersionedCellsWorkspace({ ...base.snapshot, files }, base.generation);
}
