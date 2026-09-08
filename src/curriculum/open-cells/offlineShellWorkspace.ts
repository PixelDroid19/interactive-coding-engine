import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { offlineClientSource } from './offlineShellSources';

const messages = {
  es: {
    'offline.kicker': 'Laboratorio / Sin conexión',
    'offline.title': 'Tu estudio, incluso sin conexión',
    'offline.help': 'El shell guarda las páginas y sus recursos del build. El dato de prueba siempre se consulta en la red: no lo confundas con contenido guardado.',
    'offline.unsupported': 'Disponible al exportar',
    'offline.unsupportedHelp': 'Esta vista previa aislada no registra service workers. Exporta el proyecto, compílalo y abre su preview en localhost o HTTPS para probarlo de verdad.',
    'offline.loading': 'Preparando el shell',
    'offline.ready': 'Shell listo',
    'offline.waiting': 'Hay una actualización preparada',
    'offline.error': 'No se pudo preparar el shell',
    'offline.errorHelp': 'Comprueba el build de producción y la respuesta de sw.js. No se ofrece soporte offline si la instalación falla.',
    'offline.online': 'Navegador conectado',
    'offline.disconnected': 'Navegador sin conexión',
    'offline.check': 'Buscar actualización',
    'offline.checking': 'Buscando actualización…',
    'offline.checked': 'Comprobación solicitada; una instalación nueva se anunciará cuando esté lista.',
    'offline.checkError': 'No se pudo comprobar la actualización. El shell activo no se ha reemplazado.',
    'offline.apply': 'Actualizar y recargar',
    'offline.updateHelp': 'La nueva versión espera tu decisión. Al aplicarla se recargan las pestañas controladas y se pierde el estado que no hayas guardado.',
    'offline.network': 'Consultar dato de red',
    'offline.networkLoading': 'Consultando la red…',
    'offline.networkSuccess': 'Dato recibido de la red',
    'offline.networkError': 'No se pudo consultar la red; no se muestra una copia antigua.'
  },
  en: {
    'offline.kicker': 'Lab / Offline',
    'offline.title': 'Your studio, even offline',
    'offline.help': 'The shell stores the pages and their build resources. The sample data always comes from the network: do not confuse it with saved content.',
    'offline.unsupported': 'Available after export',
    'offline.unsupportedHelp': 'This isolated preview does not register service workers. Export the project, build it and open its preview on localhost or HTTPS to test real offline behavior.',
    'offline.loading': 'Preparing the shell',
    'offline.ready': 'Shell ready',
    'offline.waiting': 'An update is ready',
    'offline.error': 'Could not prepare the shell',
    'offline.errorHelp': 'Check the production build and the sw.js response. Offline support is not offered when installation fails.',
    'offline.online': 'Browser online',
    'offline.disconnected': 'Browser offline',
    'offline.check': 'Check for updates',
    'offline.checking': 'Checking for updates…',
    'offline.checked': 'Check requested; a new installation will be announced when ready.',
    'offline.checkError': 'Could not check for updates. The active shell has not been replaced.',
    'offline.apply': 'Update and reload',
    'offline.updateHelp': 'The new version waits for your decision. Applying it reloads controlled tabs and loses any state you have not saved.',
    'offline.network': 'Request network data',
    'offline.networkLoading': 'Requesting network data…',
    'offline.networkSuccess': 'Data received from the network',
    'offline.networkError': 'Could not reach the network; no old copy is shown.'
  }
};

const panel = `
        <section class="offline-lab" aria-labelledby="offline-title">
          <span class="offline-kicker">\${this.t('offline.kicker')}</span>
          <h2 id="offline-title">\${this.t('offline.title')}</h2>
          <p>\${this.t('offline.help')}</p>
          <div class="offline-state" role="status">
            <strong>\${this.t('offline.' + this.offline.status)}</strong>
            <span>\${this.t(this.offline.online ? 'offline.online' : 'offline.disconnected')}</span>
          </div>
          \${this.offline.status === 'unsupported' ? html\`<p class="offline-note">\${this.t('offline.unsupportedHelp')}</p>\` : ''}
          \${this.offline.status === 'error' ? html\`<p class="offline-note">\${this.t('offline.errorHelp')}</p>\` : ''}
          <div class="offline-actions">
            <button ?disabled=\${!['ready', 'waiting'].includes(this.offline.status) || this.offline.checking} @click=\${checkOfflineUpdate}>\${this.t(this.offline.checking ? 'offline.checking' : 'offline.check')}</button>
            <button ?disabled=\${this.offline.status === 'unsupported' || this.offline.networkResult === 'loading'} @click=\${loadNetworkSample}>\${this.t('offline.network')}</button>
          </div>
          \${this.offline.updateResult === 'checked' ? html\`<p class="offline-note">\${this.t('offline.checked')}</p>\` : ''}
          \${this.offline.updateResult === 'error' ? html\`<p class="offline-note" role="status">\${this.t('offline.checkError')}</p>\` : ''}
          \${this.offline.networkResult !== 'idle' ? html\`<p role="status" class="offline-note">\${this.t({ loading: 'offline.networkLoading', success: 'offline.networkSuccess', error: 'offline.networkError' }[this.offline.networkResult])}</p>\` : ''}
          \${this.offline.status === 'waiting' ? html\`
            <div class="offline-update"><p>\${this.t('offline.updateHelp')}</p><button @click=\${activateOfflineUpdate}>\${this.t('offline.apply')}</button></div>
          \` : ''}
        </section>`;

