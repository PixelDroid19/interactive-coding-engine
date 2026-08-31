import { learningApiRequest, readApiJson } from './learningHttp';

export type StaffOverview = Readonly<{
  learners: number; anonymousLearners: number; active30d: number; completedItems: number;
  anonymousCompletedItems: number; needsSupport: number; openThreads: number;
  verifiedLearners: number; verificationPending: number; active7d: number; attempts30d: number;
  failedAttempts30d: number; pendingFeedback: number; latestActivityAt: string | null;
  courses: readonly StaffCourseOverview[];
  activity7d: readonly StaffActivityPoint[];
}>;
export type StaffCourseOverview = Readonly<{
  courseSlug: string; title: string; learners: number; progressItems: number; completedItems: number;
  averageScore: number | null; attempts: number; attemptsToReview: number;
}>;
export type StaffActivityPoint = Readonly<{ day: string; events: number; activeActors: number; completions: number }>;
export type StaffLearner = Readonly<{
  id: string; email: string; displayName: string | null; status: string; emailVerifiedAt: string | null;
  lastSeenAt: string | null; progressItems: number; completed: number; lowestSkillScore: number; skillsAtRisk: number;
}>;
export type LearnerProgress = Readonly<{
  courseSlug: string; lessonKey: string; status: 'not_started' | 'in_progress' | 'completed';
  playbackMs: number; score: number | null; updatedAt: string;
}>;
export type LearnerSkill = Readonly<{
  courseSlug: string; skillKey: string; capability: string; score: number; attempts: number;
  successes: number; lastResult: 'success' | 'partial' | 'failure'; lastPracticedAt: string;
}>;
export type LearnerAttempt = Readonly<{
  id: string; courseSlug: string; itemKey: string; kind: string; result: 'success' | 'partial' | 'failure';
  score: number | null; response: Record<string, unknown>; diagnostics: Record<string, unknown>; occurredAt: string;
}>;
export type StaffFeedbackEntry = Readonly<{
  id: string; courseSlug: string | null; itemKey: string | null; skillKey: string | null;
  message: string; status: 'unread' | 'read' | 'resolved'; createdAt: string;
}>;
export type StaffAdminUser = Readonly<{
  id: string; email: string; displayName: string | null; status: 'pending' | 'active' | 'blocked';
  emailVerifiedAt: string | null; lastLoginAt: string | null; roles: readonly ('student' | 'tutor' | 'admin')[];
}>;
export type StaffThread = Readonly<{
  id: string; subject: string; status: 'open' | 'waiting_student' | 'resolved'; updatedAt: string;
  learnerId: string; email: string; displayName: string | null;
  messages: readonly Readonly<{ id: string; body: string; authorUserId: string; createdAt: string }>[];
}>;
export type LearnerDetail = Readonly<{
  user: StaffLearner & Readonly<{ roles: readonly string[]; actorId: string | null }>;
  progress: readonly LearnerProgress[];
  skills: readonly LearnerSkill[];
  attempts: readonly LearnerAttempt[];
  feedback: readonly StaffFeedbackEntry[];
}>;
export type IdentityAccessRule = Readonly<{ id: string; provider: 'google' | 'microsoft'; ruleType: 'domain' | 'email'; value: string; enabled: boolean; createdAt: string }>;
export type AdminCourse = Readonly<{
  slug: string; title: string; description: string;
  metadata: Readonly<{ tagline?: string; level?: 'Beginner' | 'Intermediate' | 'Advanced'; tags?: string[]; [key: string]: unknown }>;
  availability: 'available' | 'locked' | 'hidden'; availabilityReason: string | null;
}>;
export type UserCourseAccess = Readonly<{
  userId: string; courseSlug: string; title: string; availability: 'locked'; reason: string; updatedAt: string;
}>;

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await readApiJson<T>(await learningApiRequest(path, init));
  } catch (error) {
    if (import.meta.env.DEV) {
      if (path.includes('/v1/staff/dashboard/overview')) return DEV_MOCK_OVERVIEW as unknown as T;
      if (path.includes('/v1/staff/learners')) return { items: DEV_MOCK_LEARNERS } as unknown as T;
      if (path.includes('/v1/staff/support/threads')) return { items: [] } as unknown as T;
      if (path.includes('/v1/admin/users')) return { items: DEV_MOCK_USERS } as unknown as T;
      if (path.includes('/v1/admin/identity/access-rules')) return { items: [] } as unknown as T;
      if (path.includes('/v1/admin/courses')) return { items: DEV_MOCK_COURSES } as unknown as T;
      if (path.includes('/course-access')) return { items: [] } as unknown as T;
    }
    throw error;
  }
}

