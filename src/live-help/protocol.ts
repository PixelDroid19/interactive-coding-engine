export const LIVE_HELP_PROTOCOL = 'live-help-v1' as const;
export const LIVE_HELP_MAX_FRAME_BYTES = 128 * 1024;

const MAX_TEXT_LENGTH = 4_000;
const MAX_PATH_LENGTH = 512;
const MAX_FILE_CONTENT_LENGTH = 64 * 1024;
const MAX_PATCH_FILES = 20;
const RESERVED_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

export type LiveHelpSurface = 'lesson' | 'challenge' | 'debug' | 'editor' | 'roadmap';
export type LiveHelpSessionStatus = 'requested' | 'claimed' | 'accepted' | 'active' | 'ended' | 'cancelled' | 'expired';
export type LiveHelpActorRole = 'student' | 'tutor' | 'admin';
export type LiveHelpEventType = 'presence' | 'chat' | 'context' | 'snapshot' | 'patch-proposal' | 'patch-decision' | 'end';

export type LiveHelpContext = Readonly<{
  courseSlug: string;
  lessonKey?: string;
  surface: LiveHelpSurface;
}>;

export type LiveHelpSession = Readonly<{
  id: string;
  learnerUserId: string;
  claimedByUserId: string | null;
  claimedRole: 'tutor' | 'admin' | null;
  status: LiveHelpSessionStatus;
  context: LiveHelpContext;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}>;

export type LiveHelpTicket = Readonly<{
  ticket: string;
  expiresAt: string;
  protocol: typeof LIVE_HELP_PROTOCOL;
}>;

export type LiveHelpWorkspaceFile = Readonly<{ path: string; content: string }>;
export type LiveHelpPatch = Readonly<{
  baseRevision: number;
  files: readonly LiveHelpWorkspaceFile[];
  activeFile?: string;
}>;

export type LiveHelpPresencePayload = Readonly<{ status: 'active' | 'idle' }>;
export type LiveHelpChatPayload = Readonly<{ body: string }>;
export type LiveHelpContextPayload = Readonly<{ context: LiveHelpContext }>;
export type LiveHelpSnapshotPayload = Readonly<{
  files: readonly LiveHelpWorkspaceFile[];
  activeFile?: string;
  revision: number;
}>;
export type LiveHelpPatchProposalPayload = Readonly<{
  summary: string;
  patch: LiveHelpPatch;
  targetPath?: string;
}>;
export type LiveHelpPatchDecisionPayload = Readonly<{
  decision: 'accepted' | 'rejected';
  note?: string;
}>;
export type LiveHelpEndPayload = Readonly<{ reason?: string }>;

type LiveHelpEventBase<TType extends LiveHelpEventType, TPayload> = Readonly<{
  seq: number;
  type: TType;
  actorRole: LiveHelpActorRole;
  createdAt: string;
  payload: TPayload;
}>;

export type LiveHelpProposalEvent = LiveHelpEventBase<'patch-proposal', LiveHelpPatchProposalPayload> & Readonly<{
  proposalId: string;
}>;
export type LiveHelpPatchDecisionEvent = LiveHelpEventBase<'patch-decision', LiveHelpPatchDecisionPayload> & Readonly<{
  proposalId: string;
}>;
export type LiveHelpEvent =
  | LiveHelpEventBase<'presence', LiveHelpPresencePayload>
  | LiveHelpEventBase<'chat', LiveHelpChatPayload>
  | LiveHelpEventBase<'context', LiveHelpContextPayload>
  | LiveHelpEventBase<'snapshot', LiveHelpSnapshotPayload>
  | LiveHelpProposalEvent
  | LiveHelpPatchDecisionEvent
  | LiveHelpEventBase<'end', LiveHelpEndPayload>;

export type LiveHelpReplay = Readonly<{
  items: readonly LiveHelpEvent[];
  lastSeq: number;
  hasMore: boolean;
}>;

export type ServerReadyFrame = Readonly<{
  type: 'ready';
  session: Readonly<{ id: string; status: LiveHelpSessionStatus; role: LiveHelpActorRole }>;
  heartbeatMs: number;
}>;
export type ServerEventFrame = Readonly<{ type: 'event'; event: LiveHelpEvent }>;
export type ServerReplayFrame = Readonly<{ type: 'replay' } & LiveHelpReplay>;
export type ServerErrorFrame = Readonly<{ type: 'error'; code: string; message: string }>;
export type ServerPingFrame = Readonly<{ type: 'ping' }>;
export type ServerFrame = ServerReadyFrame | ServerEventFrame | ServerReplayFrame | ServerErrorFrame | ServerPingFrame;

