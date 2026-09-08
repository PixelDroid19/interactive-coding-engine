import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.CELLS_MIGRATION_APP_URL;
  if (url) await page.goto(url);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:950px;border:0"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(84).snapshot).html);
  }
  const app = url ? page : page.frameLocator('iframe');
  const home = app.locator('academy-home-page');
  const panel = home.getByRole('region', { name: 'Migra sin mantener dos productos' });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Consumidor antiguo', exact: true }).click();
  await expect(panel.locator('[data-migration="legacy"]')).toContainText('2');
  await expect(home.locator('academy-product-card')).toHaveCount(2);
  await expect(panel.getByRole('status')).toContainText('compatibilidad temporal');
  await panel.getByRole('checkbox', { name: 'Simular retirada en la versión 2' }).check();
  await expect(home.locator('academy-product-card')).toHaveCount(0);
  await expect(panel.locator('[data-migration="rejected"]')).toContainText('2');
  await panel.getByRole('button', { name: 'Consumidor nuevo', exact: true }).click();
  await expect(home.locator('academy-product-card')).toHaveCount(2);
  await expect(panel.locator('[data-migration="legacy"]')).toContainText('0');
  await expect(panel.locator('[data-migration="rejected"]')).toContainText('0');
  await home.locator('academy-product-card').first().getByRole('button').click();
  await app.locator('academy-product-detail-page').getByRole('button', { name: 'Volver al estudio' }).click();
  await expect(home).toBeVisible();
  await home.getByRole('button', { name: 'Inglés', exact: true }).click();
  await expect(home.getByRole('region', { name: 'Migrate without keeping two products' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await home.getByRole('button', { name: 'Spanish', exact: true }).click();
  const frame = url ? page.mainFrame() : page.frames()[1];
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/cells-migration-84-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ lesson: 84, runtime: url ? 'exported' : 'playground', legacy: true, current: true, retirement: true, navigation: true, locale: true, mobile: true }));
} finally { await browser.close(); }
