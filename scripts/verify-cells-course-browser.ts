import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { OPEN_CELLS_ARTIFACTS } from '../src/curriculum/open-cells/lessonProjects';
import { OPEN_CELLS_SCRIMS } from '../src/curriculum/open-cells/course';
import { createCellsCurriculumComponentWorkspace, createCellsCurriculumPracticeWorkspace } from '../src/engine/cells/cellsCurriculumRecipes';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';
import { instrumentCellsSource } from '../src/engine/cells/cellsPreviewInstrumentation';
import { createCellsProjectWorkspace } from '../src/engine/cells/cellsAppRecipes';
import type { WorkspaceSnapshot } from '../src/types/scrim';

const executablePath = process.env.CELLS_BROWSER_EXECUTABLE
  ?? (existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const complete = createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS['account-detail']).snapshot;

async function checkWorkspace(workspace: WorkspaceSnapshot, runId: string) {
  await page.goto('about:blank');
  await page.setContent('<iframe title="Cells contract fixture" sandbox="allow-scripts" style="width:100%;height:850px;border:0"></iframe>');
  await page.evaluate((expectedRun) => {
    const target = window as typeof window & { cellsResults?: unknown };
    target.cellsResults = undefined;
    window.addEventListener('message', (event) => {
      if (event.source === document.querySelector('iframe')?.contentWindow && event.data?.source === 'open-cells-tests' && event.data.testRunId === expectedRun) target.cellsResults = event.data;
    });
  }, runId);
  const html = buildCellsPreviewDocument(workspace, { runContractTests: true, testRunId: runId, instrumentSource: instrumentCellsSource }).html;
  await page.locator('iframe').evaluate((iframe: HTMLIFrameElement, content) => { iframe.srcdoc = content; }, html);
  await page.waitForFunction(() => Boolean((window as typeof window & { cellsResults?: unknown }).cellsResults), undefined, { timeout: 45_000 });
  return page.evaluate(() => (window as typeof window & { cellsResults: { results: Array<{ id: string; passed: boolean; message: string }> } }).cellsResults.results);
}

