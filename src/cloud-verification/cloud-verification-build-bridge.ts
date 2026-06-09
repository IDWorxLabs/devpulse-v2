/**
 * Cloud Verification Foundation — Persistent Build Runtime Foundation bridge.
 */

import { getPersistentBuild, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import {
  getStoredCloudVerification,
  listStoredCloudVerifications,
  storeCloudVerification,
} from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerification, CloudVerificationPersistentBuildLink } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function linkCloudVerificationToPersistentBuild(
  verificationId: string,
  persistentBuildId: string,
): CloudVerificationPersistentBuildLink | null {
  const verification = getStoredCloudVerification(verificationId);
  const build = getPersistentBuild(persistentBuildId);
  if (!verification || !build) return null;

  const mismatch = build.buildOwner.projectId !== verification.verificationOwner.projectId;
  const link: CloudVerificationPersistentBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudVerification({
    ...verification,
    verificationPersistentBuildLink: link,
    verificationOwner: { ...verification.verificationOwner, persistentBuildId },
    verificationRelationships: {
      ...verification.verificationRelationships,
      relatedPersistentBuildIds: [
        ...new Set([...verification.verificationRelationships.relatedPersistentBuildIds, persistentBuildId]),
      ],
    },
    updatedAt: Date.now(),
  });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'PERSISTENT_BUILD',
    summary: `Linked to persistent build ${persistentBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: persistentBuildId,
  });

  return link;
}

export function getPersistentBuildForCloudVerification(verificationId: string): string | null {
  return getStoredCloudVerification(verificationId)?.verificationPersistentBuildLink.persistentBuildId ?? null;
}

export function listCloudVerificationsByPersistentBuild(persistentBuildId: string): CloudVerification[] {
  return listStoredCloudVerifications().filter(
    (v) =>
      v.verificationPersistentBuildLink.persistentBuildId === persistentBuildId ||
      v.verificationOwner.persistentBuildId === persistentBuildId,
  );
}

export function detectCloudVerificationBuildMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  const build = getPersistentBuild(verification.verificationPersistentBuildLink.persistentBuildId);
  if (!build) return true;
  return (
    build.buildOwner.projectId !== verification.verificationOwner.projectId ||
    verification.verificationPersistentBuildLink.mismatchDetected
  );
}

export function resolvePersistentBuildForVerificationRegistration(
  persistentBuildId: string,
): { exists: boolean; projectId: string | null; runtimeId: string | null; workspaceId: string | null } {
  const build = getPersistentBuild(persistentBuildId);
  if (!build) return { exists: false, projectId: null, runtimeId: null, workspaceId: null };
  return {
    exists: true,
    projectId: build.buildOwner.projectId,
    runtimeId: build.buildOwner.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
  };
}

export function listAvailablePersistentBuildIdsForVerificationBridge(): string[] {
  return listPersistentBuilds().map((b) => b.buildId);
}