export type ClientFrame =
  | Readonly<{ type: 'replay'; lastSeq: number }>
  | Readonly<{ type: 'presence'; status: 'active' | 'idle' }>
  | Readonly<{ type: 'chat'; body: string }>
  | Readonly<{ type: 'context'; context: LiveHelpContext }>
  | Readonly<{ type: 'snapshot'; files: readonly LiveHelpWorkspaceFile[]; activeFile?: string; revision: number }>
  | Readonly<{ type: 'patch-proposal'; proposalId: string; summary: string; patch: LiveHelpPatch; targetPath?: string }>
  | Readonly<{ type: 'patch-decision'; proposalId: string; decision: 'accepted' | 'rejected'; note?: string }>
  | Readonly<{ type: 'end'; reason?: string }>
  | Readonly<{ type: 'pong' }>;

function invalid(kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame'): never {
  throw new Error(`${kind} de ayuda en vivo inválido.`);
}

function asRecord(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(kind);
  return value as Record<string, unknown>;
}

function text(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame', maxLength = MAX_TEXT_LENGTH, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > maxLength || (!allowEmpty && !value.trim())) invalid(kind);
  return value;
}

function optionalText(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame', maxLength = MAX_TEXT_LENGTH): string | undefined {
  if (value === undefined) return undefined;
  return text(value, kind, maxLength);
}

export function isLiveHelpWorkspacePath(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > MAX_PATH_LENGTH || /[\u0000-\u001f\u007f\\]/.test(value) || value.startsWith('/') || /^[A-Za-z]:\//.test(value)) return false;
  const segments = value.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..' && !RESERVED_PATH_SEGMENTS.has(segment));
}

function workspacePath(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame'): string {
  const candidate = text(value, kind, MAX_PATH_LENGTH);
  if (!isLiveHelpWorkspacePath(candidate)) invalid(kind);
  return candidate;
}

function optionalWorkspacePath(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame'): string | undefined {
  if (value === undefined) return undefined;
  return workspacePath(value, kind);
}

function integer(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame', minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) invalid(kind);
  return value;
}

function isoTimestamp(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame'): string {
  const candidate = text(value, kind, 80);
  if (Number.isNaN(Date.parse(candidate))) invalid(kind);
  return candidate;
}

function isOneOf<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

const SURFACES = ['lesson', 'challenge', 'debug', 'editor', 'roadmap'] as const;
const SESSION_STATUSES = ['requested', 'claimed', 'accepted', 'active', 'ended', 'cancelled', 'expired'] as const;
const ACTOR_ROLES = ['student', 'tutor', 'admin'] as const;
const STAFF_ROLES = ['tutor', 'admin'] as const;
const EVENT_TYPES = ['presence', 'chat', 'context', 'snapshot', 'patch-proposal', 'patch-decision', 'end'] as const;

export function isLiveHelpStaffRole(role: LiveHelpActorRole): role is 'tutor' | 'admin' {
  return role === 'tutor' || role === 'admin';
}

export function liveHelpContextKey(context: LiveHelpContext): string {
  return JSON.stringify([context.courseSlug, context.lessonKey ?? null, context.surface]);
}

export function canSendLiveHelpFrame(role: LiveHelpActorRole, frame: ClientFrame): boolean {
  if (frame.type === 'patch-proposal') return isLiveHelpStaffRole(role);
  if (frame.type === 'patch-decision' || frame.type === 'snapshot' || frame.type === 'context') return role === 'student';
  return true;
}

export function assertCanSendLiveHelpFrame(role: LiveHelpActorRole, frame: ClientFrame): void {
  if (!canSendLiveHelpFrame(role, frame)) invalid();
}

function actorCanEmitEvent(role: LiveHelpActorRole, type: LiveHelpEventType): boolean {
  if (type === 'patch-proposal') return isLiveHelpStaffRole(role);
  if (type === 'patch-decision' || type === 'snapshot' || type === 'context') return role === 'student';
  return true;
}

