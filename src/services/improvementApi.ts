import { learningApiRequest, readApiJson } from './learningHttp';

export type ImprovementTarget = 'lesson' | 'practice' | 'playground' | 'accessibility' | 'interface';
export type ImprovementProposal = Readonly<{
  id: string;
  title: string;
  description: string;
  targetArea: ImprovementTarget;
  status: 'open' | 'queued' | 'building' | 'preview' | 'published' | 'rejected' | 'failed' | 'grouped';
  votes: number;
  votedByMe?: boolean;
  authorName?: string | null;
  createdAt?: string;
  cycleId?: string | null;
  mergedIntoProposalId?: string | null;
  moderationReason?: string | null;
}>;
export type ImprovementRun = Readonly<{
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'rejected' | 'failed' | 'timed_out';
  model: string;
  changedFiles: readonly Readonly<{ path: string; added: number; deleted: number }>[];
  validation: Record<string, unknown>;
  diffText?: string | null;
  summary?: string | null;
  errorCode?: string | null;
  branchName?: string | null;
  commitSha?: string | null;
  pullRequestNumber?: number | null;
  pullRequestUrl?: string | null;
}>;
export type AdminImprovementProposal = ImprovementProposal & Readonly<{ runs: readonly ImprovementRun[] }>;
export type ImprovementCycle = Readonly<{
  id: string;
  closedAt: string;
  candidateCount: number;
  clusterCount: number;
  winningScore: number;
  rationale: string;
  clusters: readonly Readonly<{ targetArea: ImprovementTarget; score: number }>[];
  winner: Readonly<{ id: string; title: string; status: ImprovementProposal['status'] }>;
}>;

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  return readApiJson<T>(await learningApiRequest(path, init));
}

export type PrivateImprovementAccessStatus = Readonly<{
  enabled: boolean;
  authorized: boolean;
  csrfToken?: string;
  expiresAt?: string;
}>;

let privateImprovementCsrfToken: string | null = null;

function privateAccessInit(init: RequestInit): RequestInit {
  const headers = new Headers(init.headers);
  if (privateImprovementCsrfToken) {
    headers.set('x-improvement-csrf-token', privateImprovementCsrfToken);
  }
  return { ...init, headers };
}

function retainPrivateCsrf(status: PrivateImprovementAccessStatus): PrivateImprovementAccessStatus {
  privateImprovementCsrfToken = status.authorized && status.csrfToken ? status.csrfToken : null;
  return status;
}

export const improvementApi = {
  async privateAccessStatus(): Promise<PrivateImprovementAccessStatus> {
    return retainPrivateCsrf(await json<PrivateImprovementAccessStatus>('/v1/improvements/private-access'));
  },
  async unlockPrivateAccess(code: string): Promise<PrivateImprovementAccessStatus> {
    const status = await json<PrivateImprovementAccessStatus>('/v1/improvements/private-access', {
      method: 'POST',
      headers: { 'x-auth-intent': 'private-improvement-access' },
      body: JSON.stringify({ code }),
    });
    return retainPrivateCsrf(status);
  },
  async closePrivateAccess(): Promise<void> {
    const response = await learningApiRequest('/v1/improvements/private-access', privateAccessInit({ method: 'DELETE' }));
    if (!response.ok) await readApiJson<never>(response);
    privateImprovementCsrfToken = null;
  },
  async list(): Promise<readonly ImprovementProposal[]> {
    return (await json<{ items: ImprovementProposal[] }>('/v1/improvements?limit=50')).items;
  },
  async listCycles(): Promise<readonly ImprovementCycle[]> {
    return (await json<{ items: ImprovementCycle[] }>('/v1/improvements/cycles?limit=10')).items;
  },
  create(input: Readonly<{ title: string; description: string; targetArea: ImprovementTarget }>): Promise<ImprovementProposal> {
    return json('/v1/improvements', privateAccessInit({ method: 'POST', body: JSON.stringify(input) }));
  },
  vote(proposalId: string, voted: boolean): Promise<{ votes: number; votedByMe: boolean }> {
    return json(`/v1/improvements/${encodeURIComponent(proposalId)}/vote`, privateAccessInit({ method: voted ? 'PUT' : 'DELETE' }));
  },
  async listAdmin(): Promise<readonly AdminImprovementProposal[]> {
    return (await json<{ items: AdminImprovementProposal[] }>('/v1/admin/improvements?limit=50')).items;
  },
  queue(proposalId: string): Promise<ImprovementRun> {
    return json(`/v1/admin/improvements/${encodeURIComponent(proposalId)}/runs`, { method: 'POST' });
  },
  syncReview(proposalId: string): Promise<{ status: 'published' | 'rejected' }> {
    return json(`/v1/admin/improvements/${encodeURIComponent(proposalId)}/sync-review`, { method: 'POST' });
  },
};
