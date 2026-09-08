import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { releaseRunnerSource } from './releaseRunner';
import { connectReleasePanel } from './releasePanel';

const artifactSource = String.raw`import { readdir, readFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { createHash } from 'node:crypto';

const digest = (content) => createHash('sha256').update(content).digest('hex');

export async function auditArtifact(root) {
  const files = [];
  async function visit(relative = '') {
    for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
      const path = posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Symbolic links are not deliverable: ' + path);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const content = await readFile(join(root, path));
        if (path.endsWith('.json')) JSON.parse(content.toString('utf8'));
        files.push({ path, bytes: content.byteLength, hash: digest(content) });
      } else throw new Error('Unsupported artifact entry: ' + path);
    }
  }
  await visit();
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const paths = new Set(files.map((file) => file.path));
  if (!paths.has('index.html')) throw new Error('Missing index.html');
  const html = await readFile(join(root, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]);
  if (!references.length) throw new Error('Missing entry resources');
  for (const reference of references) {
    if (/^(?:[a-z]+:|\/\/)/i.test(reference)) throw new Error('External entry resource is not packaged');
    const path = posix.normalize(decodeURIComponent(reference.split(/[?#]/)[0]).replace(/^\//, ''));
    if (path.startsWith('../') || !paths.has(path)) throw new Error('Missing entry resource: ' + reference);
  }
  return { hash: digest(JSON.stringify(files)), files };
}
`;

const formatRulesSource = String.raw`export function checkSourceFormat(path, source) {
  const findings = [];
  source.split(/\r?\n/).forEach((line, index) => {
    if (/[ \t]+$/.test(line)) findings.push({ path, line: index + 1, rule: 'trailing-whitespace' });
    if (/^ *\t/.test(line)) findings.push({ path, line: index + 1, rule: 'tab-indentation' });
  });
  return findings;
}
`;

const formatCommandSource = String.raw`import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checkSourceFormat } from './format-rules.js';

const findings = [];
let checked = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'build', '.git'].includes(entry.name) || entry.name.startsWith('.')) continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Source symlink is not supported: ' + path);
    if (entry.isDirectory()) await visit(path);
    else if (/\.(?:js|json|scss|css|html)$/.test(path)) {
      checked++;
      findings.push(...checkSourceFormat(path, await readFile(path, 'utf8')));
    }
  }
}
await visit('.');
console.log(JSON.stringify({ gate: 'format', checked, findings }));
if (!checked || findings.length) process.exitCode = 1;
`;

const consumerSource = String.raw`import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import { auditArtifact } from './artifact.js';

const root = process.env.RELEASE_ARTIFACT_DIR || 'build/prod';
const artifact = await auditArtifact(root);
const contents = new Map();
for (const file of artifact.files) {
  const content = await readFile(join(root, file.path));
  if (createHash('sha256').update(content).digest('hex') !== file.hash) throw new Error('Artifact changed before serving');
  contents.set('/' + file.path, content);
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = createServer((request, response) => {
  let path;
  try { path = decodeURIComponent(request.url.split('?')[0]); }
  catch { response.writeHead(400).end(); return; }
  if (path === '/') path = '/index.html';
  const content = contents.get(path);
  if (!content) { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  response.end(content);
});
let browser;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http:' + '//127.0.0.1:' + server.address().port;
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push('Failed request: ' + request.url()));
  await page.route('**/*', (route) => {
    const requestUrl = new URL(route.request().url());
    if (['http:', 'https:'].includes(requestUrl.protocol) && requestUrl.origin !== origin) {
      errors.push('Unexpected external request');
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(origin);
  const home = page.locator('academy-home-page');
  await expect(home.getByRole('heading', { name: 'Estudio Cells', exact: true })).toBeVisible();
  await home.locator('academy-product-card').first().getByRole('button').click();
  const detail = page.locator('academy-product-detail-page');
  await expect(detail.getByRole('heading', { level: 1 })).toContainText('first');
  await detail.getByRole('button', { name: 'Volver al estudio' }).click();
  await expect(home).toBeVisible();
  expect(errors).toEqual([]);
  if ((await auditArtifact(root)).hash !== artifact.hash) throw new Error('Artifact changed during consumption');
  console.log(JSON.stringify({ gate: 'consumer-smoke', artifactHash: artifact.hash, files: artifact.files.length, navigation: true }));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
`;

