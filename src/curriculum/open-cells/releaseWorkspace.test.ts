import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from './lessonWorkspaces';

const temporaryRoots: string[] = [];
afterEach(async () => { await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'cells-release-test-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'assets'));
  await writeFile(join(root, 'index.html'), '<script type="module" src="./assets/app.js"></script>');
  await writeFile(join(root, 'assets/app.js'), 'export const ready = true;');
  return root;
}

async function artifactAuditor() {
  const file = createOpenCellsLessonWorkspace(83).snapshot.files['ci/artifact.js'];
  expect(file).toBeDefined();
  return (await import(`data:text/javascript;base64,${Buffer.from(file.content).toString('base64')}`)).auditArtifact;
}

describe('release artifact audit', () => {
  it('exports an isolated release runner rather than a list of statuses', () => {
    const files = createOpenCellsLessonWorkspace(83).snapshot.files;
    expect(JSON.parse(files['package.json'].content).scripts['release:check']).toBe('node ci/run-release.js');
    expect(files['ci/run-release.js']).toBeDefined();
  });

  it('exports a browser consumer command with its declared dependency', () => {
    const files = createOpenCellsLessonWorkspace(83).snapshot.files;
    const manifest = JSON.parse(files['package.json'].content);
    expect(manifest.scripts['test:consumer']).toBe('node ci/consumer-smoke.js');
    expect(manifest.devDependencies['@playwright/test']).toBeDefined();
    expect(files['ci/consumer-smoke.js']).toBeDefined();
  });

  it('reports formatting locations without rewriting the source', async () => {
    const files = createOpenCellsLessonWorkspace(83).snapshot.files;
    const rules = files['ci/format-rules.js'];
    expect(rules).toBeDefined();
    const { checkSourceFormat } = await import(`data:text/javascript;base64,${Buffer.from(rules.content).toString('base64')}`);
    expect(checkSourceFormat('app.js', 'const ready = true;\n')).toEqual([]);
    expect(checkSourceFormat('app.js', 'const ready = true;  \n\tready;')).toEqual([
      { path: 'app.js', line: 1, rule: 'trailing-whitespace' },
      { path: 'app.js', line: 2, rule: 'tab-indentation' }
    ]);
    expect(JSON.parse(files['package.json'].content).scripts['format:check']).toBe('node ci/check-format.js');
  });

  it('exports an executable package audit command', () => {
    const files = createOpenCellsLessonWorkspace(83).snapshot.files;
    const manifest = JSON.parse(files['package.json'].content);
    expect(manifest.scripts['package:audit']).toBe('node ci/check-artifact.js');
    expect(files['ci/check-artifact.js']).toBeDefined();
  });

  it('hashes the exact file contents in stable path order', async () => {
    const audit = await artifactAuditor();
    const root = await fixture();
    const first = await audit(root);
    expect(first.files.map((file: { path: string }) => file.path)).toEqual(['assets/app.js', 'index.html']);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect((await audit(root)).hash).toBe(first.hash);
    await writeFile(join(root, 'assets/app.js'), 'export const ready = false;');
    expect((await audit(root)).hash).not.toBe(first.hash);
  });

  it('rejects missing entry resources and symbolic links', async () => {
    const audit = await artifactAuditor();
    const root = await fixture();
    await writeFile(join(root, 'index.html'), '<script src="./assets/missing.js"></script>');
    await expect(audit(root)).rejects.toThrow('Missing entry resource');
    await writeFile(join(root, 'index.html'), '<script src="./assets/app.js"></script>');
    await symlink(join(root, 'assets/app.js'), join(root, 'linked.js'));
    await expect(audit(root)).rejects.toThrow('Symbolic links');
  });
});
