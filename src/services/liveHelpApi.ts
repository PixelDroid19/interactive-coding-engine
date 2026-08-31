import {
  advanceLiveHelpReplayCursor,
  parseLiveHelpSession,
  parseReplay,
  parseTicket,
  type LiveHelpContext,
  type LiveHelpReplay,
  type LiveHelpSession,
  type LiveHelpTicket,
} from '../live-help/protocol';
import { learningApiRequest, readApiJson } from './learningHttp';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Respuesta de ayuda en vivo inválida.');
  return value as Record<string, unknown>;
}

function sessionFromResponse(value: unknown): LiveHelpSession {
  const source = record(value);
  return parseLiveHelpSession(source.session ?? source);
}

async function json(path: string, init?: RequestInit): Promise<unknown> {
  return readApiJson<unknown>(await learningApiRequest(path, init));
}

async function sessionJson(path: string, init?: RequestInit): Promise<LiveHelpSession> {
  return sessionFromResponse(await json(path, init));
}

export const liveHelpApi = {
  createSession: (context: LiveHelpContext) => sessionJson('/v1/me/live-help/sessions', {
    method: 'POST', body: JSON.stringify({ context }),
  }),
  mySessions: async (): Promise<LiveHelpSession[]> => {
    const source = record(await json('/v1/me/live-help/sessions'));
    if (!Array.isArray(source.items)) throw new Error('Respuesta de ayuda en vivo inválida.');
    return source.items.map(parseLiveHelpSession);
  },
  staffSessions: async (): Promise<LiveHelpSession[]> => {
    const source = record(await json('/v1/staff/live-help/sessions'));
    if (!Array.isArray(source.items)) throw new Error('Respuesta de ayuda en vivo inválida.');
    return source.items.map(parseLiveHelpSession);
  },
  claim: (sessionId: string) => sessionJson(`/v1/staff/live-help/sessions/${encodeURIComponent(sessionId)}/claim`, { method: 'POST' }),
  accept: (sessionId: string) => sessionJson(`/v1/me/live-help/sessions/${encodeURIComponent(sessionId)}/accept`, { method: 'POST' }),
  createTicket: async (sessionId: string): Promise<LiveHelpTicket> => {
    const source = record(await json(`/v1/live-help/sessions/${encodeURIComponent(sessionId)}/tickets`, { method: 'POST' }));
    return parseTicket(typeof source.ticket === 'object' && source.ticket !== null ? source.ticket : source);
  },
  events: async (sessionId: string, lastSeq = 0): Promise<LiveHelpReplay> => {
    const query = new URLSearchParams({ lastSeq: String(Math.max(0, Math.floor(lastSeq))) });
    return parseReplay(await json(`/v1/live-help/sessions/${encodeURIComponent(sessionId)}/events?${query.toString()}`));
  },
  end: (sessionId: string, reason?: string) => sessionJson(`/v1/live-help/sessions/${encodeURIComponent(sessionId)}/end`, {
    method: 'POST', body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
  }),
};

export async function drainLiveHelpEvents(
  sessionId: string,
  lastSeq: number,
  onPage: (replay: LiveHelpReplay) => void,
  shouldContinue: () => boolean = () => true,
): Promise<number | null> {
  let cursor = Math.max(0, Math.floor(lastSeq));
  while (shouldContinue()) {
    const replay = await liveHelpApi.events(sessionId, cursor);
    if (!shouldContinue()) return null;
    const nextCursor = advanceLiveHelpReplayCursor(cursor, replay);
    onPage(replay);
    cursor = nextCursor;
    if (!replay.hasMore) return cursor;
  }
  return null;
}
