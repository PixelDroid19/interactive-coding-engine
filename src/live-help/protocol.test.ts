// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLearningCsrfToken } from '../services/learningHttp';
import { liveHelpApi } from '../services/liveHelpApi';
import { parseLiveHelpSession, parseServerFrame, parseTicket, serializeClientFrame } from './protocol';

const context = {
  courseSlug: 'fundamentos',
  lessonKey: 'fundamentos-01',
  surface: 'editor' as const,
};

const session = {
  id: 'session-1',
  learnerUserId: 'learner-1',
  claimedByUserId: null,
  claimedRole: null,
  status: 'requested',
  context,
  expiresAt: '2026-08-30T13:00:00.000Z',
  createdAt: '2026-08-30T12:00:00.000Z',
  updatedAt: '2026-08-30T12:00:00.000Z',
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aula_anonymous_actor_v1', '30000000-0000-4000-8000-000000000003');
  setLearningCsrfToken('csrf-live-help-test-token');
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  setLearningCsrfToken(null);
});

describe('contrato seguro de ayuda en vivo', () => {
  it('crea una solicitud contextual con cookie y CSRF, sin enviar un ticket o snapshot implícito', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ session }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(liveHelpApi.createSession(context)).resolves.toMatchObject({
      id: 'session-1', status: 'requested', context,
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/v1/me/live-help/sessions'), expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: expect.objectContaining({ 'x-csrf-token': 'csrf-live-help-test-token' }),
      body: JSON.stringify({ context }),
    }));
  });

  it('rechaza un frame del servidor cuando su evento no respeta el contrato', () => {
    expect(() => parseServerFrame(JSON.stringify({
      type: 'event',
      event: {
        seq: 4,
        type: 'chat',
        actorRole: 'tutor',
        createdAt: '2026-08-30T12:01:00.000Z',
        payload: { body: 42 },
      },
    }))).toThrow('frame');
  });

  it('mantiene el ticket temporal fuera de localStorage al solicitarlo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      ticket: 'short-lived-ticket',
      expiresAt: '2026-08-30T12:10:00.000Z',
      protocol: 'live-help-v1',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await expect(liveHelpApi.createTicket('session-1')).resolves.toEqual({
      ticket: 'short-lived-ticket',
      expiresAt: '2026-08-30T12:10:00.000Z',
      protocol: 'live-help-v1',
    });

    expect(localStorage.getItem('live-help-ticket')).toBeNull();
    expect(localStorage.getItem('aula_live_help_ticket')).toBeNull();
  });

  it('rechaza un ticket o una propuesta que excedan el contrato antes de abrir el socket', () => {
    expect(() => parseTicket({
      ticket: '', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1',
    })).toThrow('ticket');

    expect(() => parseServerFrame(JSON.stringify({
      type: 'event',
      event: {
        seq: 5,
        type: 'patch-proposal',
        proposalId: '30000000-0000-4000-8000-000000000003',
        actorRole: 'tutor',
        createdAt: '2026-08-30T12:01:00.000Z',
        payload: {
          summary: 'Añadir el saludo',
          patch: { baseRevision: -1, files: [{ path: 'app.js', content: 'console.log(1)' }] },
        },
      },
    }))).toThrow('frame');
  });

  it('acepta el vocabulario exacto del backend y normaliza proposalId desde el evento', () => {
    expect(parseLiveHelpSession({ ...session, status: 'accepted', context: { ...context, surface: 'lesson' } })).toMatchObject({
      status: 'accepted', context: { surface: 'lesson' },
    });

    expect(parseServerFrame(JSON.stringify({
      type: 'event',
      event: {
        seq: 6,
        type: 'patch-proposal',
        proposalId: '30000000-0000-4000-8000-000000000003',
        actorRole: 'tutor',
        createdAt: '2026-08-30T12:01:00.000Z',
        payload: {
          summary: 'Añadir un saludo',
          patch: { baseRevision: 0, files: [{ path: 'app.js', content: 'console.log(1)' }] },
        },
      },
    }))).toMatchObject({
      type: 'event',
      event: { proposalId: '30000000-0000-4000-8000-000000000003', payload: { summary: 'Añadir un saludo' } },
    });
  });

  it('rechaza los alias frontend que el backend no reconoce', () => {
    expect(() => parseLiveHelpSession({ ...session, context: { ...context, surface: 'scrim' } })).toThrow('session');
    expect(() => parseServerFrame(JSON.stringify({
      type: 'ready', session: { id: 'session-1', status: 'active', role: 'learner' }, heartbeatMs: 15000,
    }))).toThrow('frame');
    expect(() => parseServerFrame(JSON.stringify({
      type: 'event',
      event: {
        seq: 7, type: 'patch-proposal', actorRole: 'tutor', createdAt: '2026-08-30T12:01:00.000Z',
        payload: { summary: 'Sin id', patch: { baseRevision: 0, files: [{ path: 'app.js', content: '' }] } },
      },
    }))).toThrow('frame');
  });

  it('exige hasMore boolean y rechaza rutas de workspace peligrosas en frames entrantes o salientes', () => {
    expect(() => parseServerFrame(JSON.stringify({ type: 'replay', items: [], lastSeq: 0, hasMore: 'false' }))).toThrow('replay');

    for (const path of ['__proto__', 'src/constructor/app.js', 'src/prototype/app.js', '/etc/passwd', '../app.js', 'src\\app.js', 'src/\u0000app.js']) {
      expect(() => serializeClientFrame({
        type: 'snapshot', revision: 0, activeFile: path, files: [{ path, content: 'const seguro = true;' }],
      })).toThrow('frame');
      expect(() => serializeClientFrame({
        type: 'patch-proposal', proposalId: '30000000-0000-4000-8000-000000000003', summary: 'Cambio seguro',
        patch: { baseRevision: 0, files: [{ path, content: 'const seguro = true;' }] },
      })).toThrow('frame');
    }
    expect(() => serializeClientFrame({
      type: 'patch-proposal', proposalId: '30000000-0000-4000-8000-000000000003', summary: 'Cambio seguro', targetPath: '../fuera.js',
      patch: { baseRevision: 0, files: [{ path: 'app.js', content: 'const seguro = true;' }] },
    })).toThrow('frame');
  });

  it('rechaza eventos que pretenden cruzar la frontera semántica de roles', () => {
    const base = {
      seq: 8,
      createdAt: '2026-08-30T12:01:00.000Z',
    };

    for (const event of [
      { ...base, type: 'snapshot', actorRole: 'tutor', payload: { revision: 0, files: [{ path: 'app.js', content: 'const a = 1;' }] } },
      { ...base, type: 'context', actorRole: 'admin', payload: { context } },
      {
        ...base, type: 'patch-proposal', actorRole: 'student', proposalId: '30000000-0000-4000-8000-000000000003',
        payload: { summary: 'No corresponde a la alumna', patch: { baseRevision: 0, files: [{ path: 'app.js', content: 'const a = 1;' }] } },
      },
      {
        ...base, type: 'patch-decision', actorRole: 'tutor', proposalId: '30000000-0000-4000-8000-000000000003',
        payload: { decision: 'accepted' },
      },
    ]) {
      expect(() => parseServerFrame(JSON.stringify({ type: 'event', event }))).toThrow('frame');
    }
  });
});
