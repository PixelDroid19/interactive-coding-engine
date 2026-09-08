import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const report = process.env.CELLS_RELEASE_REPORT;
if (!report) throw new Error('Provide CELLS_RELEASE_REPORT from a real release:check run');
const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.CELLS_RELEASE_APP_URL;
  if (url) await page.goto(url);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:950px;border:0"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(83).snapshot).html);
  }
  const app = url ? page : page.frameLocator('iframe');
  const home = app.locator('academy-home-page');
  const panel = home.getByRole('region', { name: 'Revisa una entrega' });
  await expect(panel).toContainText('Todavía no has cargado un informe');
  await panel.getByLabel('Cargar informe JSON').setInputFiles(report);
  await expect(panel.getByRole('status')).toContainText('El informe declara las cinco puertas aprobadas');
  await expect(panel.locator('[data-gate]')).toHaveCount(5);
  await expect(panel.locator('[data-gate-status="passed"]')).toHaveCount(5);
  if (process.env.CELLS_RELEASE_FAILED_REPORT) {
    await panel.getByLabel('Cargar informe JSON').setInputFiles(process.env.CELLS_RELEASE_FAILED_REPORT);
    await expect(panel.getByRole('status')).toContainText('La entrega no está aprobada');
    await expect(panel.locator('[data-gate="tests"]')).toHaveAttribute('data-gate-status', 'failed');
  }
  await home.getByRole('button', { name: 'Inglés', exact: true }).click();
  await expect(home.getByRole('region', { name: 'Review a delivery' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await home.getByRole('button', { name: 'Spanish', exact: true }).click();
  const frame = url ? page.mainFrame() : page.frames()[1];
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/cells-release-83-mobile.png', fullPage: true });
  await panel.getByLabel('Cargar informe JSON').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') });
  await expect(panel.getByRole('status')).toContainText('No se pudo leer el informe');
  await expect(panel.locator('[data-gate]')).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ lesson: 83, runtime: url ? 'exported' : 'playground', actualReport: true, invalidReport: true, locale: true, mobile: true }));
} finally { await browser.close(); }