async function empty(path: string, init?: RequestInit): Promise<void> {
  try {
    const response = await learningApiRequest(path, init);
    if (!response.ok) await readApiJson(response);
  } catch (error) {
    if (import.meta.env.DEV) return;
    throw error;
  }
}

const DEV_MOCK_COURSES: AdminCourse[] = [
  {
    slug: 'fundamentos',
    title: 'Fundamentos de programación',
    description: 'Curso para quien nunca ha programado. Cada lección se reproduce como una clase: el instructor escribe, explica y ejecuta. Tú puedes pausar, editar y comprobar que de verdad entendiste.',
    metadata: { tagline: 'Aprende a programar desde cero, pausando el código en vivo.' },
    availability: 'available',
    availabilityReason: null,
  },
  {
    slug: 'javascript',
    title: 'JavaScript: del lenguaje a aplicaciones',
    description: 'Domina JavaScript moderno y su modelo de ejecución con ejercicios prácticos.',
    metadata: { tagline: 'Estructuras de datos, async y programación orientada a eventos.' },
    availability: 'available',
    availabilityReason: null,
  },
  {
    slug: 'web-components',
    title: 'Web Components y Lit: Interfaces profesionales',
    description: 'Construye componentes web estándar, reactivos y reutilizables en cualquier framework.',
    metadata: { tagline: 'Custom Elements, Shadow DOM y Lit sin dependencias pesadas.' },
    availability: 'available',
    availabilityReason: null,
  },
  {
    slug: 'open-cells',
    title: 'Open Cells: componentes y aplicaciones reales',
    description: 'Arquitectura Cells, workers y estado sincronizado para frontend moderno.',
    metadata: { tagline: 'Desarrollo modular escalable con runtime Cells en el navegador.' },
    availability: 'available',
    availabilityReason: null,
  },
  {
    slug: 'ai-engineer',
    title: 'AI Engineer: construye un chat educativo local',
    description: 'Curso progresivo para personas nuevas. Cada clase añade una capacidad pequeña al TutorLocal, un chat educativo que corre entero en tu navegador con WebLLM y Transformers.js sobre WebGPU.',
    metadata: { tagline: 'Un solo producto que crece contigo: chat con reglas, modelo local en tu GPU.' },
    availability: 'available',
    availabilityReason: null,
  },
];

const DEV_MOCK_OVERVIEW: StaffOverview = {
  learners: 3,
  anonymousLearners: 57,
  active30d: 60,
  completedItems: 1,
  anonymousCompletedItems: 0,
  needsSupport: 0,
  openThreads: 0,
  verifiedLearners: 1,
  verificationPending: 2,
  active7d: 60,
  attempts30d: 434,
  failedAttempts30d: 10,
  pendingFeedback: 0,
  latestActivityAt: new Date().toISOString(),
  courses: [
    { courseSlug: 'fundamentos', title: 'Fundamentos de programación', learners: 82, progressItems: 15, completedItems: 11, averageScore: 0.92, attempts: 180, attemptsToReview: 6 },
    { courseSlug: 'web-components', title: 'Web Components y Lit: Interfaces profesionales', learners: 6, progressItems: 12, completedItems: 3, averageScore: 0.85, attempts: 45, attemptsToReview: 3 },
    { courseSlug: 'javascript', title: 'JavaScript: del lenguaje a aplicaciones', learners: 5, progressItems: 10, completedItems: 1, averageScore: 0.78, attempts: 32, attemptsToReview: 1 },
    { courseSlug: 'open-cells', title: 'Open Cells: componentes y aplicaciones reales', learners: 3, progressItems: 8, completedItems: 0, averageScore: 0.7, attempts: 12, attemptsToReview: 0 },
    { courseSlug: 'ai-engineer', title: 'AI Engineer: construye un chat educativo local', learners: 2, progressItems: 6, completedItems: 0, averageScore: 0.65, attempts: 8, attemptsToReview: 0 },
  ],
  activity7d: [
    { day: 'Mar', events: 0, activeActors: 0, completions: 0 },
    { day: 'Mié', events: 0, activeActors: 0, completions: 0 },
    { day: 'Jue', events: 0, activeActors: 0, completions: 0 },
    { day: 'Vie', events: 0, activeActors: 0, completions: 0 },
    { day: 'Sáb', events: 79, activeActors: 12, completions: 5 },
    { day: 'Dom', events: 55, activeActors: 8, completions: 3 },
    { day: 'Lun', events: 300, activeActors: 40, completions: 18 },
  ],
};

