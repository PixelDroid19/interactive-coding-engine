import { learningApiRequest, readApiJson } from './learningHttp';

export type StaffOverview = Readonly<{
  learners: number; anonymousLearners: number; active30d: number; completedItems: number;
  anonymousCompletedItems: number; needsSupport: number; openThreads: number;
}>;
export type StaffLearner = Readonly<{
  id: string; email: string; displayName: string | null; status: string; emailVerifiedAt: string | null;
  lastSeenAt: string | null; progressItems: number; completed: number; lowestSkillScore: number; skillsAtRisk: number;
}>;
export type StaffThread = Readonly<{
  id: string; subject: string; status: 'open' | 'waiting_student' | 'resolved'; updatedAt: string;
  learnerId: string; email: string; displayName: string | null;
  messages: readonly Readonly<{ id: string; body: string; authorUserId: string; createdAt: string }>[];
}>;
export type LearnerDetail = Readonly<{
  user: Record<string, unknown>;
  progress: readonly Record<string, unknown>[];
  skills: readonly Record<string, unknown>[];
  attempts: readonly Record<string, unknown>[];
  feedback: readonly Record<string, unknown>[];
}>;
export type IdentityAccessRule = Readonly<{ id: string; provider: 'google' | 'microsoft'; ruleType: 'domain' | 'email'; value: string; enabled: boolean; createdAt: string }>;
export type AdminCourse = Readonly<{ slug: string; title: string; description: string; availability: 'available' | 'locked' | 'hidden'; availabilityReason: string | null }>;

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  return readApiJson<T>(await learningApiRequest(path, init));
}

async function empty(path: string, init?: RequestInit): Promise<void> {
  const response = await learningApiRequest(path, init);
  if (!response.ok) await readApiJson(response);
}

export const staffDashboardApi = {
  overview: () => json<StaffOverview>('/v1/staff/dashboard/overview'),
  learners: async (query = '') => (await json<{ items: StaffLearner[] }>(`/v1/staff/learners?query=${encodeURIComponent(query)}&limit=100`)).items,
  learner: (userId: string) => json<LearnerDetail>(`/v1/staff/learners/${encodeURIComponent(userId)}`),
  threads: async (status = '') => (await json<{ items: StaffThread[] }>(`/v1/staff/support/threads${status ? `?status=${encodeURIComponent(status)}` : ''}`)).items,
  reply: (threadId: string, body: string, status: StaffThread['status']) => json(`/v1/staff/support/threads/${encodeURIComponent(threadId)}/replies`, {
    method: 'POST', body: JSON.stringify({ body, status }),
  }),
  leaveFeedback: (input: { learnerUserId: string; courseSlug?: string; itemKey?: string; skillKey?: string; message: string }) => json('/v1/staff/feedback', {
    method: 'POST', body: JSON.stringify(input),
  }),
  users: async () => (await json<{ items: Array<Record<string, unknown>> }>('/v1/admin/users?limit=100')).items,
  grantRole: (userId: string, role: 'tutor' | 'admin') => json(`/v1/admin/users/${encodeURIComponent(userId)}/roles/${role}`, { method: 'PUT' }),
  revokeRole: (userId: string, role: 'tutor' | 'admin') => json(`/v1/admin/users/${encodeURIComponent(userId)}/roles/${role}`, { method: 'DELETE' }),
  setUserStatus: (userId: string, status: 'active' | 'blocked') => json(`/v1/admin/users/${encodeURIComponent(userId)}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  accessRules: async () => (await json<{ items: IdentityAccessRule[] }>('/v1/admin/identity/access-rules')).items,
  upsertAccessRule: (input: { provider: 'google' | 'microsoft'; ruleType: 'domain' | 'email'; value: string; enabled: boolean }) => json('/v1/admin/identity/access-rules', { method: 'PUT', body: JSON.stringify(input) }),
  deleteAccessRule: (id: string) => empty(`/v1/admin/identity/access-rules/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  courses: async () => (await json<{ items: AdminCourse[] }>('/v1/admin/courses?limit=50')).items,
  setCourseAvailability: (slug: string, availability: AdminCourse['availability'], reason?: string) => json(`/v1/admin/courses/${encodeURIComponent(slug)}/availability`, {
    method: 'PUT', body: JSON.stringify({ availability, ...(reason?.trim() ? { reason: reason.trim() } : {}) }),
  }),
};

export type LearnerThread = Readonly<{
  id: string; subject: string; status: StaffThread['status']; createdAt: string; updatedAt: string;
  messages: StaffThread['messages'];
}>;
export type LearnerFeedback = Readonly<{
  id: string; courseSlug: string | null; itemKey: string | null; skillKey: string | null;
  message: string; status: 'unread' | 'read' | 'resolved'; createdAt: string; authorName: string | null;
}>;

export const learnerSupportApi = {
  threads: async () => (await json<{ items: LearnerThread[] }>('/v1/me/support/threads')).items,
  feedback: async () => (await json<{ items: LearnerFeedback[] }>('/v1/me/staff-feedback')).items,
  createThread: (subject: string, body: string) => json('/v1/me/support/threads', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  reply: (threadId: string, body: string) => json(`/v1/me/support/threads/${encodeURIComponent(threadId)}/replies`, { method: 'POST', body: JSON.stringify({ body }) }),
  markFeedback: (feedbackId: string, status: 'read' | 'resolved') => json(`/v1/me/staff-feedback/${encodeURIComponent(feedbackId)}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};
