/**
 * Cloud Verification Foundation — scope metadata (no provider execution).
 */

import { getStoredCloudVerification, storeCloudVerification } from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerificationScope } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function buildDefaultCloudVerificationScope(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationType?: string;
  verificationIntent?: string;
}): CloudVerificationScope {
  return {
    scopeType: input.verificationType ?? 'GENERAL_CLOUD_VERIFICATION',
    targetRuntimeId: input.runtimeId,
    targetWorkspaceId: input.workspaceId,
    targetPersistentBuildId: input.persistentBuildId,
    targetProjectId: input.projectId,
    targetSessionId: null,
    verificationDepth: 'STANDARD',
    verificationIntent: input.verificationIntent ?? 'Cloud verification coordination metadata only',
    requestedBySystem: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    cloudVerificationMode: 'AUTHORITY_ONLY',
  };
}

export function updateCloudVerificationScope(
  verificationId: string,
  updates: Partial<CloudVerificationScope>,
): CloudVerificationScope | null {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return null;

  const scope: CloudVerificationScope = { ...verification.verificationScope, ...updates };
  storeCloudVerification({ ...verification, verificationScope: scope, updatedAt: Date.now() });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'SCOPE',
    summary: `Scope updated: ${scope.scopeType} depth=${scope.verificationDepth}`,
    scopeUsed: scope.targetProjectId,
  });

  return scope;
}

export function getCloudVerificationScope(verificationId: string): CloudVerificationScope | null {
  return getStoredCloudVerification(verificationId)?.verificationScope ?? null;
}

export function validateCloudVerificationScope(scope: CloudVerificationScope): string[] {
  const issues: string[] = [];
  if (!scope.targetProjectId?.trim()) issues.push('Scope missing target project');
  if (scope.scopeType !== 'RUNTIME_VERIFICATION' && !scope.targetRuntimeId) {
    issues.push('Scope missing target runtime for non-runtime verification');
  }
  return issues;
}

export function detectScopeMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  const scope = verification.verificationScope;
  const owner = verification.verificationOwner;
  return (
    scope.targetProjectId !== owner.projectId ||
    (scope.targetRuntimeId !== null && scope.targetRuntimeId !== owner.runtimeId) ||
    (scope.targetWorkspaceId !== null && scope.targetWorkspaceId !== owner.workspaceId) ||
    (scope.targetPersistentBuildId !== null && scope.targetPersistentBuildId !== owner.persistentBuildId)
  );
}