const styles = `
.offline-lab { margin-bottom: 28px; padding: 28px; border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.offline-kicker { display: inline-block; padding: 5px 9px; background: #ffe600; font: 700 11px/1.5 monospace; text-transform: uppercase; letter-spacing: .08em; }
.offline-lab h2 { margin: 18px 0 12px; font-size: clamp(24px, 3vw, 32px); }
.offline-lab p { max-width: 76ch; color: #62635b; font-size: 14px; }
.offline-state { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; margin: 22px 0 14px; }
.offline-state strong { border: 1px solid #242520; padding: 7px 12px; background: #f5f2eb; font-size: 13px; }
.offline-state span { font-size: 12px; }
.offline-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.offline-lab button:disabled { opacity: .5; cursor: not-allowed; }
.offline-lab .offline-note { margin: 12px 0; font-size: 13px; }
.offline-update { margin-top: 22px; padding-top: 18px; border-top: 1px solid #cccac0; }
.offline-update button { margin-top: 14px; background: #ffe600; box-shadow: 3px 3px 0 #242520; }
@media (max-width: 500px) { .offline-lab { padding: 22px 18px; } .offline-actions button { width: 100%; } }
`;

/** Exports a real build-time worker; the opaque playground reports its boundary. */
export function connectOfflineShellWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, content: string) => { workspace = writeCellsFile(workspace, path, content); };
  put('app/runtime/offline-shell.js', offlineClientSource);
  put('resources/live-status.json', JSON.stringify({ revision: 'demo-1' }, null, 2));
  const config = 'app/config/prod.js';
  put(config, workspace.snapshot.files[config].content.replace('const appConfig = {', `const appConfig = {
  serviceWorker: {
    mode: 'injectManifest',
    options: {
      swSrc: 'service-worker.js',
      globPatterns: ['index.html', 'assets/**/*.{js,css,svg,png,woff2}', 'locales/**/*.json'],
    },
  },`));
  const app = 'app/scripts/app.js';
  put(app, `import { startOfflineShell } from '../runtime/offline-shell.js';\n` + workspace.snapshot.files[app].content + '\nvoid startOfflineShell();\n');
  const home = 'app/pages/academy-home-page/academy-home-page';
  put(`${home}.js`, `import { getOfflineState, subscribeOfflineState, checkOfflineUpdate, activateOfflineUpdate, loadNetworkSample } from '../../runtime/offline-shell.js';\n` + workspace.snapshot.files[`${home}.js`].content
    .replace('products: { state: true },', 'products: { state: true },\n      offline: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.offline = getOfflineState();")
    .replace('  onPageEnter() {', '  onPageEnter() {\n    this.stopOfflineUpdates?.();\n    this.stopOfflineUpdates = subscribeOfflineState((state) => { this.offline = state; });')
    .replace('  onPageLeave() {', '  onPageLeave() {\n    this.stopOfflineUpdates?.();')
    .replace('        </header>', `        </header>\n${panel}`));
  const scss = workspace.snapshot.files[`${home}.scss`].content + styles;
  put(`${home}.scss`, scss);
  put(`${home}.css.js`, `import { css } from 'lit';\nexport default css\`\n${scss}\n\`;\n`);
  const locale = 'app/locales-app/locales.json';
  const catalogs = JSON.parse(workspace.snapshot.files[locale].content);
  for (const lang of ['es', 'en'] as const) Object.assign(catalogs[lang], messages[lang]);
  put(locale, JSON.stringify(catalogs, null, 2));
  const messagesPath = 'app/scripts/app-messages.js';
  const source = workspace.snapshot.files[messagesPath].content;
  const match = source.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo de la aplicación.');
  const merged = JSON.parse(match[1]);
  for (const lang of ['es', 'en'] as const) Object.assign(merged[lang], messages[lang]);
  put(messagesPath, source.replace(match[0], `Object.freeze(${JSON.stringify(merged, null, 2)});`));
  put('docs/offline-shell.md', `# Shell offline y actualización visible

La vista previa aislada no puede registrar este worker: muestra esa limitación sin fingir conectividad. La prueba real se hace tras exportar, con cells app:build -c prod.js y cells app:preview -c prod.js, en localhost o HTTPS.

## Propietarios y políticas

- [prod.js](../app/config/prod.js) pide a la CLI injectManifest. El build inyecta en [service-worker.js](../service-worker.js) los recursos finales, incluidos los módulos de rutas diferidas.
- La instalación precachea únicamente index.html, assets del build y locales. El nombre de caché combina el ámbito, la versión explícita y el hash del manifiesto. Una instalación incompleta no activa el worker nuevo.
- Las navegaciones y los recursos del manifiesto usan el shell de su versión; no se mezclan documentos nuevos con módulos antiguos. [El dato cambiante](../resources/live-status.json) no está en el manifiesto: usa solo red y no-store.
- [offline-shell.js](../app/runtime/offline-shell.js) comunica instalación, conexión, errores y una versión en espera. No ofrece una actualización silenciosa: Actualizar y recargar envía la orden al worker en espera. Las pestañas controladas se recargan y pierden el estado no guardado.
- La activación elimina únicamente cachés de este estudio y ámbito. No borra cachés de otras aplicaciones.

## Comprueba la experiencia real

1. Espera Shell listo. Consulta el dato de red.
2. Activa Offline en las herramientas del navegador y recarga. Abre un proyecto que todavía no hayas visitado: sus módulos ya pertenecen al precache.
3. Consulta el dato de red: debe fallar explícitamente, sin presentar datos antiguos.
4. Recupera la conexión. Cambia SHELL_VERSION, vuelve a compilar y pulsa Buscar actualización en la pestaña que sigue abierta.
5. La versión anterior sigue activa hasta que pulses Actualizar y recargar. Después comprueba en Cache Storage que se retiró su caché.

El soporte depende de un build completo y de las APIs del navegador. No cachees respuestas privadas, autenticación o todos los GET por comodidad.
`);
  return workspace;
}
