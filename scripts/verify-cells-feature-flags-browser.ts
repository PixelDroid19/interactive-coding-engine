import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.CELLS_FLAGS_APP_URL;
  if (url) await page.goto(url);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:950px;border:0"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(78).snapshot).html);
  }
  const app = url ? page : page.frameLocator('iframe');
  const home = app.locator('academy-home-page');
  const toggle = home.getByRole('checkbox', { name: 'Vista compacta' });
  await expect(home).toBeVisible();
  await expect(toggle).toBeVisible();
  await expect(toggle).not.toBeChecked();
  const art = home.locator('academy-product-card').first().locator('.project-art');
  await expect(art).toBeVisible();
  await toggle.check();
  await expect(art).toBeHidden();
  await expect(home.getByRole('status')).toContainText('Activada');
  await expect(home.locator('academy-product-card')).toHaveCount(2);
  await home.locator('academy-product-card').first().getByRole('button').click();
  await expect(app.locator('academy-product-detail-page')).toBeVisible();
  await app.locator('academy-product-detail-page').getByRole('button').click();
  await expect(toggle).toBeChecked();
  await expect(art).toBeHidden();
  await home.getByRole('button', { name: 'Inglés', exact: true }).click();
  await expect(home.getByRole('checkbox', { name: 'Compact view' })).toBeChecked();
  await expect(home.getByRole('status')).toContainText('Enabled');
  await page.setViewportSize({ width: 390, height: 844 });
  await home.getByRole('checkbox', { name: 'Compact view' }).uncheck();
  await expect(art).toBeVisible();
  await expect(home.getByRole('status')).toContainText('Disabled');
  await home.getByRole('button', { name: 'Spanish', exact: true }).click();
  const frame = url ? page.mainFrame() : page.frames()[1];
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/cells-flags-78-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await toggle.check();
  await page.screenshot({ path: '/tmp/cells-flags-78-desktop.png', fullPage: true });
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (url) {
    await page.reload();
    await expect(toggle).not.toBeChecked();
    await expect(art).toBeVisible();
  }
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ lesson: 78, runtime: url ? 'exported' : 'playground', flagChangesLayout: true, navigation: true, locale: true, mobile: true }));
} finally { await browser.close(); }
