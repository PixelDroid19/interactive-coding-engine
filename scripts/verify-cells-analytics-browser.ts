import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.CELLS_ANALYTICS_APP_URL;
  if (url) await page.goto(url);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:950px;border:0"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(81).snapshot).html);
  }
  const app = url ? page : page.frameLocator('iframe');
  const home = app.locator('academy-home-page');
  const panel = home.getByRole('region', { name: 'Qué recoge la analítica' });
  await expect(panel).toContainText('Todavía no hay eventos');
  await home.locator('academy-product-card').first().getByRole('button').click();
  const detail = app.locator('academy-product-detail-page');
  await expect(detail).toBeVisible();
  await detail.getByRole('button', { name: 'Volver al estudio' }).click();
  const rows = panel.locator('[data-analytics-event]');
  await expect(rows).toHaveCount(1);
  expect(JSON.parse(await rows.first().innerText())).toEqual({ name: 'catalog:item-selected', version: 1, properties: { itemId: 'first', source: 'home' } });
  await expect(panel).not.toContainText('Proyecto Museo');
  await panel.getByRole('button', { name: 'Probar un evento inválido' }).click();
  await expect(panel.getByRole('status')).toContainText('rechazado');
  await expect(rows).toHaveCount(1);
  await home.getByRole('button', { name: 'Inglés', exact: true }).click();
  await expect(home.getByRole('region', { name: 'What analytics collects' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await home.getByRole('button', { name: 'Spanish', exact: true }).click();
  const frame = url ? page.mainFrame() : page.frames()[1];
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/cells-analytics-81-mobile.png', fullPage: true });
  await panel.getByRole('button', { name: 'Limpiar eventos' }).click();
  await expect(rows).toHaveCount(0);
  await expect(panel).toContainText('Todavía no hay eventos');
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ lesson: 81, runtime: url ? 'exported' : 'playground', selection: true, schema: true, rejection: true, privacy: true, locale: true, mobile: true }));
} finally { await browser.close(); }
