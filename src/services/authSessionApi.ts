import { getLearningActorId, LEARNING_API_URL, learningApiRequest, readApiJson, rotateLearningActorId, setLearningCsrfToken } from './learningHttp';
import { clearLearningSyncQueue } from './learningSync';

export type AuthProvider = 'google' | 'microsoft';
export type UserRole = 'student' | 'tutor' | 'admin';

export type AuthSession =
  | Readonly<{ authenticated: false; providers: readonly AuthProvider[] }>
  | Readonly<{
      authenticated: true;
      user: Readonly<{
        id: string;
        email: string;
        displayName: string | null;
        roles: readonly UserRole[];
      }>;
      csrfToken: string;
    }>;

const PROVIDERS = new Set<AuthProvider>(['google', 'microsoft']);
const ROLES = new Set<UserRole>(['student', 'tutor', 'admin']);
const SAFE_RETURN_TO = /^\/(?!\/)(?!.*[\\\u0000-\u001f\u007f]).*$/;
const LAST_USER_KEY = 'aula_last_authenticated_user_v1';
const PRIVATE_KEYS = ['aula_user_progress_v1', 'aula_learning_profile_v1', 'aula_learning_sync_v1'] as const;
const PRIVATE_PREFIXES = ['aula_course_progress_cache_v1:', 'aula_learning_center_cache_v1:', 'aula_learning_center_cache_v2:'] as const;

function clearPrivateDeviceState(): void {
  clearLearningSyncQueue();
  try {
    PRIVATE_KEYS.forEach((key) => localStorage.removeItem(key));
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && PRIVATE_PREFIXES.some((prefix) => key.startsWith(prefix))) localStorage.removeItem(key);
    }
  } catch {
    // La separación remota sigue vigente aunque Storage no esté disponible.
  }
}

function reconcileDeviceIdentity(session: AuthSession): void {
  try {
    const previousUserId = localStorage.getItem(LAST_USER_KEY);
    if (session.authenticated) {
      if (previousUserId && previousUserId !== session.user.id) clearPrivateDeviceState();
      localStorage.setItem(LAST_USER_KEY, session.user.id);
      return;
    }
    if (previousUserId) {
      clearPrivateDeviceState();
      localStorage.removeItem(LAST_USER_KEY);
      rotateLearningActorId();
    }
  } catch {
    // La sesión del backend no depende del almacenamiento local.
  }
}

function parseSession(value: unknown): AuthSession {
  if (!value || typeof value !== 'object') throw new Error('La respuesta de sesión no es válida.');
  const payload = value as Record<string, unknown>;
  if (payload.authenticated === false && Array.isArray(payload.providers)) {
    const providers = payload.providers.filter((provider): provider is AuthProvider => typeof provider === 'string' && PROVIDERS.has(provider as AuthProvider));
    return { authenticated: false, providers };
  }
  const user = payload.user as Record<string, unknown> | undefined;
  if (
    payload.authenticated !== true ||
    !user ||
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    !Array.isArray(user.roles) ||
    typeof payload.csrfToken !== 'string' ||
    payload.csrfToken.length < 16
  ) {
    throw new Error('La respuesta de sesión no es válida.');
  }
  const roles = user.roles.filter((role): role is UserRole => typeof role === 'string' && ROLES.has(role as UserRole));
  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: typeof user.displayName === 'string' ? user.displayName : null,
      roles,
    },
    csrfToken: payload.csrfToken,
  };
}

const DEV_MOCK_ROLE_KEY = 'aula_dev_mock_role_v1';
export type DevMockRole = 'admin' | 'tutor' | 'student';

export function getDevMockRole(): DevMockRole | null {
  if (!import.meta.env.DEV) return null;
  try {
    const val = sessionStorage.getItem(DEV_MOCK_ROLE_KEY);
    if (val === 'admin' || val === 'tutor' || val === 'student') return val;
  } catch {
    // sessionStorage not available
  }
  return null;
}

export function setDevMockRole(role: DevMockRole | null): void {
  if (!import.meta.env.DEV) return;
  try {
    if (!role) sessionStorage.removeItem(DEV_MOCK_ROLE_KEY);
    else sessionStorage.setItem(DEV_MOCK_ROLE_KEY, role);
  } catch {
    // sessionStorage not available
  }
}

export async function fetchAuthSession(signal?: AbortSignal): Promise<AuthSession> {
  const devRole = getDevMockRole();
  if (import.meta.env.DEV && devRole) {
    const mockSession: AuthSession = {
      authenticated: true,
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        email: devRole === 'admin' ? 'admin.local@desarrollo.local' : devRole === 'tutor' ? 'tutor.local@desarrollo.local' : 'alumno.local@desarrollo.local',
        displayName: devRole === 'admin' ? 'Dev Admin (Local)' : devRole === 'tutor' ? 'Dev Tutor (Local)' : 'Dev Alumno (Local)',
        roles: devRole === 'admin' ? ['admin', 'tutor', 'student'] : devRole === 'tutor' ? ['tutor', 'student'] : ['student'],
      },
      csrfToken: 'dev-local-csrf-token-1234567890',
    };
    reconcileDeviceIdentity(mockSession);
    setLearningCsrfToken(mockSession.csrfToken);
    return mockSession;
  }

  const response = await learningApiRequest('/v1/auth/session', { signal });
  const session = parseSession(await readApiJson<unknown>(response));
  reconcileDeviceIdentity(session);
  setLearningCsrfToken(session.authenticated ? session.csrfToken : null);
  return session;
}

export function getAuthLoginUrl(provider: AuthProvider, returnTo = '/'): string {
  if (!SAFE_RETURN_TO.test(returnTo)) throw new Error('El destino posterior al acceso no es válido.');
  const url = new URL(`/v1/auth/login/${provider}`, LEARNING_API_URL);
  url.searchParams.set('returnTo', returnTo);
  url.searchParams.set('anonymousId', getLearningActorId());
  return url.toString();
}

export async function logoutAuthSession(): Promise<void> {
  if (import.meta.env.DEV) {
    setDevMockRole(null);
  }
  const response = await learningApiRequest('/v1/auth/logout', {
    method: 'POST',
  });
  if (!response.ok && response.status !== 204) await readApiJson(response);
  setLearningCsrfToken(null);
}

export async function verifyAuthEmailCode(code: string): Promise<{
  session: Extract<AuthSession, { authenticated: true }>;
  returnTo: string;
}> {
  const response = await learningApiRequest('/v1/auth/email/verify', {
    method: 'POST',
    headers: { 'x-auth-intent': 'verify-email' },
    body: JSON.stringify({ code }),
  });
  const payload = await readApiJson<Record<string, unknown>>(response);
  const session = parseSession(payload);
  if (!session.authenticated) throw new Error('La sesión verificada no es válida.');
  reconcileDeviceIdentity(session);
  setLearningCsrfToken(session.csrfToken);
  const returnTo = typeof payload.returnTo === 'string' && SAFE_RETURN_TO.test(payload.returnTo) ? payload.returnTo : '/';
  return { session, returnTo };
}

export async function resendAuthEmailCode(): Promise<void> {
  const response = await learningApiRequest('/v1/auth/email/resend', {
    method: 'POST',
    headers: { 'x-auth-intent': 'resend-email' },
    body: JSON.stringify({}),
  });
  await readApiJson(response);
}
