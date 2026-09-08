import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.CELLS_PERFORMANCE_APP_URL;
  if (url) await page.goto(url);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:950px;border:0"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(82).snapshot).html);
  }
  const app = url ? page : page.frameLocator('iframe');
  const home = app.locator('academy-home-page');
  const panel = home.getByRole('region', { name: 'Presupuestos con evidencia' });
  await expect(panel.locator('[data-metric]')).toHaveCount(4);
  const navigation = panel.locator('[data-metric="routeTransitionMs"]');
  await expect(navigation).toHaveAttribute('data-status', 'unmeasured');
  const initial = await panel.locator('[data-metric="initialJavaScriptKb"]').getAttribute('data-measured');
  if (url) expect(Number(initial)).toBeGreaterThan(0);
  else await expect(panel.locator('[data-metric="initialJavaScriptKb"]')).toHaveAttribute('data-status', 'unmeasured');
  await home.locator('academy-product-card').first().getByRole('button').click();
  await app.locator('academy-product-detail-page').getByRole('button', { name: 'Volver al estudio' }).click();
  await expect(navigation).not.toHaveAttribute('data-status', 'unmeasured');
  expect(Number(await navigation.getAttribute('data-measured'))).toBeGreaterThanOrEqual(0);
  await expect(panel.locator('[data-metric="initialJavaScriptKb"]')).toHaveAttribute('data-measured', initial!);
  await home.getByRole('button', { name: 'Inglés', exact: true }).click();
  await expect(home.getByRole('region', { name: 'Evidence-based budgets' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await home.getByRole('button', { name: 'Spanish', exact: true }).click();
  const frame = url ? page.mainFrame() : page.frames()[1];
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/cells-performance-82-mobile.png', fullPage: true });
  if (!url) {
    const snapshot = createOpenCellsLessonWorkspace(82).snapshot;
    snapshot.files['performance-budget.json'].content = JSON.stringify({ initialJavaScriptKb: 180, initialCssKb: 45, routeTransitionMs: 0, retainedPages: 0 });
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(snapshot).html);
    await expect(panel.locator('[data-metric="retainedPages"]')).toHaveAttribute('data-status', 'exceeded');
    await expect(panel.locator('[data-metric="retainedPages"]')).toContainText('Exceso: 1.00');
    snapshot.files['performance-budget.json'].content = '{invalid';
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(snapshot).html);
    await expect(panel.getByRole('status')).toContainText('No se pudieron leer los límites');
    await expect(panel.locator('[data-metric]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ lesson: 82, runtime: url ? 'exported' : 'playground', baseline: true, navigation: true, locale: true, mobile: true }));
} finally { await browser.close(); }
