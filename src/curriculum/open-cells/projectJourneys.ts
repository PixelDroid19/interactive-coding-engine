import type { WorkspaceSnapshot } from '../../types/scrim';

export interface OpenCellsJourneyStop {
  path: string;
  role: string;
  buildExplanation: string;
  write: boolean;
}

export interface OpenCellsProjectJourney {
  stops: OpenCellsJourneyStop[];
}

const COMPONENT_FILES = {
  manifest: 'package.json',
  publicIndex: 'index.js',
  publicRegister: 'academy-learning-card.js',
  source: 'src/academy-learning-card.js',
  mixin: 'src/mixins/WidgetMixin.js',
  locales: 'locales/locales.json',
  demoPage: 'demo/index.html',
  demoController: 'demo/demo.js',
  demoBuild: 'demo/demo-build.js',
  tests: 'test/unit/academy-learning-card.test.js',
  metadata: 'custom-elements.json',
  readme: 'README.md',
};

const APP_FILES = {
  manifest: 'package.json',
  html: 'index.html',
  bootstrap: 'app/scripts/app.js',
  routes: 'app/scripts/app-routes.js',
  channels: 'app/scripts/channels.js',
  nativeAdapter: 'app/bridge/native-adapter.js',
  home: 'app/pages/academy-home-page/academy-home-page.js',
  detail: 'app/pages/academy-product-detail-page/academy-product-detail-page.js',
  favorites: 'app/pages/academy-favorites-page/academy-favorites-page.js',
  cart: 'app/pages/academy-cart-page/academy-cart-page.js',
  search: 'app/pages/academy-search-page/academy-search-page.js',
  notFound: 'app/pages/academy-not-found-page/academy-not-found-page.js',
  card: 'app/components/academy-product-card/academy-product-card.js',
  manager: 'app/data/academy-product-data-manager.js',
  dev: 'app/config/dev.js',
  prod: 'app/config/prod.js',
  globalLocales: 'app/locales-app/locales.json',
  pageLocales: 'app/pages/academy-home-page/locales/locales.json',
  tests: 'test/unit/app.test.js',
  readme: 'README.md',
};

const roles: Record<string, string> = {
  'package.json': 'declara identidad, entradas, dependencias y comandos que consumen las herramientas',
  'index.js': 'expone la clase sin registrar efectos globales',
  'index.html': 'crea la raíz que el runtime montará en el navegador',
  'academy-learning-card.js': 'registra el tag público que una aplicación puede instanciar',
  'src/academy-learning-card.js': 'implementa propiedades, render, dependencias scoped y eventos del componente',
  'src/mixins/WidgetMixin.js': 'concentra traducción y emisión de intenciones públicas',
  'locales/locales.json': 'es la fuente de las traducciones del componente',
  'demo/index.html': 'presenta controles y una instancia real del paquete',
  'demo/demo.js': 'consume la entrada pública y conecta propiedades, idioma y eventos',
  'demo/demo-build.js': 'actúa como raíz del grafo que construye la demo',
  'test/unit/academy-learning-card.test.js': 'prueba el componente desde su superficie pública',
  'custom-elements.json': 'describe la API para herramientas sin ejecutar el módulo',
  'app/scripts/app.js': 'arranca una única instancia del runtime con outlet, rutas e inicio',
  'app/scripts/app-routes.js': 'relaciona URL, nombre estable, tag de página y carga lazy',
  'app/scripts/channels.js': 'nombra contratos de comunicación de larga distancia',
  'app/bridge/native-adapter.js': 'valida mensajes del shell y los traduce a navegación o canales internos',
  'app/pages/academy-home-page/academy-home-page.js': 'coordina componentes, ciclo de página y navegación',
  'app/pages/academy-product-detail-page/academy-product-detail-page.js': 'recibe parámetros de una visita y renderiza el detalle',
  'app/pages/academy-favorites-page/academy-favorites-page.js': 'compone productos guardados sin copiar la implementación de la tarjeta',
  'app/pages/academy-cart-page/academy-cart-page.js': 'posee los elementos del carrito y deriva el total visible',
  'app/pages/academy-search-page/academy-search-page.js': 'posee la consulta y deriva resultados sin mutar el catálogo original',
  'app/pages/academy-not-found-page/academy-not-found-page.js': 'ofrece una recuperación visible cuando ninguna ruta coincide',
  'app/components/academy-product-card/academy-product-card.js': 'encapsula presentación y devuelve una intención mediante evento',
  'app/data/academy-product-data-manager.js': 'posee petición, estados, carreras y cancelación',
  'app/config/dev.js': 'declara valores observables del entorno de desarrollo',
  'app/config/prod.js': 'declara una entrega reproducible sin opciones de depuración',
  'app/locales-app/locales.json': 'conserva textos compartidos por toda la aplicación',
  'app/pages/academy-home-page/locales/locales.json': 'conserva textos que pertenecen únicamente a la página inicial',
  'test/unit/app.test.js': 'comprueba la historia vertical desde rutas y páginas hasta datos',
  'README.md': 'explica cómo consumir, probar y continuar el proyecto fuera del curso',
};

