/**
 * Cloud Verification Foundation — Verification Evidence Engine bridge.
 */

import { getEvidence, listEvidence } from '../verification-evidence-engine/index.js';
import {
  getStoredCloudVerification,
  listStoredCloudVerifications,
  storeCloudVerification,
} from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerification, CloudVerificationEvidenceLink } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function linkCloudVerificationEvidence(
  verificationId: string,
  evidenceIds: string[],
): CloudVerificationEvidenceLink | null {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return null;

  const validIds = evidenceIds.filter((id) => getEvidence(id) !== null);
  const mismatchDetected = validIds.length !== evidenceIds.length;

  const link: CloudVerificationEvidenceLink = {
    evidenceIds: [...new Set([...verification.verificationEvidenceLink.evidenceIds, ...validIds])],
    linkedAt: Date.now(),
    linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    mismatchDetected,
  };

  storeCloudVerification({
    ...verification,
    verificationEvidenceLink: link,
    updatedAt: Date.now(),
  });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'EVIDENCE',
    summary: `Linked evidence: ${validIds.join(', ') || 'none'}`,
    scopeUsed: validIds[0] ?? null,
  });

  return link;
}

export function getEvidenceForCloudVerification(verificationId: string): string[] {
  return getStoredCloudVerification(verificationId)?.verificationEvidenceLink.evidenceIds ?? [];
}

export function listCloudVerificationsByEvidence(evidenceId: string): CloudVerification[] {
  return listStoredCloudVerifications().filter((v) =>
    v.verificationEvidenceLink.evidenceIds.includes(evidenceId),
  );
}

export function detectEvidenceMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  for (const id of verification.verificationEvidenceLink.evidenceIds) {
    if (!getEvidence(id)) return true;
  }
  return verification.verificationEvidenceLink.mismatchDetected;
}

export function listAvailableEvidenceIdsForBridge(): string[] {
  return listEvidence().slice(0, 20).map((e) => e.evidenceId);
}
