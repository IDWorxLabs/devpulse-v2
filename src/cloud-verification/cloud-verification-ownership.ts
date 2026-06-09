/**
 * Cloud Verification Foundation — ownership tracking.
 */

import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerificationOwnership } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function buildCloudVerificationOwnership(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  createdBy?: string;
}): CloudVerificationOwnership {
  return {
    ownerModule: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'cloud_verification_foundation',
    createdBy: input.createdBy ?? CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationSessionId: null,
    verificationAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordVerificationOwnershipHistory(
  verificationId: string,
  summary: string,
): void {
  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: verificationId,
  });
}

export function updateVerificationSessionOwnership(
  ownership: CloudVerificationOwnership,
  sessionId: string,
): CloudVerificationOwnership {
  return { ...ownership, verificationSessionId: sessionId };
}