const buildExplanations: Record<string, string> = {
  'package.json': 'type module permite usar import y export. exports señala la entrada pública; cells.entry señala el bootstrap de una app. Los scripts nombran operaciones reales de desarrollo, pruebas, locales y build.',
  'index.js': 'exportamos la clase desde src. Este archivo no registra el tag: así una prueba o un consumidor puede importar la clase sin provocar un efecto global.',
  'index.html': 'el main con id app es el outlet. El script type module carga app/scripts/app.js; el nombre del id debe coincidir después con mainNode.',
  'academy-learning-card.js': 'importamos el polyfill del registro scoped, importamos la clase y registramos únicamente el tag público si todavía no existe.',
  'src/academy-learning-card.js': 'los imports traen Lit, mixins y dependencias. La clase declara scopedElements y properties; render usa esas entradas y handleContinue devuelve una intención pública.',
  'src/mixins/WidgetMixin.js': 'el mixin recibe una clase base y devuelve otra clase. t delega en el motor de idioma; emitEvent fija bubbles, composed y un detail serializable.',
  'locales/locales.json': 'en y es repiten exactamente las mismas claves. El placeholder de nombre también debe coincidir para que this.t pueda sustituirlo sin casos especiales.',
  'demo/index.html': 'la página contiene controles, una instancia del tag y un output para eventos. El único script propio que carga es demo.js.',
  'demo/demo.js': 'importamos la entrada pública, buscamos la instancia y conectamos input con una propiedad, select con el idioma y el evento público con el output.',
  'demo/demo-build.js': 'este archivo importa demo.js y se convierte en la raíz explícita del grafo que Vite construye para distribución.',
  'test/unit/academy-learning-card.test.js': 'cada caso crea o usa la API pública, cambia valores, espera la actualización y comprueba DOM, scopedElements o eventos; no busca una línea exacta.',
  'custom-elements.json': 'modules apunta al archivo fuente; declarations describe clase y tag; exports relaciona la definición pública con esa declaración.',
  'app/scripts/app.js': 'importamos startApp y ROUTES. mainNode coincide con el outlet HTML, initialTemplate coincide con el name de una ruta y el bootstrap ocurre una sola vez.',
  'app/scripts/app-routes.js': 'cada objeto separa path de URL, name estable, component que se monta y action que importa la página solo cuando se visita.',
  'app/scripts/channels.js': 'exportamos una constante para que publicador y suscriptor usen el mismo nombre y no repitan strings divergentes.',
  'app/bridge/native-adapter.js': 'la frontera acepta mensajes serializables, rechaza formas desconocidas y traduce ciclo de vida o deep links sin filtrar objetos nativos al árbol de componentes.',
  'app/pages/academy-home-page/academy-home-page.js': 'PageMixin aporta navegación y canales; ScopedElementsMixin resuelve la tarjeta. onPageEnter adquiere recursos, onPageLeave los libera y render conserva UI declarativa.',
  'app/pages/academy-product-detail-page/academy-product-detail-page.js': 'onPageEnter recibe params de la navegación y los convierte en estado de la visita; el botón vuelve usando el name home, no una URL copiada.',
  'app/pages/academy-favorites-page/academy-favorites-page.js': 'la página registra la tarjeta como dependencia scoped y le entrega cada producto guardado mediante su propiedad pública.',
  'app/pages/academy-cart-page/academy-cart-page.js': 'los items son estado de página y total es un dato derivado en render; ninguna tarjeta global conserva el carrito.',
  'app/pages/academy-search-page/academy-search-page.js': 'query cambia con el input y results se deriva en cada render; la misma tarjeta reutilizable presenta cada coincidencia.',
  'app/pages/academy-not-found-page/academy-not-found-page.js': 'la página no adivina una URL anterior: ofrece una acción explícita que navega al name estable home.',
  'app/components/academy-product-card/academy-product-card.js': 'la tarjeta recibe product por propiedad y emite select. No importa rutas ni canales porque esa coordinación pertenece a la página.',
  'app/data/academy-product-data-manager.js': 'requestId identifica la petición vigente, AbortController permite cancelarla y emit diferencia loading, success, empty y error.',
  'app/config/dev.js': 'desarrollo habilita diagnóstico y sourcemaps sin cambiar las reglas de negocio ni el código de páginas.',
  'app/config/prod.js': 'producción cambia únicamente configuración de entrega y desactiva opciones que no deben llegar al artefacto final.',
  'app/locales-app/locales.json': 'estas claves pertenecen al shell completo; ninguna página debe duplicarlas en su catálogo privado.',
  'app/pages/academy-home-page/locales/locales.json': 'estas claves pertenecen a home. Mantenerlas junto a la página permite encontrar propietario y traducción en el mismo subárbol.',
  'test/unit/app.test.js': 'las pruebas conectan rutas, páginas y data manager con valores variables; además verifican cleanup y respuestas antiguas.',
  'README.md': 'documentamos instalación, entrada pública, comandos, eventos y pasos de continuación para alguien que no conoce el curso.',
};

