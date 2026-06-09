/**
 * Verification session manager — session creation and lookup only.
 */

import type { VerificationProviderType, VerificationSession, VerificationSessionState } from './types.js';
import { getVerificationProvider } from './verification-provider-registry.js';

let sessionCounter = 0;
const sessions = new Map<string, VerificationSession>();
const sessionKeys = new Set<string>();

export function resetVerificationSessionManagerForTests(): void {
  sessionCounter = 0;
  sessions.clear();
  sessionKeys.clear();
}

function nextSessionId(): string {
  sessionCounter += 1;
  return `vvsess-${sessionCounter.toString().padStart(4, '0')}`;
}

function sessionKey(providerId: string, verificationType: VerificationProviderType): string {
  return `${providerId}|${verificationType}`;
}

export interface CreateSessionResult {
  ok: boolean;
  session: VerificationSession | null;
  duplicate: boolean;
  error: string | null;
}

export function createVerificationSession(opts: {
  providerId: string;
  verificationType: VerificationProviderType;
  allowDuplicate?: boolean;
}): CreateSessionResult {
  const provider = getVerificationProvider(opts.providerId);
  if (!provider) {
    return { ok: false, session: null, duplicate: false, error: 'Missing provider — session creation blocked' };
  }

  const key = sessionKey(opts.providerId, opts.verificationType);
  if (sessionKeys.has(key) && !opts.allowDuplicate) {
    return { ok: false, session: null, duplicate: true, error: 'Duplicate session rejected' };
  }

  const session: VerificationSession = {
    verificationSessionId: nextSessionId(),
    providerId: opts.providerId,
    verificationType: opts.verificationType,
    sessionState: 'REGISTERED',
    startedAt: null,
    completedAt: null,
    warnings: ['Lifecycle only — no verification execution'],
    blockedReasons: [],
    lifecycleOnly: true,
  };

  sessions.set(session.verificationSessionId, session);
  sessionKeys.add(key);
  return { ok: true, session, duplicate: false, error: null };
}

export function updateVerificationSession(
  verificationSessionId: string,
  patch: Partial<Pick<VerificationSession, 'sessionState' | 'startedAt' | 'completedAt' | 'warnings' | 'blockedReasons'>>,
): VerificationSession | null {
  const existing = sessions.get(verificationSessionId);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  sessions.set(verificationSessionId, updated);
  return updated;
}

export function getVerificationSession(verificationSessionId: string): VerificationSession | null {
  return sessions.get(verificationSessionId) ?? null;
}

export function listVerificationSessions(): VerificationSession[] {
  return [...sessions.values()];
}

export function setVerificationSessionState(
  verificationSessionId: string,
  sessionState: VerificationSessionState,
): VerificationSession | null {
  return updateVerificationSession(verificationSessionId, { sessionState });
}
