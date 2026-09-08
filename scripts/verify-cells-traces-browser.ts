import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.CELLS_TRACE_APP_URL;
  if (url) await page.goto(url);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:950px;border:0"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(80).snapshot).html);
  }
  const app = url ? page : page.frameLocator('iframe');
  const home = app.locator('academy-home-page');
  const panel = home.getByRole('region', { name: 'Sigue el recorrido de una acción' });
  await expect(home).toBeVisible();
  await expect(panel).toContainText('Todavía no hay trazas');
  await home.locator('academy-product-card').first().getByRole('button').click();
  const detail = app.locator('academy-product-detail-page');
  await expect(detail.getByRole('heading', { level: 1 })).toContainText('Proyecto Museo');
  await detail.getByRole('button', { name: 'Volver al estudio' }).click();
  const rows = panel.locator('[data-trace-id]');
  await expect(rows).toHaveCount(5);
  expect(await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-stage')))).toEqual(['selection', 'navigation', 'data', 'render', 'project.open']);
  const firstIds = await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-trace-id')));
  expect(new Set(firstIds).size).toBe(1);
  expect(await rows.evaluateAll((nodes) => nodes.every((node) => node.getAttribute('data-status') === 'ok'))).toBe(true);
  await expect(panel).not.toContainText('Proyecto Museo');
  await panel.getByRole('button', { name: 'Probar un proyecto inexistente' }).click();
  await expect(detail).toContainText('No pudimos abrir este proyecto');
  await detail.getByRole('button', { name: 'Volver al estudio' }).click();
  await expect(rows).toHaveCount(10);
  const records = await rows.evaluateAll((nodes) => nodes.map((node) => ({ id: node.getAttribute('data-trace-id'), stage: node.getAttribute('data-stage'), status: node.getAttribute('data-status') })));
  expect(records[5].id).not.toBe(firstIds[0]);
  expect(records.slice(5).every((record) => record.id === records[5].id)).toBe(true);
  expect(records[7]).toMatchObject({ stage: 'data', status: 'error' });
  expect(records[9]).toMatchObject({ stage: 'project.open', status: 'error' });
  await home.getByRole('button', { name: 'Inglés', exact: true }).click();
  await expect(home.getByRole('region', { name: 'Follow one action from start to finish' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await home.getByRole('button', { name: 'Spanish', exact: true }).click();
  const frame = url ? page.mainFrame() : page.frames()[1];
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/cells-traces-80-mobile.png', fullPage: true });
  await panel.getByRole('button', { name: 'Limpiar trazas' }).click();
  await expect(rows).toHaveCount(0);
  await expect(panel).toContainText('Todavía no hay trazas');
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ lesson: 80, runtime: url ? 'exported' : 'playground', correlation: true, success: true, error: true, privacy: true, locale: true, mobile: true }));
} finally { await browser.close(); }
