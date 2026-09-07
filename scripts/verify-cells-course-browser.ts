import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { OPEN_CELLS_ARTIFACTS } from '../src/curriculum/open-cells/lessonProjects';
import { OPEN_CELLS_SCRIMS } from '../src/curriculum/open-cells/course';
import { createCellsCurriculumComponentWorkspace, createCellsCurriculumPracticeWorkspace } from '../src/engine/cells/cellsCurriculumRecipes';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';
import { instrumentCellsSource } from '../src/engine/cells/cellsPreviewInstrumentation';
import type { WorkspaceSnapshot } from '../src/types/scrim';

const executablePath = process.env.CELLS_BROWSER_EXECUTABLE
  ?? (existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const complete = createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS['account-detail']).snapshot;

async function checkWorkspace(workspace: WorkspaceSnapshot, runId: string) {
  await page.goto('about:blank');
  await page.setContent('<iframe title="Cells contract fixture" style="width:100%;height:850px;border:0"></iframe>');
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
  for (const artifact of ['action-button', 'status-badge', 'state-panel', 'product-card', 'product-list', 'search-filter', 'language-switcher', 'catalog-shell']) {
    const results = await checkWorkspace(createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS[artifact]).snapshot, artifact);
    const failures = results.filter((result) => !result.passed);
    if (failures.length) throw new Error(`${artifact}: ${JSON.stringify(failures)}`);
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
  console.log(JSON.stringify({ complete: results.length, starterFails: starter.filter((result) => !result.passed).map((result) => result.id), mutationCaught: true, mobile: mobile.length }));
} finally {
  await browser.close();
}