const COMPONENT_SPECIAL: Record<number, string[]> = {
  1: [COMPONENT_FILES.manifest, COMPONENT_FILES.publicIndex, COMPONENT_FILES.source, COMPONENT_FILES.demoPage],
  2: [COMPONENT_FILES.manifest, COMPONENT_FILES.publicIndex, COMPONENT_FILES.publicRegister, COMPONENT_FILES.source],
  3: [COMPONENT_FILES.manifest, COMPONENT_FILES.publicIndex, COMPONENT_FILES.publicRegister, COMPONENT_FILES.source, COMPONENT_FILES.metadata],
  4: [COMPONENT_FILES.manifest, COMPONENT_FILES.demoPage, COMPONENT_FILES.demoController, COMPONENT_FILES.demoBuild],
  5: [COMPONENT_FILES.source, COMPONENT_FILES.demoController, COMPONENT_FILES.tests, COMPONENT_FILES.readme],
  7: [COMPONENT_FILES.publicIndex, COMPONENT_FILES.source, COMPONENT_FILES.demoController, COMPONENT_FILES.tests],
  8: [COMPONENT_FILES.mixin, COMPONENT_FILES.source, COMPONENT_FILES.demoController],
  15: [COMPONENT_FILES.manifest, COMPONENT_FILES.source, COMPONENT_FILES.demoPage, COMPONENT_FILES.tests],
  23: [COMPONENT_FILES.locales, COMPONENT_FILES.source, COMPONENT_FILES.demoController],
  31: [COMPONENT_FILES.demoPage, COMPONENT_FILES.demoController, COMPONENT_FILES.demoBuild, COMPONENT_FILES.publicRegister],
  32: [COMPONENT_FILES.tests, COMPONENT_FILES.publicRegister, COMPONENT_FILES.source, COMPONENT_FILES.demoPage],
  35: [COMPONENT_FILES.locales, 'demo/locales/locales.json', 'test/unit/locales/locales.json', COMPONENT_FILES.source],
  36: [COMPONENT_FILES.metadata, COMPONENT_FILES.source, COMPONENT_FILES.readme],
  37: [COMPONENT_FILES.demoBuild, COMPONENT_FILES.demoController, COMPONENT_FILES.publicRegister, COMPONENT_FILES.manifest],
  38: [COMPONENT_FILES.manifest, COMPONENT_FILES.publicIndex, COMPONENT_FILES.metadata, COMPONENT_FILES.readme],
};

