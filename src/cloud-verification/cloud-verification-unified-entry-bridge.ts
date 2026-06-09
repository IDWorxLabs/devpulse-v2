/**
 * Cloud Verification Foundation — Unified Verification Entry bridge.
 * Unified Verification Entry remains global verification source of truth.
 */

import { requestVerification } from '../unified-verification-entry/unified-verification-entry.js';
import { getVerificationSession } from '../unified-verification-entry/verification-session-builder.js';
import {
  getStoredCloudVerification,
  listStoredCloudVerifications,
  storeCloudVerification,
} from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerification, CloudVerificationUnifiedEntryLink } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function requestCloudVerificationThroughUnifiedEntry(
  verificationId: string,
  query = 'Request cloud verification through unified entry',
): CloudVerificationUnifiedEntryLink | null {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return null;

  const result = requestVerification({
    query,
    requestType: 'PROJECT_VERIFICATION',
    scopeType: 'PROJECT',
    projectId: verification.verificationOwner.projectId,
    workspaceId: verification.verificationOwner.workspaceId,
    requestedBy: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
  });

  const sessionId = result.response?.session?.sessionId ?? '';
  const requestId = result.response?.request?.requestId ?? null;
  if (!sessionId) return null;

  const link: CloudVerificationUnifiedEntryLink = {
    unifiedSessionId: sessionId,
    unifiedRequestId: requestId,
    authorityId: result.authorityId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !result.validationValid,
  };

  storeCloudVerification({
    ...verification,
    verificationUnifiedEntryLink: link,
    updatedAt: Date.now(),
  });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'UNIFIED_ENTRY',
    summary: `Linked to unified entry session ${sessionId}`,
    scopeUsed: sessionId,
  });

  return link;
}

export function getUnifiedVerificationForCloudVerification(verificationId: string): string | null {
  return getStoredCloudVerification(verificationId)?.verificationUnifiedEntryLink.unifiedSessionId ?? null;
}

export function listCloudVerificationsByUnifiedSession(unifiedSessionId: string): CloudVerification[] {
  return listStoredCloudVerifications().filter(
    (v) => v.verificationUnifiedEntryLink.unifiedSessionId === unifiedSessionId,
  );
}

export function detectUnifiedVerificationMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  const sessionId = verification.verificationUnifiedEntryLink.unifiedSessionId;
  if (!sessionId) return true;
  const session = getVerificationSession(sessionId);
  if (!session) return true;
  return verification.verificationUnifiedEntryLink.mismatchDetected;
}
