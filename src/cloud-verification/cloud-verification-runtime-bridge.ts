/**
 * Cloud Verification Foundation — Cloud Runtime Foundation bridge.
 */

import { getRuntime, listRuntimes } from '../cloud-runtime/index.js';
import {
  getStoredCloudVerification,
  listStoredCloudVerifications,
  storeCloudVerification,
} from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerification, CloudVerificationRuntimeLink } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function linkCloudVerificationToRuntime(
  verificationId: string,
  runtimeId: string,
): CloudVerificationRuntimeLink | null {
  const verification = getStoredCloudVerification(verificationId);
  const runtime = getRuntime(runtimeId);
  if (!verification || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== verification.verificationOwner.projectId;
  const link: CloudVerificationRuntimeLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudVerification({
    ...verification,
    verificationRuntimeLink: link,
    verificationOwner: { ...verification.verificationOwner, runtimeId },
    verificationRelationships: {
      ...verification.verificationRelationships,
      relatedRuntimeIds: [...new Set([...verification.verificationRelationships.relatedRuntimeIds, runtimeId])],
    },
    updatedAt: Date.now(),
  });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'RUNTIME',
    summary: `Linked to runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getRuntimeForCloudVerification(verificationId: string): string | null {
  return getStoredCloudVerification(verificationId)?.verificationRuntimeLink.runtimeId ?? null;
}

export function listCloudVerificationsByRuntime(runtimeId: string): CloudVerification[] {
  return listStoredCloudVerifications().filter(
    (v) => v.verificationRuntimeLink.runtimeId === runtimeId || v.verificationOwner.runtimeId === runtimeId,
  );
}

export function detectCloudVerificationRuntimeMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  const runtime = getRuntime(verification.verificationRuntimeLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== verification.verificationOwner.projectId ||
    verification.verificationRuntimeLink.mismatchDetected
  );
}

export function resolveRuntimeForVerificationRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}

export function listAvailableRuntimeIdsForVerificationBridge(): string[] {
  return listRuntimes().map((r) => r.runtimeId);
}
