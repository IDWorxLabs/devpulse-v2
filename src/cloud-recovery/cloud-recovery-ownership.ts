/**
 * Cloud Recovery Foundation — ownership tracking.
 */

import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecoveryOwnership } from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

export function buildCloudRecoveryOwnership(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  createdBy?: string;
}): CloudRecoveryOwnership {
  return {
    ownerModule: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'cloud_recovery_foundation',
    createdBy: input.createdBy ?? CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoverySessionId: null,
    recoveryAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordRecoveryOwnershipHistory(recoveryId: string, summary: string): void {
  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: recoveryId,
  });
}

export function updateRecoverySessionOwnership(
  ownership: CloudRecoveryOwnership,
  sessionId: string,
): CloudRecoveryOwnership {
  return { ...ownership, recoverySessionId: sessionId };
}