export function parseLiveHelpContext(value: unknown, kind: 'frame' | 'session' = 'frame'): LiveHelpContext {
  const source = asRecord(value, kind);
  const courseSlug = text(source.courseSlug, kind, 160);
  const lessonKey = optionalText(source.lessonKey, kind, 160);
  if (!isOneOf(source.surface, SURFACES)) invalid(kind);
  return { courseSlug, ...(lessonKey ? { lessonKey } : {}), surface: source.surface };
}

export function parsePatch(value: unknown, kind: 'frame' | 'session' = 'frame'): LiveHelpPatch {
  const source = asRecord(value, kind);
  const baseRevision = integer(source.baseRevision, kind);
  if (!Array.isArray(source.files) || source.files.length === 0 || source.files.length > MAX_PATCH_FILES) invalid(kind);
  const files = source.files.map((file) => {
    const item = asRecord(file, kind);
    return {
      path: workspacePath(item.path, kind),
      content: text(item.content, kind, MAX_FILE_CONTENT_LENGTH, true),
    } as LiveHelpWorkspaceFile;
  });
  const activeFile = optionalWorkspacePath(source.activeFile, kind);
  return { baseRevision, files, ...(activeFile ? { activeFile } : {}) };
}

function parseSnapshot(value: unknown): LiveHelpSnapshotPayload {
  const source = asRecord(value);
  if (!Array.isArray(source.files) || source.files.length === 0 || source.files.length > MAX_PATCH_FILES) invalid();
  const files = source.files.map((file) => {
    const item = asRecord(file);
    return {
      path: workspacePath(item.path),
      content: text(item.content, 'frame', MAX_FILE_CONTENT_LENGTH, true),
    } as LiveHelpWorkspaceFile;
  });
  const activeFile = optionalWorkspacePath(source.activeFile);
  return { files, ...(activeFile ? { activeFile } : {}), revision: integer(source.revision) };
}

function proposalId(value: unknown, kind: 'frame' | 'ticket' | 'session' | 'replay' = 'frame'): string {
  const candidate = text(value, kind, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) invalid(kind);
  return candidate;
}

type LiveHelpEventPayload = LiveHelpEvent['payload'];

function parseEventPayload(type: LiveHelpEventType, value: unknown): LiveHelpEventPayload {
  const source = asRecord(value);
  switch (type) {
    case 'presence':
      if (source.status !== 'active' && source.status !== 'idle') invalid();
      return { status: source.status };
    case 'chat':
      return { body: text(source.body) };
    case 'context':
      return { context: parseLiveHelpContext(source.context) };
    case 'snapshot':
      return parseSnapshot(source);
    case 'patch-proposal': {
      const summary = text(source.summary, 'frame', MAX_TEXT_LENGTH);
      const targetPath = optionalWorkspacePath(source.targetPath);
      return { summary, patch: parsePatch(source.patch), ...(targetPath ? { targetPath } : {}) };
    }
    case 'patch-decision': {
      if (source.decision !== 'accepted' && source.decision !== 'rejected') invalid();
      const note = optionalText(source.note);
      return { decision: source.decision, ...(note ? { note } : {}) };
    }
    case 'end': {
      const reason = optionalText(source.reason);
      return reason ? { reason } : {};
    }
  }
}

export function parseLiveHelpEvent(value: unknown): LiveHelpEvent {
  const source = asRecord(value);
  const seq = integer(source.seq);
  if (!isOneOf(source.type, EVENT_TYPES) || !isOneOf(source.actorRole, ACTOR_ROLES)) invalid();
  if (!actorCanEmitEvent(source.actorRole, source.type)) invalid();
  const base = {
    seq,
    actorRole: source.actorRole,
    createdAt: isoTimestamp(source.createdAt),
  };
  switch (source.type) {
    case 'presence': return { ...base, type: 'presence', payload: parseEventPayload('presence', source.payload) as LiveHelpPresencePayload };
    case 'chat': return { ...base, type: 'chat', payload: parseEventPayload('chat', source.payload) as LiveHelpChatPayload };
    case 'context': return { ...base, type: 'context', payload: parseEventPayload('context', source.payload) as LiveHelpContextPayload };
    case 'snapshot': return { ...base, type: 'snapshot', payload: parseEventPayload('snapshot', source.payload) as LiveHelpSnapshotPayload };
    case 'patch-proposal': return { ...base, type: 'patch-proposal', proposalId: proposalId(source.proposalId), payload: parseEventPayload('patch-proposal', source.payload) as LiveHelpPatchProposalPayload };
    case 'patch-decision': return { ...base, type: 'patch-decision', proposalId: proposalId(source.proposalId), payload: parseEventPayload('patch-decision', source.payload) as LiveHelpPatchDecisionPayload };
    case 'end': return { ...base, type: 'end', payload: parseEventPayload('end', source.payload) as LiveHelpEndPayload };
  }
}

