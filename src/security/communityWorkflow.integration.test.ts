import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('validación de mejoras comunitarias', () => {
  it('ejecuta el código no confiable sin secretos ni permisos de escritura', async () => {
    const workflow = await readFile('.github/workflows/community-improvement.yml', 'utf8');

    expect(workflow).toContain('pull_request:');
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).toContain('contents: read');
    expect(workflow).not.toContain('secrets.');
    expect(workflow).toContain('pnpm install --frozen-lockfile');
    expect(workflow).toContain('pnpm lint');
    expect(workflow).toContain('pnpm test');
    expect(workflow).toContain('pnpm build');
    expect(workflow).toContain('validate-community-change:');
  });
});
