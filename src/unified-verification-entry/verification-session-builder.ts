/**
 * Verification session builder — authority only, no provider execution.
 */

import type {
  VerificationRequestType,
  VerificationSession,
  VerificationStateType,
  VerificationVisibility,
} from './unified-verification-types.js';

const sessions = new Map<string, VerificationSession>();

let sessionCounter = 0;

export function resetVerificationEntrySessionsForTests(): void {
  sessions.clear();
  sessionCounter = 0;
}

export function nextEntrySessionId(): string {
  sessionCounter += 1;
  return `uvent-${sessionCounter.toString().padStart(4, '0')}`;
}

export function buildVerificationSession(opts: {
  requestId: string;
  sessionType: VerificationRequestType;
  state: VerificationStateType;
  ownerModule?: string;
  visibility?: VerificationVisibility;
  metadata?: Record<string, string | number | boolean>;
}): VerificationSession {
  const session: VerificationSession = {
    sessionId: nextEntrySessionId(),
    requestId: opts.requestId,
    sessionType: opts.sessionType,
    ownerModule: opts.ownerModule ?? 'devpulse_v2_unified_verification_entry',
    state: opts.state,
    createdAt: Date.now(),
    metadata: { lifecycleOnly: true, ...opts.metadata },
    visibility: opts.visibility ?? 'PROJECT',
    authorityOnly: true,
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getVerificationSession(sessionId: string): VerificationSession | null {
  return sessions.get(sessionId) ?? null;
}

export function listVerificationSessions(): VerificationSession[] {
  return [...sessions.values()];
}

export function updateVerificationSessionState(
  sessionId: string,
  state: VerificationStateType,
): VerificationSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const updated = { ...session, state };
  sessions.set(sessionId, updated);
  return updated;
}
