import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const buildDir = process.env.CELLS_SW_BUILD_DIR;
let release = 'v1';
const server = buildDir ? createServer(async (request, response) => {
  const root = resolve(buildDir);
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    let content = await readFile(file);
    if (pathname === '/sw.js' && release !== 'v1') {
      let worker = content.toString().replace("SHELL_VERSION = 'v1'", "SHELL_VERSION = '" + release + "'");
      if (release === 'broken') worker = worker.replace('const SHELL_MANIFEST = [', 'const SHELL_MANIFEST = [{"revision":"missing","url":"assets/missing-resource.js"},');
      content = Buffer.from(worker);
    }
    response.writeHead(200, { 'Content-Type': ({ '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css' } as Record<string, string>)[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(404).end(); }
}) : undefined;
if (server) await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
const address = server?.address();
const url = address && typeof address === 'object' ? `http://127.0.0.1:${address.port}` : undefined;
const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  if (url) await page.goto(url);
  else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:950px;border:0"></iframe>');
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, source) => { frame.srcdoc = source; }, buildCellsPreviewDocument(createOpenCellsLessonWorkspace(79).snapshot).html);
  }
  const app = url ? page : page.frameLocator('iframe');
  const home = app.locator('academy-home-page');
  await expect(home).toBeVisible();
  const panel = home.getByRole('region', { name: 'Tu estudio, incluso sin conexión' });
  await expect(panel).toBeVisible();
  if (!url) {
    await expect(panel).toContainText('Disponible al exportar');
    await expect(panel.getByRole('button', { name: 'Buscar actualización' })).toBeDisabled();
  } else {
    await expect(panel).toContainText('Shell listo', { timeout: 20000 });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.evaluate(() => caches.open('unrelated-application-cache'));
    const oldCaches = await page.evaluate(() => caches.keys());
    expect(oldCaches.filter((key) => key.startsWith('academy-studio-shell-'))).toHaveLength(1);
    await panel.getByRole('button', { name: 'Consultar dato de red' }).click();
    await expect(panel).toContainText('Dato recibido de la red');
    await context.setOffline(true);
    await expect(panel).toContainText('Navegador sin conexión');
    await page.reload();
    await expect(home).toBeVisible();
    await panel.getByRole('button', { name: 'Consultar dato de red' }).click();
    await expect(panel).toContainText('No se pudo consultar la red');
    await home.locator('academy-product-card').first().getByRole('button').click();
    await expect(app.locator('academy-product-detail-page')).toBeVisible();
    await app.locator('academy-product-detail-page').getByRole('button').click();
    await expect(home).toBeVisible();
    await context.setOffline(false);
    release = 'broken';
    await panel.getByRole('button', { name: 'Buscar actualización' }).click();
    await expect(panel).toContainText('No se pudo comprobar la actualización', { timeout: 20000 });
    await expect(panel.getByRole('button', { name: 'Actualizar y recargar' })).toHaveCount(0);
    expect(await page.evaluate(() => caches.keys())).toEqual(expect.arrayContaining(oldCaches));
    release = 'v2';
    await panel.getByRole('button', { name: 'Buscar actualización' }).click();
    await expect(panel.getByRole('button', { name: 'Actualizar y recargar' })).toBeVisible({ timeout: 20000 });
    expect(await page.evaluate(() => caches.keys())).toEqual(expect.arrayContaining(oldCaches));
    await panel.getByRole('button', { name: 'Actualizar y recargar' }).click();
    await expect(panel).toContainText('Shell listo', { timeout: 20000 });
    await expect.poll(() => page.evaluate(() => caches.keys())).not.toEqual(expect.arrayContaining(oldCaches));
    expect(await page.evaluate(() => caches.keys())).toContain('unrelated-application-cache');
    await expect(panel.getByRole('button', { name: 'Actualizar y recargar' })).toHaveCount(0);
  }
  await home.getByRole('button', { name: 'Inglés', exact: true }).click();
  await expect(home.getByRole('region', { name: 'Your studio, even offline' })).toBeVisible();
  await home.getByRole('button', { name: 'Spanish', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = url ? page.mainFrame() : page.frames()[1];
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/cells-offline-79-mobile.png', fullPage: true });
  console.log(JSON.stringify({ lesson: 79, runtime: url ? 'exported-real-service-worker' : 'playground-capability-boundary', offline: Boolean(url), update: Boolean(url), locale: true, mobile: true }));
} finally {
  await browser.close();
  if (server) await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
}
