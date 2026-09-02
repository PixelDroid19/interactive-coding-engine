export type DeploymentReadiness = Readonly<{
  status: number | null;
  deployedSha: string | null;
  reactMounted: boolean;
  diagnostic?: string;
}>;

type WaitForStableDeploymentOptions = Readonly<{
  expectedCommit: string;
  probe(): Promise<DeploymentReadiness>;
  sleep(delayMs: number): Promise<void>;
  timeoutMs: number;
  now(): number;
}>;

export async function waitForStableDeployment({
  expectedCommit,
  probe,
  sleep,
  timeoutMs,
  now,
}: WaitForStableDeploymentOptions): Promise<DeploymentReadiness> {
  const deadline = now() + timeoutMs;
  let latest: DeploymentReadiness = { status: null, deployedSha: null, reactMounted: false };

  while (now() < deadline) {
    latest = await probe();
    if (latest.status === 200 && latest.deployedSha === expectedCommit && latest.reactMounted) return latest;
    await sleep(5_000);
  }

  throw new Error(
    `production_not_ready: esperado=${expectedCommit} recibido=${latest.deployedSha ?? 'ausente'} react=${latest.reactMounted}`
      + (latest.diagnostic ? ` ${latest.diagnostic}` : ''),
  );
}