export function connectReleaseWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = writeCellsFile(base, 'ci/artifact.js', artifactSource);
  workspace = writeCellsFile(workspace, 'ci/format-rules.js', formatRulesSource);
  workspace = writeCellsFile(workspace, 'ci/check-format.js', formatCommandSource);
  workspace = writeCellsFile(workspace, 'ci/consumer-smoke.js', consumerSource);
  workspace = writeCellsFile(workspace, 'ci/run-release.js', releaseRunnerSource);
  workspace = writeCellsFile(workspace, 'test/unit/release.test.js', `import { describe, expect, it } from 'vitest';
import { QUALITY_GATES, canPromote } from '../../ci/quality-gates.js';

function passingEvidence() {
  const evidence = { runId: 'test-run', sourceHash: 'a'.repeat(64), artifactHash: 'b'.repeat(64), results: {} };
  for (const gate of QUALITY_GATES) evidence.results[gate.name] = { status: 'passed', exitCode: 0, runId: evidence.runId, sourceHash: evidence.sourceHash, artifactHash: evidence.artifactHash };
  return evidence;
}
describe('release evidence consistency', () => {
  it('requires all gates from the same execution and artifact', () => {
    const evidence = passingEvidence();
    expect(canPromote(evidence)).toBe(true);
    evidence.results['consumer-smoke'].artifactHash = 'c'.repeat(64);
    expect(canPromote(evidence)).toBe(false);
  });
  it('rejects failures, missing results and bare status strings', () => {
    const evidence = passingEvidence();
    evidence.results.tests.exitCode = 1;
    expect(canPromote(evidence)).toBe(false);
    expect(canPromote({})).toBe(false);
    expect(canPromote(Object.fromEntries(QUALITY_GATES.map((gate) => [gate.name, 'passed'])))).toBe(false);
  });
});
`);
  workspace = writeCellsFile(workspace, '.gitignore', (workspace.snapshot.files['.gitignore']?.content || 'node_modules/\nbuild/\n') + '\n.release/\n');
  workspace = writeCellsFile(workspace, 'docs/release.md', `# Una entrega necesita resultados, no etiquetas

## Preparación

Exporta el proyecto e instala sus dependencias. Conserva el archivo de bloqueo que genere el gestor y usa npm ci en tu entorno de integración una vez exista ese bloqueo. El proyecto declara Playwright para la prueba de consumo; prepara Chromium con npx playwright install chromium. Si ya tienes Chrome instalado, PLAYWRIGHT_CHANNEL=chrome permite usar ese canal.

## Ejecución

Ejecuta npm run release:check. El runner crea .release/<identificador>/workspace y copia las fuentes sin build anterior. Reutiliza las dependencias instaladas: aísla fuentes y artefactos, pero no sustituye una instalación limpia ni garantiza un entorno hermético.

Las cinco puertas se ejecutan en orden y paran ante el primer fallo:

1. format:check comprueba espacios al final de línea y tabuladores de indentación, sin reescribir archivos.
2. test ejecuta cells app:test.
3. build ejecuta cells app:build -c prod.js en la copia sin artefacto anterior.
4. package:audit inspecciona los archivos compilados, sus referencias de entrada y su huella SHA-256. No es una auditoría de vulnerabilidades de dependencias.
5. test:consumer sirve esos mismos bytes localmente y recorre Inicio, detalle y regreso en un navegador. Rechaza peticiones externas y errores de ejecución.

## Evidencia y límites

Cada ejecución guarda report.json y un log por comando junto a la copia. Las fuentes tienen una huella; el artefacto tiene otra, calculada a partir de rutas, tamaños y hashes de contenido. El runner comprueba que las fuentes no cambiaron y que las puertas posteriores siguen inspeccionando el mismo artefacto. No borra los informes anteriores ni despliega automáticamente.

ready solo es true cuando todas las puertas aprobaron y coinciden ejecución, fuente y artefacto. Un fallo deja ready false y las puertas posteriores sin ejecutar. Puedes comprobarlo introduciendo una aserción fallida en una copia de práctica y repitiendo el comando.

Carga report.json en Inicio para leerlo. El visor no autentica el archivo, no ejecuta comandos y no demuestra que pertenezca al proyecto abierto. No publiques el informe como certificación independiente: vuelve a ejecutar las comprobaciones antes de entregar y verifica que los archivos entregados conservan la huella registrada.

El artefacto validado está en la subcarpeta workspace/build/prod de esa ejecución. Guarda la evidencia del commit en tu sistema de integración y asóciala con sourceHash y artifactHash. No sustituyas ese directorio por un build posterior aunque también compile.
`);
  workspace = writeCellsFile(workspace, 'ci/check-artifact.js', `import { auditArtifact } from './artifact.js';
const artifact = await auditArtifact(process.env.RELEASE_ARTIFACT_DIR || 'build/prod');
console.log(JSON.stringify({ gate: 'package-audit', artifactHash: artifact.hash, files: artifact.files.length }));
`);
  const manifest = JSON.parse(workspace.snapshot.files['package.json'].content);
  manifest.scripts['package:audit'] = 'node ci/check-artifact.js';
  manifest.scripts['format:check'] = 'node ci/check-format.js';
  manifest.scripts['test:consumer'] = 'node ci/consumer-smoke.js';
  manifest.scripts['release:check'] = 'node ci/run-release.js';
  manifest.devDependencies['@playwright/test'] = '1.62.1';
  return connectReleasePanel(writeCellsFile(workspace, 'package.json', JSON.stringify(manifest, null, 2)));
}