const DEV_MOCK_USERS: StaffAdminUser[] = [
  { id: '10000000-0000-4000-8000-000000000001', email: 'zeusjaimes05@gmail.com', displayName: 'Pixel Droid', status: 'active', emailVerifiedAt: '2026-08-20T10:00:00Z', lastLoginAt: '2026-08-31T07:00:00Z', roles: ['admin', 'student'] },
  { id: '10000000-0000-4000-8000-000000000002', email: 'damien_monasterios@epam.com', displayName: 'Damien Monasterios', status: 'active', emailVerifiedAt: '2026-08-15T09:00:00Z', lastLoginAt: '2026-08-30T16:00:00Z', roles: ['tutor', 'student'] },
  { id: '10000000-0000-4000-8000-000000000003', email: 'estudiante.demo@gmail.com', displayName: 'Estudiante Demo', status: 'active', emailVerifiedAt: '2026-08-28T14:00:00Z', lastLoginAt: '2026-08-31T06:30:00Z', roles: ['student'] },
];

const DEV_MOCK_LEARNERS: StaffLearner[] = [
  { id: '10000000-0000-4000-8000-000000000001', email: 'zeusjaimes05@gmail.com', displayName: 'Pixel Droid', status: 'active', emailVerifiedAt: '2026-08-20T10:00:00Z', lastSeenAt: '2026-08-31T07:00:00Z', progressItems: 11, completed: 8, lowestSkillScore: 0.85, skillsAtRisk: 0 },
  { id: '10000000-0000-4000-8000-000000000002', email: 'damien_monasterios@epam.com', displayName: 'Damien Monasterios', status: 'active', emailVerifiedAt: '2026-08-15T09:00:00Z', lastSeenAt: '2026-08-30T16:00:00Z', progressItems: 6, completed: 4, lowestSkillScore: 0.72, skillsAtRisk: 1 },
  { id: '10000000-0000-4000-8000-000000000003', email: 'estudiante.demo@gmail.com', displayName: 'Estudiante Demo', status: 'active', emailVerifiedAt: '2026-08-28T14:00:00Z', lastSeenAt: '2026-08-31T06:30:00Z', progressItems: 2, completed: 1, lowestSkillScore: 0.6, skillsAtRisk: 2 },
];

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
  users: async () => (await json<{ items: StaffAdminUser[] }>('/v1/admin/users?limit=100')).items,
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
  updateCourseContent: (slug: string, input: { title: string; description: string; metadata: Record<string, unknown> }) => json(`/v1/admin/courses/${encodeURIComponent(slug)}/content`, {
    method: 'PUT', body: JSON.stringify(input),
  }),
  courseAccess: async (userId: string) => (await json<{ items: UserCourseAccess[] }>(`/v1/admin/users/${encodeURIComponent(userId)}/course-access`)).items,
  lockCourseForUser: (userId: string, courseSlug: string, reason: string) => json(`/v1/admin/users/${encodeURIComponent(userId)}/course-access/${encodeURIComponent(courseSlug)}`, {
    method: 'PUT', body: JSON.stringify({ reason }),
  }),
  unlockCourseForUser: (userId: string, courseSlug: string) => empty(`/v1/admin/users/${encodeURIComponent(userId)}/course-access/${encodeURIComponent(courseSlug)}`, { method: 'DELETE' }),
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
