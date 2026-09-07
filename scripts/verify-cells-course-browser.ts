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
  for (const artifact of ['action-button', 'status-badge', 'state-panel', 'product-card', 'product-list', 'search-filter', 'language-switcher', 'catalog-shell']) {
    const results = await checkWorkspace(createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS[artifact]).snapshot, artifact);
    const failures = results.filter((result) => !result.passed);
    if (failures.length) throw new Error(`${artifact}: ${JSON.stringify(failures)}`);
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
  console.log(JSON.stringify({ applications: 5, selectionRoutes: ['home', 'favorites', 'search'], disabledAction: ['property', 'attribute', 'click', 'synthetic-click', 'Enter', 'Space', 'reenable'], complete: results.length, starterFails: starter.filter((result) => !result.passed).map((result) => result.id), mutationCaught: true, mobile: mobile.length }));
} finally {
  await browser.close();
}
