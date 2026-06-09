/**
 * Cloud Recovery Foundation — session manager.
 */

import {
  nextRecoverySessionId,
  storeCloudRecoverySession,
  getStoredCloudRecoverySession,
  listStoredCloudRecoverySessions,
  getStoredCloudRecovery,
  storeCloudRecovery,
} from './cloud-recovery-store.js';
import { updateRecoverySessionOwnership } from './cloud-recovery-ownership.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecoverySession, CloudRecoveryVisibility } from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

export function createRecoverySession(input: {
  recoveryId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: CloudRecoveryVisibility;
}): CloudRecoverySession | null {
  const recovery = getStoredCloudRecovery(input.recoveryId);
  if (!recovery) return null;

  const now = Date.now();
  const session: CloudRecoverySession = {
    sessionId: nextRecoverySessionId(),
    recoveryId: input.recoveryId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    sessionOwner: input.sessionOwner ?? CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    sessionState: recovery.recoveryState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'cloud_recovery_foundation' },
    sessionVisibility: input.visibility ?? recovery.recoveryVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeCloudRecoverySession(session);

  storeCloudRecovery({
    ...recovery,
    recoveryOwner: updateRecoverySessionOwnership(recovery.recoveryOwner, session.sessionId),
    recoveryScope: { ...recovery.recoveryScope, targetSessionId: session.sessionId },
    updatedAt: now,
  });

  recordCloudRecoveryHistoryEntry({
    recoveryId: input.recoveryId,
    category: 'SESSION',
    summary: `Session ${session.sessionId} created`,
    scopeUsed: session.sessionId,
  });

  return session;
}

export function getRecoverySession(sessionId: string): CloudRecoverySession | null {
  return getStoredCloudRecoverySession(sessionId);
}

export function listRecoverySessions(recoveryId?: string): CloudRecoverySession[] {
  const all = listStoredCloudRecoverySessions();
  if (!recoveryId) return all;
  return all.filter((s) => s.recoveryId === recoveryId);
}

export function trackSessionOwnership(sessionId: string, owner: string): CloudRecoverySession | null {
  const session = getStoredCloudRecoverySession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeCloudRecoverySession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): CloudRecoverySession | null {
  const session = getStoredCloudRecoverySession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeCloudRecoverySession(updated);
  return updated;
}

export function resetCloudRecoverySessionManagerForTests(): void {
  // Sessions cleared via store reset
}