const APP_SPECIAL: Record<number, string[]> = {
  39: [APP_FILES.manifest, APP_FILES.html, APP_FILES.bootstrap, APP_FILES.routes, APP_FILES.home],
  40: [APP_FILES.html, APP_FILES.bootstrap, APP_FILES.routes, APP_FILES.home, APP_FILES.prod],
  41: [APP_FILES.manifest, APP_FILES.dev, APP_FILES.prod, APP_FILES.bootstrap],
  42: [APP_FILES.html, APP_FILES.bootstrap, APP_FILES.routes, APP_FILES.home],
  43: [APP_FILES.routes, APP_FILES.home, APP_FILES.card, APP_FILES.pageLocales],
  44: [APP_FILES.routes, APP_FILES.home, APP_FILES.detail],
  45: [APP_FILES.routes, APP_FILES.detail, APP_FILES.home],
  46: [APP_FILES.home, APP_FILES.channels, APP_FILES.detail],
  47: [APP_FILES.routes, APP_FILES.bootstrap, APP_FILES.home],
  48: [APP_FILES.card, APP_FILES.home, APP_FILES.routes],
  49: [APP_FILES.routes, APP_FILES.detail, APP_FILES.home],
  50: [APP_FILES.card, APP_FILES.home, APP_FILES.channels, APP_FILES.routes],
  51: [APP_FILES.card, APP_FILES.home, APP_FILES.channels],
  52: [APP_FILES.channels, APP_FILES.home, APP_FILES.detail],
  53: [APP_FILES.channels, APP_FILES.home, APP_FILES.card],
  54: [APP_FILES.channels, APP_FILES.home, APP_FILES.detail],
  55: [APP_FILES.nativeAdapter, APP_FILES.channels, APP_FILES.home, APP_FILES.routes],
  56: [APP_FILES.nativeAdapter, APP_FILES.routes, APP_FILES.home, APP_FILES.channels],
  57: [APP_FILES.card, APP_FILES.home, APP_FILES.channels],
  58: [APP_FILES.manager, APP_FILES.home, APP_FILES.card],
  59: [APP_FILES.manager, APP_FILES.home, APP_FILES.tests],
  60: [APP_FILES.manager, APP_FILES.home, APP_FILES.tests],
  61: [APP_FILES.manager, APP_FILES.home, APP_FILES.tests],
  62: [APP_FILES.manager, APP_FILES.home, APP_FILES.tests],
  63: [APP_FILES.tests, APP_FILES.routes, APP_FILES.home, APP_FILES.manager],
  64: [APP_FILES.tests, APP_FILES.home, APP_FILES.card],
  65: [APP_FILES.tests, APP_FILES.manager, APP_FILES.routes],
  66: [APP_FILES.manifest, APP_FILES.prod, APP_FILES.tests, APP_FILES.readme],
  67: [APP_FILES.manifest, APP_FILES.prod, APP_FILES.bootstrap, APP_FILES.readme],
  68: [APP_FILES.readme, APP_FILES.manifest, APP_FILES.prod, APP_FILES.tests],
};

