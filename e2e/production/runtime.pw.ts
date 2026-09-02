import { expect, test, type Page } from '@playwright/test';
import { waitForStableDeployment } from './deploymentReadiness';

const EXPECTED_COMMIT = process.env.EXPECTED_COMMIT?.trim().toLowerCase();
const ROUTES = ['/', '/cursos', '/playground'] as const;
const LOCAL_PREVIEW = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(
  process.env.PRODUCTION_BASE_URL?.trim() ?? '',
);

if (!EXPECTED_COMMIT || !/^[a-f0-9]{40}$/.test(EXPECTED_COMMIT)) {
  throw new Error('EXPECTED_COMMIT debe contener el SHA completo que se quiere verificar.');
}

test('el commit desplegado arranca React y mantiene navegables las rutas públicas', async ({ page, request }) => {
  const attemptConsoleErrors: string[] = [];
  const attemptPageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const localCorsNoise = LOCAL_PREVIEW && (
      text.includes("from origin 'http://127.0.0.1")
      || text === 'Failed to load resource: net::ERR_FAILED'
    );
    if (!localCorsNoise) attemptConsoleErrors.push(text);
  });
  page.on('pageerror', (error) => attemptPageErrors.push(error.message));

  for (const route of ROUTES) {
    const ready = await waitForStableDeployment({
      expectedCommit: EXPECTED_COMMIT,
      timeoutMs: route === '/' ? 12 * 60_000 : 2 * 60_000,
      now: Date.now,
      sleep: (delayMs) => page.waitForTimeout(delayMs),
      probe: async () => {
        attemptConsoleErrors.length = 0;
        attemptPageErrors.length = 0;
        const separator = route.includes('?') ? '&' : '?';
        const response = await page.goto(`${route}${separator}deployment=${Date.now()}`, { waitUntil: 'domcontentloaded' });
        const deployedSha = response?.status() === 200
          ? await page.locator('meta[name="devt-build-sha"]').getAttribute('content')
          : null;
        let reactMounted = false;
        if (response?.status() === 200 && deployedSha === EXPECTED_COMMIT) {
          reactMounted = await page.locator('#root > *').first().isVisible().catch(() => false);
          if (!reactMounted) {
            reactMounted = await page.locator('#root > *').first()
              .waitFor({ state: 'visible', timeout: 10_000 })
              .then(() => true)
              .catch(() => false);
          }
        }
        return { status: response?.status() ?? null, deployedSha, reactMounted };
      },
    });
    expect(ready.status, `${route} debe responder 200`).toBe(200);
    expect(ready.deployedSha, `${route} debe servir el commit exacto`).toBe(EXPECTED_COMMIT);
    expect(ready.reactMounted, `${route} debe montar React`).toBe(true);
    const visibleText = (await page.locator('#root').innerText()).replace(/\s+/g, ' ').trim();
    expect(visibleText.length, `${route} debe mostrar contenido real`).toBeGreaterThan(20);
    expect(visibleText).not.toMatch(/application error|internal server error|algo salió mal al iniciar/i);
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflows, `${route} no debe desbordar horizontalmente en escritorio`).toBe(false);
    consoleErrors.push(...attemptConsoleErrors);
    pageErrors.push(...attemptPageErrors);
  }

  const health = await request.get('https://api.devt.lat/health/ready');
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({ status: 'ready' });
  expect(pageErrors, `errores no controlados: ${pageErrors.join(' | ')}`).toEqual([]);
  expect(consoleErrors, `console.error: ${consoleErrors.join(' | ')}`).toEqual([]);
});