export function parseLiveHelpSession(value: unknown): LiveHelpSession {
  const source = asRecord(value, 'session');
  if (!isOneOf(source.status, SESSION_STATUSES)) invalid('session');
  const claimedByUserId = source.claimedByUserId === null ? null : text(source.claimedByUserId, 'session', 160);
  const claimedRole = source.claimedRole === null ? null : isOneOf(source.claimedRole, STAFF_ROLES) ? source.claimedRole : invalid('session');
  return {
    id: text(source.id, 'session', 160),
    learnerUserId: text(source.learnerUserId, 'session', 160),
    claimedByUserId,
    claimedRole,
    status: source.status,
    context: parseLiveHelpContext(source.context, 'session'),
    expiresAt: isoTimestamp(source.expiresAt, 'session'),
    createdAt: isoTimestamp(source.createdAt, 'session'),
    updatedAt: isoTimestamp(source.updatedAt, 'session'),
  };
}

export function parseTicket(value: unknown): LiveHelpTicket {
  const source = asRecord(value, 'ticket');
  if (source.protocol !== LIVE_HELP_PROTOCOL) invalid('ticket');
  return {
    ticket: text(source.ticket, 'ticket', 4096),
    expiresAt: isoTimestamp(source.expiresAt, 'ticket'),
    protocol: LIVE_HELP_PROTOCOL,
  };
}

export function parseReplay(value: unknown): LiveHelpReplay {
  const source = asRecord(value, 'replay');
  if (!Array.isArray(source.items)) invalid('replay');
  if (typeof source.hasMore !== 'boolean') invalid('replay');
  const items = source.items.map(parseLiveHelpEvent);
  return { items, lastSeq: integer(source.lastSeq, 'replay'), hasMore: source.hasMore };
}

export function advanceLiveHelpReplayCursor(cursor: number, replay: LiveHelpReplay): number {
  let next = integer(cursor, 'replay');
  for (const event of replay.items) {
    if (event.seq <= next) invalid('replay');
    next = event.seq;
  }
  if (replay.lastSeq !== next || (replay.hasMore && next === cursor)) invalid('replay');
  return next;
}

export function parseServerFrame(raw: string): ServerFrame {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > LIVE_HELP_MAX_FRAME_BYTES) invalid();
  let value: unknown;
  try { value = JSON.parse(raw); } catch { invalid(); }
  const source = asRecord(value);
  switch (source.type) {
    case 'ready': {
      const session = asRecord(source.session);
      if (!isOneOf(session.status, SESSION_STATUSES) || !isOneOf(session.role, ACTOR_ROLES)) invalid();
      return {
        type: 'ready',
        session: { id: text(session.id, 'frame', 160), status: session.status, role: session.role },
        heartbeatMs: integer(source.heartbeatMs, 'frame', 1),
      };
    }
    case 'event': return { type: 'event', event: parseLiveHelpEvent(source.event) };
    case 'replay': return { type: 'replay', ...parseReplay(source) };
    case 'error': return { type: 'error', code: text(source.code, 'frame', 160), message: text(source.message) };
    case 'ping': return { type: 'ping' };
    default: return invalid();
  }
}

export function serializeClientFrame(frame: ClientFrame): string {
  switch (frame.type) {
    case 'replay': integer(frame.lastSeq); break;
    case 'presence': if (frame.status !== 'active' && frame.status !== 'idle') invalid(); break;
    case 'chat': text(frame.body); break;
    case 'context': parseLiveHelpContext(frame.context); break;
    case 'snapshot': parseSnapshot(frame); break;
    case 'patch-proposal': proposalId(frame.proposalId); parseEventPayload('patch-proposal', frame); break;
    case 'patch-decision': proposalId(frame.proposalId); parseEventPayload('patch-decision', frame); break;
    case 'end': parseEventPayload('end', frame); break;
    case 'pong': break;
  }
  const serialized = JSON.stringify(frame);
  if (new TextEncoder().encode(serialized).byteLength > LIVE_HELP_MAX_FRAME_BYTES) invalid();
  return serialized;
}