const MULTI_WRITE = new Set([3, 31, 39, 43, 58, 63, 66]);

function relatedFallback(number: number, focus: string): string[] {
  if (number <= 38) {
    if (focus.includes('locales')) return [focus, COMPONENT_FILES.source, COMPONENT_FILES.demoController, COMPONENT_FILES.tests];
    if (focus.includes('test/')) return [focus, COMPONENT_FILES.source, COMPONENT_FILES.demoPage, COMPONENT_FILES.publicRegister];
    if (focus.includes('demo/')) return [focus, COMPONENT_FILES.demoController, COMPONENT_FILES.publicRegister, COMPONENT_FILES.source];
    return [focus, COMPONENT_FILES.mixin, COMPONENT_FILES.demoController, COMPONENT_FILES.tests];
  }
  if (focus.includes('data')) return [focus, APP_FILES.home, APP_FILES.tests, APP_FILES.card];
  if (focus.includes('routes')) return [focus, APP_FILES.bootstrap, APP_FILES.home, APP_FILES.detail];
  if (focus.includes('locales')) return [focus, APP_FILES.home, APP_FILES.globalLocales, APP_FILES.pageLocales];
  if (focus.includes('test')) return [focus, APP_FILES.home, APP_FILES.manager, APP_FILES.routes];
  return [focus, APP_FILES.routes, APP_FILES.card, APP_FILES.channels];
}

export function createOpenCellsProjectJourney(
  number: number,
  focus: string,
  workspace: WorkspaceSnapshot,
): OpenCellsProjectJourney {
  const componentTag = number <= 38
    ? Object.values(workspace.files).map((source) => source.content.match(/customElements\.define\(['"]([^'"]+)/)?.[1]).find(Boolean)
    : undefined;
  const componentFiles = componentTag ? {
    ...COMPONENT_FILES,
    publicRegister: `${componentTag}.js`,
    source: `src/${componentTag}.js`,
    tests: `test/unit/${componentTag}.test.js`,
  } : COMPONENT_FILES;
  const adaptComponentPath = (path: string) => {
    if (path === COMPONENT_FILES.publicRegister) return componentFiles.publicRegister;
    if (path === COMPONENT_FILES.source) return componentFiles.source;
    if (path === COMPONENT_FILES.tests) return componentFiles.tests;
    return path;
  };
  const special = (number <= 38 ? COMPONENT_SPECIAL[number] : APP_SPECIAL[number]) ?? relatedFallback(number, focus);
  const requested = (number <= 38 ? special : [focus, ...special.filter((path) => path !== focus)])
    .map((path) => number <= 38 ? adaptComponentPath(path) : path);
  const paths = [...new Set(requested)].filter((path) => Boolean(workspace.files[path]) && !path.includes('/checkpoints/'));
  const fallbacks = number <= 38 ? Object.values(componentFiles) : Object.values(APP_FILES);
  for (const path of fallbacks) {
    if (paths.length >= 4) break;
    if (workspace.files[path] && !paths.includes(path)) paths.push(path);
  }
  const writePaths = MULTI_WRITE.has(number)
    ? new Set(paths.slice(0, number === 39 ? 5 : Math.min(3, paths.length)))
    : new Set([paths.includes(focus) ? focus : paths[0]]);
  return {
    stops: paths.map((path) => ({
      path,
      role: roles[path]
        ?? (/^src\/[^/]+\.js$/.test(path) ? 'implementa la API, el render, las dependencias y el evento del artefacto protagonista' : 'conecta esta responsabilidad con el resto del proyecto'),
      buildExplanation: buildExplanations[path]
        ?? (/^src\/[^/]+\.js$/.test(path) ? 'conectamos propiedades, traducciones, composición scoped y una salida observable sin copiar las dependencias reutilizadas' : 'leemos sus imports, su salida pública y la relación que mantiene con el siguiente archivo antes de ejecutarlo'),
      write: writePaths.has(path),
    })),
  };
}
