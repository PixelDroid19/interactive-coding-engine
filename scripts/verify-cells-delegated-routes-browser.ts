import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined, headless: true });
try {
  const page = await browser.newPage();
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  const exportedUrl = process.env.CELLS_DELEGATED_APP_URL;
  if (exportedUrl) await page.goto(exportedUrl);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:900px"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, html) => { frame.srcdoc = html; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(76).snapshot).html);
  }
  const app = exportedUrl ? page : page.frameLocator('iframe');
  await app.locator('academy-home-page').waitFor();
  const link = app.getByLabel('Enlace del catálogo', { exact: true });
  await link.fill('/catalogo/proyecto%20uno');
  await app.getByRole('button', { name: 'Abrir enlace', exact: true }).click();
  await expect(app.locator('academy-product-detail-page')).toBeVisible();
  try {
    await expect(app.locator('academy-product-detail-page').getByRole('heading', { level: 1 })).toContainText('proyecto uno');
  } catch (error) {
    console.error(await app.locator('academy-product-detail-page').evaluate((element) => ({ params: (element as HTMLElement & { params?: unknown }).params, attributes: element.getAttributeNames().map((name) => [name, element.getAttribute(name)]) })));
    throw error;
  }
  await expect(app.locator('academy-home-page')).not.toBeVisible();
  if (exportedUrl) {
    await expect(page).toHaveURL(/#!\/catalogo\/proyecto%20uno$/);
    const sharedUrl = page.url();
    await page.reload();
    await expect(app.locator('academy-product-detail-page').getByRole('heading', { level: 1 })).toContainText('proyecto uno');
    const clean = await browser.newPage();
    await clean.goto(sharedUrl);
    await expect(clean.locator('academy-product-detail-page').getByRole('heading', { level: 1 })).toContainText('proyecto uno');
    await clean.close();
  }
  for (const invalid of ['/catalogos/otro', '/catalogo/a/b', 'https://example.com/catalogo/a', '/catalogo/%ZZ']) {
    await link.fill(invalid);
    await link.press('Enter');
    await expect(app.getByRole('status')).toHaveText('El enlace no pertenece al catálogo o está incompleto.');
    await expect(link).toHaveAttribute('aria-invalid', 'true');
    await expect(app.locator('academy-product-detail-page').getByRole('heading', { level: 1 })).toContainText('proyecto uno');
  }
  await link.fill('/catalogo/porcentaje%2520');
  await link.press('Enter');
  await expect(app.locator('academy-product-detail-page').getByRole('heading', { level: 1 })).toContainText('porcentaje%20');
  await link.fill('/catalogo');
  await link.press('Enter');
  await expect(app.locator('academy-home-page')).toBeVisible();
  const frame = exportedUrl ? page.mainFrame() : page.frames()[1];
  await frame.evaluate(`document.querySelector('academy-home-page').setLanguage('en')`);
  await expect(app.getByLabel('Catalog link', { exact: true })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Open link', exact: true })).toBeVisible();
  await frame.evaluate(`document.querySelector('academy-home-page').setLanguage('es')`);
  await page.setViewportSize({ width: 390, height: 844 });
  await link.fill('/catalogo/second');
  await link.press('Enter');
  await expect(app.locator('academy-product-detail-page')).toBeVisible();
  await expect(app.locator('academy-home-page')).not.toBeVisible();
  await expect(app.locator('academy-product-detail-page').getByRole('heading', { level: 1 })).toContainText('second');
  await expect(link).toHaveAttribute('aria-invalid', 'false');
  if (exportedUrl) {
    await page.goBack();
    await expect(app.locator('academy-home-page')).toBeVisible();
    await page.goForward();
    await expect(app.locator('academy-product-detail-page').getByRole('heading', { level: 1 })).toContainText('second');
  }
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: '/tmp/cells-delegated-76-' + (exportedUrl ? 'exported' : 'playground') + '.png' });
  expect(runtimeErrors).toEqual([]);
  console.log(JSON.stringify({ lesson: 76, runtime: exportedUrl ? 'exported-open-cells' : 'playground', decodedDetail: true, literalPercent: true, invalidKeepsPage: true, catalogHome: true, languageSwitch: true, mobile: true, nativeUrlChecks: exportedUrl ? ['reload', 'clean-context', 'back', 'forward'] : [] }));
} finally { await browser.close(); }
