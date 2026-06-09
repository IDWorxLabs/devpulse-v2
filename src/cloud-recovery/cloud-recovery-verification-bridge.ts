/**
 * Cloud Recovery Foundation — Cloud Verification Foundation bridge.
 */

import { getCloudVerification, listCloudVerifications } from '../cloud-verification/index.js';
import { getStoredCloudRecovery, listStoredCloudRecoveries, storeCloudRecovery } from './cloud-recovery-store.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecovery, CloudRecoveryVerificationLink } from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

export function linkRecoveryToVerification(
  recoveryId: string,
  verificationId: string,
): CloudRecoveryVerificationLink | null {
  const recovery = getStoredCloudRecovery(recoveryId);
  const verification = getCloudVerification(verificationId);
  if (!recovery || !verification) return null;

  const mismatch = verification.verificationOwner.projectId !== recovery.recoveryOwner.projectId;
  const link: CloudRecoveryVerificationLink = {
    verificationId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudRecovery({
    ...recovery,
    recoveryVerificationLink: link,
    recoveryOwner: { ...recovery.recoveryOwner, verificationId },
    recoveryRelationships: {
      ...recovery.recoveryRelationships,
      relatedVerificationIds: [
        ...new Set([...recovery.recoveryRelationships.relatedVerificationIds, verificationId]),
      ],
    },
    updatedAt: Date.now(),
  });

  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'VERIFICATION',
    summary: `Linked to verification ${verificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: verificationId,
  });

  return link;
}

export function getVerificationForRecovery(recoveryId: string): string | null {
  return getStoredCloudRecovery(recoveryId)?.recoveryVerificationLink.verificationId ?? null;
}

export function listRecoveriesByVerification(verificationId: string): CloudRecovery[] {
  return listStoredCloudRecoveries().filter(
    (r) =>
      r.recoveryVerificationLink.verificationId === verificationId ||
      r.recoveryOwner.verificationId === verificationId,
  );
}

export function detectRecoveryVerificationMismatch(recoveryId: string): boolean {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return true;
  const verification = getCloudVerification(recovery.recoveryVerificationLink.verificationId);
  if (!verification) return true;
  return (
    verification.verificationOwner.projectId !== recovery.recoveryOwner.projectId ||
    recovery.recoveryVerificationLink.mismatchDetected
  );
}

export function resolveVerificationForRecoveryRegistration(
  verificationId: string,
): { exists: boolean; projectId: string | null } {
  const verification = getCloudVerification(verificationId);
  if (!verification) return { exists: false, projectId: null };
  return { exists: true, projectId: verification.verificationOwner.projectId };
}

export function listAvailableVerificationIdsForRecoveryBridge(): string[] {
  return listCloudVerifications().map((v) => v.verificationId);
}
