/**
 * Cloud Recovery Foundation — scope metadata (no recovery execution).
 */

import { getStoredCloudRecovery, storeCloudRecovery } from './cloud-recovery-store.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecoveryScope } from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

export function buildDefaultCloudRecoveryScope(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryType?: string;
  recoveryIntent?: string;
  failureCategory?: string;
}): CloudRecoveryScope {
  return {
    scopeType: input.recoveryType ?? 'GENERAL_RECOVERY',
    targetRuntimeId: input.runtimeId,
    targetWorkspaceId: input.workspaceId,
    targetPersistentBuildId: input.persistentBuildId,
    targetVerificationId: input.verificationId,
    targetProjectId: input.projectId,
    targetSessionId: null,
    failureCategory: input.failureCategory ?? 'UNKNOWN',
    recoveryIntent: input.recoveryIntent ?? 'Recovery coordination metadata only',
    requestedBySystem: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    cloudRecoveryMode: 'AUTHORITY_ONLY',
  };
}

export function updateCloudRecoveryScope(
  recoveryId: string,
  updates: Partial<CloudRecoveryScope>,
): CloudRecoveryScope | null {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return null;

  const scope: CloudRecoveryScope = { ...recovery.recoveryScope, ...updates };
  storeCloudRecovery({ ...recovery, recoveryScope: scope, updatedAt: Date.now() });

  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'SCOPE',
    summary: `Scope updated: ${scope.scopeType} failure=${scope.failureCategory}`,
    scopeUsed: scope.targetProjectId,
  });

  return scope;
}

export function getCloudRecoveryScope(recoveryId: string): CloudRecoveryScope | null {
  return getStoredCloudRecovery(recoveryId)?.recoveryScope ?? null;
}

export function validateCloudRecoveryScope(scope: CloudRecoveryScope): string[] {
  const issues: string[] = [];
  if (!scope.targetProjectId?.trim()) issues.push('Scope missing target project');
  if (!scope.failureCategory?.trim()) issues.push('Scope missing failure category');
  return issues;
}

export function detectScopeMismatch(recoveryId: string): boolean {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return true;
  const scope = recovery.recoveryScope;
  const owner = recovery.recoveryOwner;
  return (
    scope.targetProjectId !== owner.projectId ||
    (scope.targetRuntimeId !== null && scope.targetRuntimeId !== owner.runtimeId) ||
    (scope.targetWorkspaceId !== null && scope.targetWorkspaceId !== owner.workspaceId) ||
    (scope.targetPersistentBuildId !== null && scope.targetPersistentBuildId !== owner.persistentBuildId) ||
    (scope.targetVerificationId !== null && scope.targetVerificationId !== owner.verificationId)
  );
}
