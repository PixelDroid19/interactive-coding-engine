import { describe, expect, it, vi } from 'vitest';
import { waitForStableDeployment } from '../../e2e/production/deploymentReadiness';

describe('barrera de despliegue de produccion', () => {
  it('no acepta el SHA nuevo hasta que su aplicacion tambien monta React', async () => {
    const probe = vi.fn()
      .mockResolvedValueOnce({ status: 200, deployedSha: 'a'.repeat(40), reactMounted: false })
      .mockResolvedValueOnce({ status: 200, deployedSha: 'a'.repeat(40), reactMounted: true });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(waitForStableDeployment({
      expectedCommit: 'a'.repeat(40),
      probe,
      sleep,
      timeoutMs: 1_000,
      now: (() => {
        let value = 0;
        return () => value += 10;
      })(),
    })).resolves.toEqual({ status: 200, deployedSha: 'a'.repeat(40), reactMounted: true });

    expect(probe).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('incluye la evidencia de red del ultimo intento cuando vence el plazo', async () => {
    await expect(waitForStableDeployment({
      expectedCommit: 'b'.repeat(40),
      probe: vi.fn().mockResolvedValue({
        status: 200,
        deployedSha: 'b'.repeat(40),
        reactMounted: false,
        diagnostic: 'script=/assets/app.js status=200 type=text/html',
      }),
      sleep: vi.fn().mockResolvedValue(undefined),
      timeoutMs: 2,
      now: (() => {
        let value = 0;
        return () => value += 1;
      })(),
    })).rejects.toThrow('script=/assets/app.js status=200 type=text/html');
  });
});
