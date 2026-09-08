import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createCellsAppWorkspace } from '../src/engine/cells/cellsAppRecipes';
import { createCellsComponentWorkspace } from '../src/engine/cells/cellsRecipes';
import { exportCellsWorkspaceZip } from '../src/engine/cells/cellsZip';
import { createCellsCurriculumComponentWorkspace } from '../src/engine/cells/cellsCurriculumRecipes';
import { OPEN_CELLS_ARTIFACTS } from '../src/curriculum/open-cells/lessonProjects';

const cliPath = process.env.OPEN_CELLS_CLI_PATH;
const keepTemporaryProject = process.env.OPEN_CELLS_GATE_KEEP_TEMP === '1';
const publicRegistry = process.env.OPEN_CELLS_GATE_PUBLIC_REGISTRY === '1';
const componentIds = (process.env.OPEN_CELLS_GATE_COMPONENTS ?? '').split(',').map((id) => id.trim()).filter(Boolean);
interface PublicDeclaration {
  tagName?: string;
  events?: Array<{ name: string }>;
  members?: Array<{ attribute?: string }>;
  attributes?: Array<{ name: string }>;
}

function publicDeclaration(source: string, tagName: string): PublicDeclaration | undefined {
  const manifest = JSON.parse(source) as { modules: Array<{ declarations?: PublicDeclaration[] }> };
  return manifest.modules.flatMap((module) => module.declarations ?? []).find((declaration) => declaration.tagName === tagName);
}

for (const id of componentIds) {
  if (OPEN_CELLS_ARTIFACTS[id]?.kind !== 'component') throw new Error(`Componente desconocido para el gate: ${id}`);
}

if (!cliPath || !isAbsolute(cliPath)) {
  throw new Error('Define OPEN_CELLS_CLI_PATH con la ruta absoluta al archivo bin/cells.js de la CLI local.');
}
await access(cliPath, constants.R_OK);

function run(label: string, command: string, args: string[], cwd: string): void {
  process.stdout.write(`\n[gate] ${label}\n`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} terminó con código ${result.status ?? 'desconocido'}.`);
}

async function materialize(name: string, bytes: Uint8Array, root: string): Promise<string> {
  const zipPath = join(root, `${name}.zip`);
  const projectPath = join(root, name);
  await writeFile(zipPath, bytes);
  await mkdir(projectPath);
  run(`abrir ${name}.zip`, 'unzip', ['-q', zipPath, '-d', projectPath], root);
  run(`instalar ${name}`, 'npm', ['install', '--ignore-scripts', ...(publicRegistry ? ['--registry=https://registry.npmjs.org', '--userconfig=/dev/null'] : [])], projectPath);
  return projectPath;
}

const root = await mkdtemp(join(tmpdir(), 'open-cells-cli-gate-'));
try {
  const components = componentIds.length
    ? componentIds.map((id) => ({ name: OPEN_CELLS_ARTIFACTS[id].tagName, workspace: createCellsCurriculumComponentWorkspace(OPEN_CELLS_ARTIFACTS[id]).snapshot }))
    : [{ name: 'academy-learning-card', workspace: createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot }];
  for (const { name, workspace } of components) {
    const component = await materialize(name, exportCellsWorkspaceZip(workspace), root);
    run(`${name}: component:sass`, process.execPath, [cliPath, 'component:sass'], component);
    run(`${name}: component:test --coverage`, process.execPath, [cliPath, 'component:test', '--coverage'], component);
    await access(join(component, 'coverage/lcov.info'), constants.R_OK);
    run(`${name}: component:documentation`, process.execPath, [cliPath, 'component:documentation'], component);
    const expected = publicDeclaration(workspace.files['custom-elements.json'].content, name);
    const actual = publicDeclaration(await readFile(join(component, 'custom-elements.json'), 'utf8'), name);
    if (!expected) throw new Error(`${name}: el paquete original no declara su elemento público.`);
    if (!actual) throw new Error(`${name}: la documentación regenerada perdió el elemento público.`);
    for (const event of expected?.events ?? []) {
      if (!actual.events?.some((candidate: { name: string }) => candidate.name === event.name)) throw new Error(`${name}: la documentación regenerada perdió el evento ${event.name}.`);
    }
    for (const member of expected?.members ?? []) {
      if (member.attribute && !actual.attributes?.some((attribute: { name: string }) => attribute.name === member.attribute)) throw new Error(`${name}: la documentación regenerada perdió el atributo ${member.attribute}.`);
    }
    run(`${name}: component:build:demo`, process.execPath, [cliPath, 'component:build:demo'], component);
  }

  if (process.env.OPEN_CELLS_GATE_SKIP_APP !== '1') {
    const application = await materialize(
      'academy-store-app',
      exportCellsWorkspaceZip(createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot),
      root,
    );
    run('app:test', process.execPath, [cliPath, 'app:test'], application);
    run('app:build -c prod.js', process.execPath, [cliPath, 'app:build', '-c', 'prod.js'], application);
  }

  process.stdout.write(`\n[gate] ${components.length} componentes y ${process.env.OPEN_CELLS_GATE_SKIP_APP === '1' ? 0 : 1} aplicaciones continuaron correctamente con la CLI real.\n`);
} finally {
  if (keepTemporaryProject) {
    process.stdout.write(`\n[gate] Diagnóstico conservado en ${root}\n`);
  } else {
    await rm(root, { recursive: true, force: true });
  }
}