try {
  for (const project of ['museum', 'climate', 'relay', 'capstone', 'store'] as const) {
    const application = await checkWorkspace(createCellsProjectWorkspace(project).snapshot, 'application-' + project);
    if (application.some((result) => !result.passed)) throw new Error(project + ': ' + JSON.stringify(application));
  }
  const applicationFlow = await page.frames()[1].evaluate(`(async () => {
    const { navigate } = await import('@open-cells/core');
    const { switchAppLanguage } = await import('workspace:/app/scripts/app-messages.js');
    const waitForPage = async (tag) => {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const page = document.querySelector(tag);
        if (page) { await page.updateComplete; return page; }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      throw new Error('Missing page: ' + tag);
    };
    for (const route of ['home', 'favorites', 'search']) {
      await navigate(route);
      const current = await waitForPage('academy-' + route + '-page');
      const card = current.shadowRoot.querySelector('academy-product-card');
      await card?.updateComplete;
      const action = card?.shadowRoot?.querySelector('academy-action-button');
      await action?.updateComplete;
      if (!action?.shadowRoot?.querySelector('button')) throw new Error(route + ' must reuse the complete scoped action');
      await switchAppLanguage('en');
      await card.updateComplete;
      await action.updateComplete;
      if (!action.shadowRoot.textContent.includes('View details')) throw new Error(route + ' did not translate its action');
      const expectedId = card.product.id;
      action.shadowRoot.querySelector('button').click();
      const detail = await waitForPage('academy-product-detail-page');
      if (detail.productId !== expectedId) throw new Error(route + ' lost the selected product');
      if (customElements.get('academy-action-button')) throw new Error('Action leaked into the global registry');
      await switchAppLanguage('es');
    }
    return true;
  })()`);
  if (!applicationFlow) throw new Error('Application navigation was not verified.');
  const plainPreview = buildCellsPreviewDocument(createCellsProjectWorkspace('museum').snapshot).html;
  await page.locator('iframe').evaluate((iframe: HTMLIFrameElement, content) => { iframe.srcdoc = content; }, plainPreview);
  await page.frameLocator('iframe').locator('academy-home-page').waitFor({ state: 'visible', timeout: 15_000 });
  await page.frameLocator('iframe').getByRole('button', { name: 'Ver detalle' }).first().click();
  await page.frameLocator('iframe').locator('academy-product-detail-page').waitFor({ state: 'visible', timeout: 15_000 });
  for (const artifact of ['action-button', 'status-badge', 'state-panel', 'product-card', 'product-list', 'search-filter', 'language-switcher', 'catalog-shell', 'lifecycle-panel', 'context-panel', 'media-tile', 'theme-preview']) {
    const results = await checkWorkspace(createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS[artifact]).snapshot, artifact);
    const failures = results.filter((result) => !result.passed);
    if (failures.length) throw new Error(`${artifact}: ${JSON.stringify(failures)}`);
    if (artifact === 'theme-preview') {
      await page.frames()[1].evaluate(`(async () => {
        const host = document.querySelector('academy-theme-preview');
        const statePanel = host.shadowRoot.querySelector('academy-state-panel');
        if (!statePanel) throw new Error('The theme must reach a real scoped state component');
        const luminance = (color) => {
          const channels = color.match(/[\\d.]+/g).slice(0, 3).map(Number).map((value) => value / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
          return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
        };
        const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
        const backgrounds = [];
        for (const theme of ['claro', 'oscuro']) {
          host.theme = theme;
          host.state = 'error';
          await host.updateComplete;
          await statePanel.updateComplete;
          const surface = statePanel.shadowRoot.querySelector('.surface');
          const appearance = getComputedStyle(surface);
          backgrounds.push(appearance.backgroundColor);
          if (contrast(appearance.color, appearance.backgroundColor) < 4.5) throw new Error('State text lost contrast in ' + theme);
          const retry = statePanel.shadowRoot.querySelector('academy-action-button');
          await retry.updateComplete;
          const button = retry.shadowRoot.querySelector('button');
          button.focus();
          const actionAppearance = getComputedStyle(button);
          if (contrast(actionAppearance.color, actionAppearance.backgroundColor) < 4.5) throw new Error('Action text lost contrast in ' + theme);
          if (parseFloat(actionAppearance.outlineWidth) < 2 || actionAppearance.outlineStyle === 'none') throw new Error('The theme must preserve visible keyboard focus');
          if (contrast(actionAppearance.outlineColor, appearance.backgroundColor) < 3) throw new Error('Focus indicator lost contrast in ' + theme);
          host.state = 'empty';
          await host.updateComplete;
          await statePanel.updateComplete;
          if (statePanel.shadowRoot.querySelector('academy-action-button')) throw new Error('Theme retained stale retry after state change');
        }
        if (backgrounds[0] === backgrounds[1]) throw new Error('Changing theme did not change the shared surface');
        host.style.setProperty('--theme-preview-background', '#fff1f2');
        host.style.setProperty('--theme-preview-foreground', '#111827');
        const sharedSurface = statePanel.shadowRoot.querySelector('.surface');
        if (getComputedStyle(sharedSurface).backgroundColor !== 'rgb(255, 241, 242)' || getComputedStyle(sharedSurface).color !== 'rgb(17, 24, 39)') throw new Error('Consumer tokens did not cross the scoped component boundary');
        const action = host.shadowRoot.querySelector('academy-action-button');
        const events = [];
        host.addEventListener('academy-theme-preview-change', (event) => events.push(event.detail));
        host.disabled = true;
        await host.updateComplete;
        await action.updateComplete;
        action.shadowRoot.querySelector('button').click();
        if (!action.shadowRoot.querySelector('button').disabled || events.length) throw new Error('Theme lost its disabled action state');
        host.disabled = false;
        await host.updateComplete;
        await action.updateComplete;
        action.shadowRoot.querySelector('button').click();
        if (events.length !== 1 || events[0].theme !== 'oscuro') throw new Error('Reenabled theme action lost its public event');
      })()`);
    }
    if (artifact === 'media-tile') {
      await page.frames()[1].evaluate(`(async () => {
        const host = document.querySelector('academy-media-tile');
        await window.IntlMsg.setLanguage('es');
        host.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="1"><path fill="blue" d="M0 0h2v1H0z"/></svg>');
        host.alt = 'Rectángulo azul';
        host.width = 320;
        host.height = 160;
        await host.updateComplete;
        const frame = host.shadowRoot.querySelector('[data-media-state]');
        const image = host.shadowRoot.querySelector('img');
        if (!frame || !image) throw new Error('Media must render the public source with a reserved frame');
        const before = frame.getBoundingClientRect();
        if (before.width <= 0 || Math.abs(before.width / before.height - 2) > .05) throw new Error('Media dimensions were not reserved before loading');
        if (image.alt !== 'Rectángulo azul' || image.getAttribute('width') !== '320' || image.getAttribute('height') !== '160') throw new Error('Accessible media inputs were not bound');
        if (!host.shadowRoot.querySelector('[data-decorative-icon][aria-hidden="true"]')) throw new Error('The decorative icon must be hidden from assistive technology');
        await image.decode();
        await new Promise(requestAnimationFrame);
        await host.updateComplete;
        if (frame.getAttribute('data-media-state') !== 'ready') throw new Error('Successful image load did not clear loading feedback');
        host.src = 'data:image/png;base64,aW52YWxpZA==';
        await host.updateComplete;
        await image.decode().catch(() => {});
        await new Promise(requestAnimationFrame);
        await host.updateComplete;
        if (frame.getAttribute('data-media-state') !== 'error' || !host.shadowRoot.textContent.includes('No se pudo cargar')) throw new Error('Broken source must show a useful error state');
        if (Math.abs(frame.getBoundingClientRect().height - before.height) > 1) throw new Error('Image failure collapsed the reserved area');
        await window.IntlMsg.setLanguage('en');
        await host.updateComplete;
        if (!host.shadowRoot.textContent.includes('Unable to load')) throw new Error('Media error did not follow the active locale');
        host.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>');
        host.alt = '';
        await host.updateComplete;
        await image.decode();
        await new Promise(requestAnimationFrame);
        await host.updateComplete;
        if (frame.getAttribute('data-media-state') !== 'ready' || image.alt !== '' || image.hidden) throw new Error('A replacement source must recover and preserve decorative alt');
        host.src = '';
        host.width = -1;
        host.height = NaN;
        await host.updateComplete;
        if (frame.getAttribute('data-media-state') !== 'empty' || host.shadowRoot.querySelector('img')) throw new Error('Empty source must not request the document as an image');
        const empty = frame.getBoundingClientRect();
        if (empty.height <= 0 || !Number.isFinite(empty.height)) throw new Error('Invalid sizes must retain a usable frame');
      })()`);
    }
    if (artifact === 'context-panel') {
      await page.frames()[1].evaluate(`(async () => {
        const provider = document.querySelector('academy-density-provider');
        const consumers = provider?.querySelectorAll('academy-context-panel');
        if (consumers?.length !== 2) throw new Error('The context demo must connect two actual consumers to one provider');
        provider.density = 'compacta';
        await provider.updateComplete;
        await Promise.all([...consumers].map((host) => host.updateComplete));
        if ([...consumers].some((host) => host.shadowRoot.querySelector('[data-density]')?.getAttribute('data-density') !== 'compacta')) throw new Error('Provider changes did not reach both consumers');
        const other = document.createElement('academy-density-provider');
        other.density = 'cómoda';
        document.body.append(other);
        other.append(consumers[1]);
        await other.updateComplete;
        await consumers[1].updateComplete;
        if (consumers[1].density !== 'cómoda' || consumers[0].density !== 'compacta') throw new Error('Context scope did not follow the subtree');
        provider.density = 'cómoda';
        await provider.updateComplete;
        other.density = 'compacta';
        await other.updateComplete;
        await Promise.all([...consumers].map((host) => host.updateComplete));
        if (consumers[0].density !== 'cómoda' || consumers[1].density !== 'compacta') throw new Error('Providers interfered after reparenting');
        consumers[1].remove();
        other.density = 'cómoda';
        await other.updateComplete;
        if (consumers[1].density !== 'compacta') throw new Error('Disconnected context consumer kept its subscription');
        other.append(consumers[1]);
        await consumers[1].updateComplete;
        if (consumers[1].density !== 'cómoda') throw new Error('Reconnected consumer did not request the current context');
      })()`);
    }
    if (artifact === 'lifecycle-panel') {
      await page.frames()[1].evaluate(`(async () => {
        const host = document.querySelector('academy-lifecycle-panel');
        await window.IntlMsg.setLanguage('es');
        await host.updateComplete;
        const readCount = () => host.shadowRoot.querySelector('output')?.getAttribute('data-observation-count');
        if (readCount() !== '0') throw new Error('Lifecycle must expose its actual observation count');
        window.dispatchEvent(new Event('offline'));
        await host.updateComplete;
        if (readCount() !== '1') throw new Error('Connected observer missed the event');
        const parent = host.parentNode;
        host.remove();
        window.dispatchEvent(new Event('online'));
        await host.updateComplete;
        if (readCount() !== '1') throw new Error('Detached observer kept receiving events');
        parent.append(host);
        await host.updateComplete;
        window.dispatchEvent(new Event('offline'));
        await host.updateComplete;
        if (readCount() !== '2') throw new Error('Reconnection duplicated the observer');
        for (let index = 0; index < 3; index += 1) {
          host.connectionState = 'Etiqueta ' + index;
          await host.updateComplete;
        }
        window.dispatchEvent(new Event('online'));
        await host.updateComplete;
        if (readCount() !== '3') throw new Error('Rendering installed extra listeners');
        await window.IntlMsg.setLanguage('en');
        await host.updateComplete;
        if (!host.shadowRoot.textContent.includes('Observed changes: 3')) throw new Error('Lifecycle lost translations after reconnect');
      })()`);
    }
    if (artifact === 'status-badge') {
      await page.frames()[1].evaluate(`(async () => {
        const host = document.querySelector('academy-status-badge');
        const text = host.shadowRoot.querySelector('academy-type-text');
        if (!text) throw new Error('Status must compose the scoped typography');
        await text.updateComplete;
        if (host.getBoundingClientRect().height > 96) throw new Error('A status indicator must not occupy a full content card');
        if (!host.shadowRoot.querySelector('button')) throw new Error('The inspect control must remain keyboard accessible');
      })()`);
    }
    if (artifact === 'state-panel') {
      await page.frames()[1].evaluate(`(async () => {
        const host = document.querySelector('academy-state-panel');
        await window.IntlMsg.setLanguage('es');
        const retries = [];
        host.addEventListener('academy-state-panel-retry', (event) => retries.push(event));
        for (const [state, text] of [['loading', 'Cargando datos'], ['empty', 'No hay resultados'], ['error', 'No pudimos cargar los datos'], ['success', 'Datos disponibles'], ['unexpected', 'Cargando datos']]) {
          host.state = state;
          await host.updateComplete;
          const panel = host.shadowRoot.querySelector('[data-state]');
          const expected = state === 'unexpected' ? 'loading' : state;
          if (!panel || panel.dataset.state !== expected) throw new Error('Missing exclusive state: ' + state);
          if (!panel.textContent.includes(text)) throw new Error('Missing translated state message: ' + state);
          if (panel.getAttribute('aria-busy') !== String(expected === 'loading')) throw new Error('Incorrect loading semantics');
          if (panel.getAttribute('role') !== (expected === 'error' ? 'alert' : 'status')) throw new Error('Incorrect state announcement');
          if (Boolean(panel.querySelector('slot')) !== (expected === 'success')) throw new Error('Results are visible outside success');
          const action = panel.querySelector('academy-action-button');
          if (Boolean(action) !== (state === 'error')) throw new Error('Retry must exist only for errors');
          if (action) { await action.updateComplete; action.shadowRoot.querySelector('button').click(); }
          else host.handleAction();
          if (retries.length !== (['loading', 'empty'].includes(state) ? 0 : 1)) throw new Error('Retry emitted outside error state');
        }
        if (retries[0].detail.state !== 'error' || !retries[0].bubbles || !retries[0].composed) throw new Error('Retry lost its public contract');
        host.state = 'error';
        await window.IntlMsg.setLanguage('en');
        await host.updateComplete;
        if (!host.shadowRoot.textContent.includes('We could not load the data')) throw new Error('State did not translate on the same host');
      })()`);
    }
    if (artifact === 'action-button') {
      const frame = page.frames()[1];
      await frame.evaluate(`(async () => {
        const host = document.querySelector('academy-action-button');
        window.actionEvents = [];
        host.addEventListener('academy-action-button-activate', (event) => window.actionEvents.push(event.detail));
        host.disabled = true;
        await host.updateComplete;
        const button = host.shadowRoot.querySelector('button');
        if (!host.hasAttribute('disabled') || !button.disabled) throw new Error('disabled must reflect and disable the native control');
        button.click();
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        if (window.actionEvents.length) throw new Error('Disabled action emitted an event');
        host.removeAttribute('disabled');
        await host.updateComplete;
        if (host.disabled || button.disabled) throw new Error('Removing disabled must restore interaction');
        button.focus();
      })()`);
      const button = page.frameLocator('iframe').locator('academy-action-button button');
      await button.press('Enter');
      await button.press('Space');
      await frame.evaluate(`(async () => {
        if (window.actionEvents.length !== 2) throw new Error('Enter and Space must each emit one intention');
        const host = document.querySelector('academy-action-button');
        host.setAttribute('disabled', '');
        await host.updateComplete;
      })()`);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await frame.evaluate(`(() => {
        if (window.actionEvents.length !== 2) throw new Error('Disabled keyboard interaction emitted an intention');
      })()`);
    }
    if (artifact === 'search-filter') {
      await page.frames()[1].evaluate(`(async () => {
        const host = document.querySelector('academy-search-filter');
        const action = host.shadowRoot.querySelector('academy-action-button');
        if (!action) throw new Error('Search must reuse the scoped action');
        await action.updateComplete;
        window.searchEvents = [];
        host.addEventListener('academy-search-filter-search', (event) => window.searchEvents.push(event.detail.query));
      })()`);
      const search = page.frameLocator('iframe').locator('academy-search-filter');
      await search.locator('input').fill('consulta por clic');
      await search.locator('academy-action-button button').click();
      await search.locator('input').fill('consulta por teclado');
      await search.locator('input').press('Enter');
      await page.frames()[1].evaluate(`(() => {
        document.querySelector('academy-search-filter').shadowRoot.querySelector('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }));
        if (JSON.stringify(window.searchEvents) !== JSON.stringify(['consulta por clic', 'consulta por teclado'])) throw new Error('Search must emit one exact query per gesture: ' + JSON.stringify(window.searchEvents));
      })()`);
    }
    if (artifact === 'catalog-shell') {
      const frame = page.frames()[1];
      await frame.evaluate(`(async () => {
        const host = document.querySelector('academy-catalog-shell');
        await window.IntlMsg.setLanguage('es');
        host.items = [{ id: 'coffee-1', name: 'Café' }, { id: 'tea-2', name: 'Té' }, { id: 'tea-3', name: 'Té' }];
        host.query = '';
        window.catalogSelections = [];
        host.addEventListener('academy-catalog-shell-select', (event) => window.catalogSelections.push(event.detail));
        await host.updateComplete;
        const list = host.shadowRoot.querySelector('academy-product-list');
        await list.updateComplete;
        if (list.items !== host.items) throw new Error('Catalog must pass consumer data to the list');
      })()`);
      const catalog = page.frameLocator('iframe').locator('academy-catalog-shell');
      const search = catalog.locator('academy-search-filter input');
      const cards = catalog.locator('academy-product-list academy-product-card');
      await search.fill(' TÉ ');
      await search.press('Enter');
      await frame.waitForFunction(`document.querySelector('academy-catalog-shell').shadowRoot.querySelector('academy-product-list').shadowRoot.querySelectorAll('academy-product-card').length === 2`);
      await cards.nth(1).locator('academy-action-button button').click();
      await frame.evaluate(`(() => {
        if (JSON.stringify(window.catalogSelections) !== JSON.stringify([{ id: 'tea-3', productName: 'Té' }])) throw new Error('Selection must preserve the exact item, including duplicate names');
      })()`);
      await search.fill('no existe');
      await search.press('Enter');
      await catalog.locator('academy-product-list').getByText('No hay productos para esta búsqueda.', { exact: true }).waitFor();
      if (await cards.count() !== 0) throw new Error('No-results search kept old cards');
      await catalog.locator('academy-product-list academy-action-button').filter({ hasText: 'Mostrar todos' }).getByRole('button').click();
      await frame.waitForFunction(`document.querySelector('academy-catalog-shell').shadowRoot.querySelector('academy-product-list').shadowRoot.querySelectorAll('academy-product-card').length === 3`);
      if (await search.inputValue() !== '') throw new Error('Clearing results did not reset the search input');
      await frame.evaluate(`(() => {
        const host = document.querySelector('academy-catalog-shell');
        if (host.items.length !== 3 || host.items[2].id !== 'tea-3') throw new Error('Filtering mutated the input collection');
      })()`);
    }
  }
  await checkWorkspace(createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS['product-card']).snapshot, 'player-challenge');
  const challengeResults = await page.evaluate<boolean[]>(`(async (tests) => {
    const frame = document.querySelector('iframe');
    const results = [];
    for (const test of tests) {
      const response = await new Promise((resolve, reject) => {
        const validationId = 'browser-verification-' + test.id;
        const finish = (error, result) => {
          clearTimeout(timer);
          window.removeEventListener('message', receive);
          if (error) reject(error); else resolve(result);
        };
        const receive = (event) => {
          if (event.source !== frame.contentWindow || event.data?.validationId !== validationId) return;
          if (event.data.type === 'result') finish(null, event.data.result);
          else finish(new Error(event.data.message ?? event.data.type));
        };
        const timer = setTimeout(() => finish(new Error('Challenge validation timed out')), 8000);
        window.addEventListener('message', receive);
        frame.contentWindow.postMessage({ source: 'aula-validator', type: 'run', validationId, script: test.customValidatorScript, awaitedTags: ['academy-product-card'] }, '*');
      });
      results.push(response.passed === true);
    }
    return results;
  })(${JSON.stringify(OPEN_CELLS_SCRIMS['open-cells-06'].challenges[0].tests)})`);
  if (challengeResults.some((passed) => !passed)) throw new Error('The player challenge rejected the complete component.');
  const results = await checkWorkspace(complete, 'complete-feature');
  const failures = results.filter((result) => !result.passed);
  if (failures.length) throw new Error(JSON.stringify(failures));
  for (const required of ['feature-navigation', 'feature-filter', 'feature-return', 'feature-state-loading', 'feature-state-empty', 'feature-state-error', 'feature-retry', 'feature-i18n']) {
    if (!results.some((result) => result.id === required)) throw new Error(`Missing browser evidence: ${required}`);
  }
  const starter = await checkWorkspace(createCellsCurriculumPracticeWorkspace(OPEN_CELLS_ARTIFACTS['account-detail']).snapshot, 'starter-feature');
  if (starter.every((result) => result.passed)) throw new Error('The incomplete exercise must fail.');
  const path = 'src/academy-account-detail.js';
  const mutated = { ...complete, files: { ...complete.files, [path]: { ...complete.files[path], content: complete.files[path].content.replace('this.query = event.detail.query;', 'this.query = "";') } } };
  const mutation = await checkWorkspace(mutated, 'broken-filter');
  if (mutation.find((result) => result.id === 'feature-filter')?.passed !== false) throw new Error('The browser checks missed a disconnected filter.');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await checkWorkspace(complete, 'mobile-feature');
  if (mobile.some((result) => !result.passed)) throw new Error('The narrow-viewport feature checks failed.');
  console.log(JSON.stringify({ applications: 5, selectionRoutes: ['home', 'favorites', 'search'], disabledAction: ['property', 'attribute', 'click', 'synthetic-click', 'Enter', 'Space', 'reenable'], statePanel: ['loading', 'empty', 'error', 'success', 'unknown', 'retry', 'i18n'], catalogFlow: ['shared-action', 'Enter', 'composition', 'filter', 'duplicate-name-selection', 'empty', 'clear'], complete: results.length, starterFails: starter.filter((result) => !result.passed).map((result) => result.id), mutationCaught: true, mobile: mobile.length }));
} finally {
  await browser.close();
}
