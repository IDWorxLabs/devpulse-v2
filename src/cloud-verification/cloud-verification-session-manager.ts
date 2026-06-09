/**
 * Cloud Verification Foundation — session manager.
 */

import {
  nextCloudVerificationSessionId,
  storeCloudVerificationSession,
  getStoredCloudVerificationSession,
  listStoredCloudVerificationSessions,
  getStoredCloudVerification,
  storeCloudVerification,
} from './cloud-verification-store.js';
import { updateVerificationSessionOwnership } from './cloud-verification-ownership.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerificationSession, CloudVerificationVisibility } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function createCloudVerificationSession(input: {
  verificationId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: CloudVerificationVisibility;
}): CloudVerificationSession | null {
  const verification = getStoredCloudVerification(input.verificationId);
  if (!verification) return null;

  const now = Date.now();
  const session: CloudVerificationSession = {
    sessionId: nextCloudVerificationSessionId(),
    verificationId: input.verificationId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    sessionOwner: input.sessionOwner ?? CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    sessionState: verification.verificationState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'cloud_verification_foundation' },
    sessionVisibility: input.visibility ?? verification.verificationVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeCloudVerificationSession(session);

  storeCloudVerification({
    ...verification,
    verificationOwner: updateVerificationSessionOwnership(verification.verificationOwner, session.sessionId),
    verificationScope: { ...verification.verificationScope, targetSessionId: session.sessionId },
    updatedAt: now,
  });

  recordCloudVerificationHistoryEntry({
    verificationId: input.verificationId,
    category: 'SESSION',
    summary: `Session ${session.sessionId} created`,
    scopeUsed: session.sessionId,
  });

  return session;
}

export function getCloudVerificationSession(sessionId: string): CloudVerificationSession | null {
  return getStoredCloudVerificationSession(sessionId);
}

export function listCloudVerificationSessions(verificationId?: string): CloudVerificationSession[] {
  const all = listStoredCloudVerificationSessions();
  if (!verificationId) return all;
  return all.filter((s) => s.verificationId === verificationId);
}

export function trackSessionOwnership(sessionId: string, owner: string): CloudVerificationSession | null {
  const session = getStoredCloudVerificationSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeCloudVerificationSession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): CloudVerificationSession | null {
  const session = getStoredCloudVerificationSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeCloudVerificationSession(updated);
  return updated;
}

export function resetCloudVerificationSessionManagerForTests(): void {
  // Sessions cleared via store reset
}
