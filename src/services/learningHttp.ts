const DEFAULT_API_URL = 'https://api.devt.lat';
const isDevelopment = (import.meta.env as { DEV?: boolean }).DEV === true;
export const LEARNING_API_URL = (import.meta.env.VITE_LEARNING_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
const LEARNING_API_REQUEST_BASE_URL = isDevelopment ? '/api' : LEARNING_API_URL;

const ACTOR_KEY = 'aula_anonymous_actor_v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
let csrfToken: string | null = null;
let inMemoryActorId: string | null = null;

export function getLearningActorId(): string {
  if (inMemoryActorId) return inMemoryActorId;
  try {
    const existing = localStorage.getItem(ACTOR_KEY);
    if (existing && UUID.test(existing)) {
      inMemoryActorId = existing;
      return existing;
    }
    const created = crypto.randomUUID();
    inMemoryActorId = created;
    localStorage.setItem(ACTOR_KEY, created);
    return created;
  } catch {
    inMemoryActorId ??= crypto.randomUUID();
    return inMemoryActorId;
  }
}

export function rotateLearningActorId(): string {
  const created = crypto.randomUUID();
  inMemoryActorId = created;
  try {
    localStorage.setItem(ACTOR_KEY, created);
  } catch {
    // La sesión anónima seguirá viva solo durante esta carga si Storage no existe.
  }
  return created;
}

export function setLearningCsrfToken(token: string | null): void {
  csrfToken = token;
}

export async function learningApiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  headers.accept ??= 'application/json';
  headers['x-anonymous-id'] ??= getLearningActorId();
  if (init.body && !headers['content-type']) headers['content-type'] = 'application/json';
  if (!SAFE_METHODS.has(method) && csrfToken && !headers['x-csrf-token']) headers['x-csrf-token'] = csrfToken;
  try {
    return await fetch(`${LEARNING_API_REQUEST_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers,
      signal: init.signal ?? AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('El servicio tardó demasiado en responder. Inténtalo otra vez.');
    }
    throw new Error('No pudimos conectar con el servicio. Conservamos los datos que ya estaban cargados.');
  }
}

export async function readApiJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  let message = `La solicitud falló (HTTP ${response.status}).`;
  try {
    const payload = await response.json() as { error?: { message?: string } };
    if (payload.error?.message) message = payload.error.message;
  } catch {
    // El cuerpo puede estar vacío en fallos de red intermedios.
  }
  throw new Error(message);
}
