export const releaseRunnerSource = String.raw`import { readdir, readFile, mkdir, writeFile, realpath, symlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { QUALITY_GATES, canPromote } from './quality-gates.js';
import { auditArtifact } from './artifact.js';

const digest = (content) => createHash('sha256').update(content).digest('hex');
const excluded = new Set(['node_modules', 'build', '.git', '.release']);
async function capture(root, relative = '') {
  const files = [];
  for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
    if (!relative && excluded.has(entry.name)) continue;
    const path = relative ? relative + '/' + entry.name : entry.name;
    if (entry.isSymbolicLink()) throw new Error('Source symlink is not supported: ' + path);
    if (entry.isDirectory()) files.push(...await capture(root, path));
    else if (entry.isFile()) {
      const content = await readFile(join(root, path));
      files.push({ path, content, hash: digest(content) });
    } else throw new Error('Unsupported source entry: ' + path);
  }
  return files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
const fingerprint = (files) => digest(JSON.stringify(files.map(({ path, hash }) => ({ path, hash }))));
const root = await realpath('.');
const runId = randomUUID();
const runRoot = join(root, '.release', runId);
const stage = join(runRoot, 'workspace');
const source = await capture(root);
const sourceHash = fingerprint(source);
const report = { version: 1, runId, sourceHash, artifactHash: '', results: {}, ready: false, startedAt: new Date().toISOString() };
await mkdir(stage, { recursive: true });
try {
  for (const file of source) {
    const target = join(stage, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, { flag: 'wx' });
  }
  await symlink(await realpath(join(root, 'node_modules')), join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  for (const gate of QUALITY_GATES) {
    const [command, ...args] = gate.command.split(' ');
    const startedAt = Date.now();
    const outcome = spawnSync(command, args, { cwd: stage, encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, RELEASE_ARTIFACT_DIR: join(stage, 'build/prod') } });
    await writeFile(join(runRoot, gate.name + '.log'), (outcome.stdout || '') + (outcome.stderr || '') + (outcome.error?.message || ''));
    report.results[gate.name] = { status: outcome.status === 0 ? 'passed' : 'failed', exitCode: outcome.status, runId, sourceHash, artifactHash: '', durationMs: Date.now() - startedAt };
    console.log(gate.name + ': ' + report.results[gate.name].status);
    if (outcome.status !== 0) break;
    if (gate.name === 'build') report.artifactHash = (await auditArtifact(join(stage, 'build/prod'))).hash;
    if (report.artifactHash && (await auditArtifact(join(stage, 'build/prod'))).hash !== report.artifactHash) throw new Error('Artifact changed between gates');
  }
  if (fingerprint(await capture(root)) !== sourceHash) throw new Error('Source changed during the run');
  for (const file of source) {
    if (digest(await readFile(join(stage, file.path))) !== file.hash) throw new Error('A gate changed an input source: ' + file.path);
  }
  for (const result of Object.values(report.results)) result.artifactHash = report.artifactHash;
  report.ready = canPromote(report);
} catch (error) { report.error = error.message; }
report.finishedAt = new Date().toISOString();
await writeFile(join(runRoot, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ready: report.ready, report: join('.release', runId, 'report.json'), artifact: report.artifactHash ? join('.release', runId, 'workspace/build/prod') : null }));
if (!report.ready) process.exitCode = 1;
`;
