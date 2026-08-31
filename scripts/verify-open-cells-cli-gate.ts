import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createCellsAppWorkspace } from '../src/engine/cells/cellsAppRecipes';
import { createCellsComponentWorkspace } from '../src/engine/cells/cellsRecipes';
import { exportCellsWorkspaceZip } from '../src/engine/cells/cellsZip';

const cliPath = process.env.OPEN_CELLS_CLI_PATH;
const keepTemporaryProject = process.env.OPEN_CELLS_GATE_KEEP_TEMP === '1';

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
  run(`instalar ${name}`, 'npm', ['install', '--ignore-scripts'], projectPath);
  return projectPath;
}

const root = await mkdtemp(join(tmpdir(), 'open-cells-cli-gate-'));
try {
  const component = await materialize(
    'academy-learning-card',
    exportCellsWorkspaceZip(createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot),
    root,
  );
  run('component:test --coverage', process.execPath, [cliPath, 'component:test', '--coverage'], component);
  run('component:build:demo', process.execPath, [cliPath, 'component:build:demo'], component);

  const application = await materialize(
    'academy-store-app',
    exportCellsWorkspaceZip(createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot),
    root,
  );
  run('app:test', process.execPath, [cliPath, 'app:test'], application);
  run('app:build -c prod.js', process.execPath, [cliPath, 'app:build', '-c', 'prod.js'], application);

  process.stdout.write('\n[gate] Componente y aplicación continuaron correctamente con la CLI real.\n');
} finally {
  if (keepTemporaryProject) {
    process.stdout.write(`\n[gate] Diagnóstico conservado en ${root}\n`);
  } else {
    await rm(root, { recursive: true, force: true });
  }
}
