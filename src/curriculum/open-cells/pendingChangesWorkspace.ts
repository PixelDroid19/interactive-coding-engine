import { navigationGuardSource } from '../../engine/cells/cellsNavigationGuardRecipe';
import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const messages = {
  es: { 'draft.title': 'Notas del proyecto', 'draft.save': 'Guardar notas', 'draft.saved': 'Notas guardadas', 'draft.pending': 'Cambios sin guardar', 'draft.help': 'Las notas guardadas se conservan durante esta sesión. Edita y abre otra página para probar la confirmación.', 'draft.confirm': '¿Salir sin guardar?', 'draft.warning': 'Puedes seguir editando o descartar los cambios y abrir la página que elegiste.', 'draft.stay': 'Seguir editando', 'draft.leave': 'Descartar y salir' },
  en: { 'draft.title': 'Project notes', 'draft.save': 'Save notes', 'draft.saved': 'Notes saved', 'draft.pending': 'Unsaved changes', 'draft.help': 'Saved notes remain during this session. Edit and open another page to try the confirmation.', 'draft.confirm': 'Leave without saving?', 'draft.warning': 'Keep editing or discard the changes and open the page you selected.', 'draft.stay': 'Keep editing', 'draft.leave': 'Discard and leave' },
};

const shellStyles = `[data-project-draft] { box-sizing: border-box; margin: 16px auto; padding: 18px; max-width: 1040px; background: #f5f2eb; color: #171717; border: 2px solid #171717; box-shadow: 4px 4px 0 #171717; font: 16px/1.5 system-ui, sans-serif; }
[data-project-draft] label { display: block; font-weight: 700; margin-bottom: 8px; }
[data-project-draft] textarea { box-sizing: border-box; display: block; width: 100%; min-height: 70px; padding: 10px; border: 2px solid #171717; background: white; color: #171717; font: inherit; resize: vertical; }
[data-project-draft] button { padding: 10px 16px; margin: 4px 8px 4px 0; border: 2px solid #171717; background: #ffe600; color: #171717; font: inherit; font-weight: 700; cursor: pointer; }
[data-project-draft] :focus-visible { outline: 3px solid #2455b5; outline-offset: 3px; }
[data-project-draft] dialog { box-sizing: border-box; width: min(480px, calc(100vw - 32px)); padding: 24px; border: 2px solid #171717; box-shadow: 6px 6px 0 #171717; background: #f5f2eb; color: #171717; }
[data-project-draft] dialog::backdrop { background: rgb(0 0 0 / 45%); }
[data-project-draft] [data-stay] { background: white; }
`;

const shellSource = `import { navigate, subscribe, unsubscribe } from '@open-cells/core';
import { appIntlMsg } from '../scripts/app-messages.js';
import { pendingChangesInterceptor } from './pending-changes-interceptor.js';
import { createNavigationGuard } from './navigation-guard.js';
import styles from './pending-changes-shell.css.js';

export function installPendingChanges() {
  const panel = document.createElement('section');
  panel.setAttribute('data-project-draft', '');
  panel.innerHTML = '<label for="project-notes" data-message="draft.title"></label><textarea id="project-notes" aria-describedby="project-notes-help"></textarea><p id="project-notes-help" data-message="draft.help"></p><button type="button" data-save data-message="draft.save"></button><p role="status" data-status></p><dialog aria-labelledby="leave-title" aria-describedby="leave-warning"><h2 id="leave-title" data-message="draft.confirm"></h2><p id="leave-warning" data-message="draft.warning"></p><button type="button" data-stay data-message="draft.stay" autofocus></button><button type="button" data-leave data-message="draft.leave"></button></dialog>';
  const style = document.createElement('style');
  style.textContent = styles;
  panel.prepend(style);
  document.getElementById('app').before(panel);
  const input = panel.querySelector('textarea');
  const dialog = panel.querySelector('dialog');
  let saved = '';
  let answer;
  const hasPendingChanges = () => input.value !== saved;
  const refresh = () => {
    for (const node of panel.querySelectorAll('[data-message]')) node.textContent = appIntlMsg.t(node.dataset.message);
    panel.querySelector('[data-status]').textContent = appIntlMsg.t(hasPendingChanges() ? 'draft.pending' : 'draft.saved');
  };
  const settle = (accepted) => {
    const resolve = answer;
    answer = undefined;
    if (dialog.open) dialog.close();
    resolve?.(accepted);
  };
  const confirmLeave = () => {
    settle(false);
    return new Promise((resolve) => {
      answer = resolve;
      dialog.showModal();
    });
  };
  const guard = createNavigationGuard({
    hasPendingChanges,
    decide: (request) => pendingChangesInterceptor({ ...request, confirmLeave }),
    navigate: async (page, params) => {
      const result = await navigate(page, params);
      input.value = saved;
      refresh();
      return result;
    },
  });
  const interceptor = (navigation) => {
    const result = guard.interceptor(navigation);
    if (result.intercept) settle(false);
    return result;
  };
  subscribe('__oc_intercepted_navigation', panel, ({ value }) => {
    void guard.handleIntercepted(value).catch(() => refresh());
  });
  input.addEventListener('input', refresh);
  panel.querySelector('[data-save]').addEventListener('click', () => { saved = input.value; refresh(); });
  panel.querySelector('[data-stay]').addEventListener('click', () => settle(false));
  panel.querySelector('[data-leave]').addEventListener('click', () => settle(true));
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); settle(false); });
  globalThis.addEventListener('language-update', refresh);
  refresh();
  const dispose = () => {
    settle(false);
    guard.dispose();
    unsubscribe('__oc_intercepted_navigation', panel);
    globalThis.removeEventListener('language-update', refresh);
    globalThis.removeEventListener('pagehide', dispose);
    panel.remove();
  };
  globalThis.addEventListener('pagehide', dispose);
  return { interceptor, dispose };
}
`;

export function connectPendingChangesWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, source: string) => { workspace = writeCellsFile(workspace, path, source); };
  put('app/routing/navigation-guard.js', navigationGuardSource());
  put('app/routing/pending-changes-shell.js', shellSource);
  put('app/routing/pending-changes-shell.scss', shellStyles);
  put('app/routing/pending-changes-shell.css.js', `export default ${JSON.stringify(shellStyles)};\n`);
  const localePath = 'app/locales-app/locales.json';
  const catalogs = JSON.parse(workspace.snapshot.files[localePath].content);
  for (const language of ['es', 'en'] as const) Object.assign(catalogs[language], messages[language]);
  put(localePath, JSON.stringify(catalogs, null, 2));
  const messagesPath = 'app/scripts/app-messages.js';
  const source = workspace.snapshot.files[messagesPath].content;
  const match = source.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo del shell.');
  const merged = JSON.parse(match[1]);
  for (const language of ['es', 'en'] as const) Object.assign(merged[language], messages[language]);
  put(messagesPath, source.replace(match[0], `Object.freeze(${JSON.stringify(merged, null, 2)});`));
  const appPath = 'app/scripts/app.js';
  put(appPath, workspace.snapshot.files[appPath].content
    .replace("import { ROUTES }", "import { installPendingChanges } from '../routing/pending-changes-shell.js';\nimport { ROUTES }")
    .replace('globalThis.__OPEN_CELLS_APP_READY__ = startApp({', 'const pendingChanges = installPendingChanges();\nglobalThis.__OPEN_CELLS_APP_READY__ = startApp({\n  interceptor: pendingChanges.interceptor,'));
  return workspace;
}
