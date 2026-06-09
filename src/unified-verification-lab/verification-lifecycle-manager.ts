/**
 * Verification lifecycle manager — provider and session lifecycle only.
 */

import {
  registerProvider,
  registerInitialProviders,
  getVerificationProvider,
  listVerificationProviders,
  buildInitialProviderDefinition,
  type RegisterProviderResult,
} from './verification-provider-registry.js';
import {
  createVerificationSession,
  getVerificationSession,
  listVerificationSessions,
  updateVerificationSession,
  type CreateSessionResult,
} from './verification-session-manager.js';
import type { VerificationProvider, VerificationProviderType, VerificationSession } from './types.js';

export {
  registerProvider,
  registerInitialProviders,
  getVerificationProvider,
  listVerificationProviders,
  createVerificationSession,
  getVerificationSession,
  listVerificationSessions,
};

export function startVerificationSession(verificationSessionId: string): VerificationSession | null {
  const session = getVerificationSession(verificationSessionId);
  if (!session) return null;
  if (session.sessionState === 'BLOCKED' || session.sessionState === 'FAILED') return session;

  return updateVerificationSession(verificationSessionId, {
    sessionState: 'RUNNING',
    startedAt: session.startedAt ?? Date.now(),
    warnings: [...session.warnings, 'Session started — lifecycle transition only, no verification execution'],
  });
}

export function completeVerificationSession(verificationSessionId: string): VerificationSession | null {
  const session = getVerificationSession(verificationSessionId);
  if (!session) return null;

  return updateVerificationSession(verificationSessionId, {
    sessionState: 'COMPLETED',
    completedAt: Date.now(),
    warnings: [...session.warnings, 'Session completed — lifecycle only, no evidence or report orchestration'],
  });
}

export function failVerificationSession(
  verificationSessionId: string,
  reason: string,
): VerificationSession | null {
  const session = getVerificationSession(verificationSessionId);
  if (!session) return null;

  return updateVerificationSession(verificationSessionId, {
    sessionState: 'FAILED',
    completedAt: Date.now(),
    blockedReasons: [...session.blockedReasons, reason],
    warnings: [...session.warnings, 'Session failed — lifecycle transition only'],
  });
}

export function markSessionReady(verificationSessionId: string): VerificationSession | null {
  const session = getVerificationSession(verificationSessionId);
  if (!session) return null;

  return updateVerificationSession(verificationSessionId, {
    sessionState: 'READY',
    warnings: [...session.warnings, 'Session ready — awaiting future provider execution'],
  });
}

export function registerProviderDefinition(
  providerType: VerificationProviderType,
): RegisterProviderResult {
  return registerProvider(buildInitialProviderDefinition(providerType));
}

export function bootstrapVerificationSessions(): CreateSessionResult[] {
  const results: CreateSessionResult[] = [];
  for (const provider of listVerificationProviders()) {
    results.push(
      createVerificationSession({
        providerId: provider.providerId,
        verificationType: provider.providerType,
      }),
    );
  }
  return results;
}

export function advanceSessionLifecycle(verificationSessionId: string): VerificationSession | null {
  markSessionReady(verificationSessionId);
  startVerificationSession(verificationSessionId);
  return completeVerificationSession(verificationSessionId);
}
