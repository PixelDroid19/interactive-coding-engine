import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer, build } from 'vite';
import { chromium } from '@playwright/test';

const archive = process.argv[2];
if (!archive || !isAbsolute(archive)) throw new Error('Indica la ruta absoluta al paquete .tgz.');
const metadata = spawnSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' });
if (metadata.status !== 0) throw new Error('No se pudo leer el manifiesto del paquete.');
const manifest = JSON.parse(metadata.stdout) as { name: string };
if (manifest.name !== '@open-cells-learning/academy-component-workflow') throw new Error('Esta prueba verifica el paquete academy-component-workflow del curso.');
const root = await mkdtemp(join(tmpdir(), 'cells-package-consumer-'));
console.log(`Consumidor limpio: ${root}`);
await writeFile(join(root, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { [manifest.name]: `file:${archive}` } }));
const install = spawnSync('npm', ['install', '--ignore-scripts', '--registry=https://registry.npmjs.org', '--userconfig=/dev/null'], { cwd: root, stdio: 'inherit' });
if (install.status !== 0) throw new Error('No se pudo instalar el paquete en el consumidor.');
await writeFile(join(root, 'index.html'), '<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><script type="module" src="/consumer.js"></script></body></html>');
await writeFile(join(root, 'consumer.js'), `
import { installIntlMsg } from '${manifest.name}/runtime/academy-intl-msg.js';
import catalogs from '${manifest.name}/locales/locales.json' with { type: 'json' };
import { AcademyComponentWorkflow } from '${manifest.name}';
import '${manifest.name}/academy-component-workflow.js';
async function start() {
  await installIntlMsg({ catalogs, language: 'es' }).loadUrlResourcesComplete;
  const host = document.createElement('academy-component-workflow');
  if (!(host instanceof AcademyComponentWorkflow)) throw new Error('La entrada pública no coincide con el registro.');
  host.stage = 'Consumidor independiente';
  host.theme = 'oscuro';
  document.body.append(host);
  await host.updateComplete;
  if (!host.shadowRoot.textContent.includes(catalogs.es['component.workflow.title'])) throw new Error('No se cargó la traducción del paquete.');
  window.consumerReady = true;
}
void start();
`);
await build({ root, configFile: false, logLevel: 'warn' });
const server = await createServer({ root: join(root, 'dist'), configFile: false, server: { host: '127.0.0.1', port: 0 }, logLevel: 'warn' });
await server.listen();
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  browser = await chromium.launch({ executablePath: process.env.CELLS_BROWSER_EXECUTABLE, headless: true });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(server.resolvedUrls!.local[0]);
  await page.waitForFunction(() => (window as typeof window & { consumerReady?: boolean }).consumerReady);
  await page.locator('academy-component-workflow [data-workflow-stage]').waitFor();
  const evidence = await page.evaluate(async () => {
    const host = document.querySelector('academy-component-workflow')!;
    const theme = host.shadowRoot!.querySelector('academy-theme-preview') as HTMLElement & { updateComplete: Promise<boolean> };
    const media = host.shadowRoot!.querySelector('academy-media-tile') as HTMLElement & { updateComplete: Promise<boolean> };
    await Promise.all([theme.updateComplete, media.updateComplete]);
    const action = host.shadowRoot!.querySelector('.workflow-grid > academy-action-button') as HTMLElement & { updateComplete: Promise<boolean> };
    await action.updateComplete;
    let detail: unknown;
    host.addEventListener('academy-component-workflow-advance', (event) => { detail = (event as CustomEvent).detail; }, { once: true });
    action.shadowRoot!.querySelector('button')!.click();
    return { stage: host.shadowRoot!.querySelector('[data-workflow-stage]')!.textContent, theme: theme.getAttribute('data-theme'), image: Boolean(media.shadowRoot!.querySelector('img')), detail };
  });
  if (errors.length || evidence.stage !== 'Consumidor independiente' || evidence.theme !== 'oscuro' || !evidence.image || JSON.stringify(evidence.detail) !== JSON.stringify({ stage: 'Consumidor independiente' })) throw new Error(JSON.stringify({ errors, evidence }));
  console.log('Entrada pública, traducciones, tema y recurso visual funcionan en el consumidor limpio.');
} finally {
  await browser?.close();
  await server.close();
}
