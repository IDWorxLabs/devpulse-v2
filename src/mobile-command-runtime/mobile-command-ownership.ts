/**
 * Mobile Command Runtime Foundation — ownership tracking.
 */

import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandOwnership } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function buildMobileCommandOwnership(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  createdBy?: string;
}): MobileCommandOwnership {
  return {
    ownerModule: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'mobile_command_runtime_foundation',
    createdBy: input.createdBy ?? MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    monitoringId: input.monitoringId,
    mobileCommandSessionId: null,
    mobileCommandAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordMobileCommandOwnershipHistory(mobileCommandId: string, summary: string): void {
  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: mobileCommandId,
  });
}

export function updateMobileCommandSessionOwnership(
  ownership: MobileCommandOwnership,
  sessionId: string,
): MobileCommandOwnership {
  return { ...ownership, mobileCommandSessionId: sessionId };
}
