import { expect, test, type Page } from '@playwright/test';

const EXPECTED_COMMIT = process.env.EXPECTED_COMMIT?.trim().toLowerCase();
const ROUTES = ['/', '/cursos', '/playground'] as const;
const LOCAL_PREVIEW = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(
  process.env.PRODUCTION_BASE_URL?.trim() ?? '',
);

if (!EXPECTED_COMMIT || !/^[a-f0-9]{40}$/.test(EXPECTED_COMMIT)) {
  throw new Error('EXPECTED_COMMIT debe contener el SHA completo que se quiere verificar.');
}

async function waitForExactDeployment(page: Page): Promise<void> {
  const deadline = Date.now() + 12 * 60_000;
  let deployedSha: string | null = null;
  while (Date.now() < deadline) {
    const response = await page.goto(`/?deployment=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    if (response?.status() === 200) {
      deployedSha = await page.locator('meta[name="devt-build-sha"]').getAttribute('content');
      if (deployedSha === EXPECTED_COMMIT) return;
    }
    await page.waitForTimeout(5_000);
  }
  throw new Error(`production_commit_mismatch: esperado=${EXPECTED_COMMIT} recibido=${deployedSha ?? 'ausente'}`);
}

test('el commit desplegado arranca React y mantiene navegables las rutas públicas', async ({ page, request }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const localCorsNoise = LOCAL_PREVIEW && (
      text.includes("from origin 'http://127.0.0.1")
      || text === 'Failed to load resource: net::ERR_FAILED'
    );
    if (!localCorsNoise) consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await waitForExactDeployment(page);

  for (const route of ROUTES) {
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.status(), `${route} debe responder 200`).toBe(200);
    await expect(page.locator('#root > *').first(), `${route} debe montar React`).toBeVisible();
    const visibleText = (await page.locator('#root').innerText()).replace(/\s+/g, ' ').trim();
    expect(visibleText.length, `${route} debe mostrar contenido real`).toBeGreaterThan(20);
    expect(visibleText).not.toMatch(/application error|internal server error|algo salió mal al iniciar/i);
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflows, `${route} no debe desbordar horizontalmente en escritorio`).toBe(false);
  }

  const health = await request.get('https://api.devt.lat/health/ready');
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({ status: 'ready' });
  expect(pageErrors, `errores no controlados: ${pageErrors.join(' | ')}`).toEqual([]);
  expect(consoleErrors, `console.error: ${consoleErrors.join(' | ')}`).toEqual([]);
});
