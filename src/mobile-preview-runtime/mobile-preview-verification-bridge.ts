/**
 * Mobile Preview Runtime Foundation — Cloud Verification bridge.
 */

import { getCloudVerification } from '../cloud-verification/index.js';
import { getStoredMobilePreviewSession, listStoredMobilePreviewSessions, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewSession, MobilePreviewVerificationLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function linkMobilePreviewToVerification(
  mobilePreviewId: string,
  verificationId: string,
): MobilePreviewVerificationLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  const verification = getCloudVerification(verificationId);
  if (!session || !verification) return null;

  const mismatch = verification.verificationOwner.projectId !== session.mobilePreviewOwner.projectId;
  const link: MobilePreviewVerificationLink = {
    verificationId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewVerificationLink: link,
    mobilePreviewOwner: { ...session.mobilePreviewOwner, verificationId },
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'VERIFICATION',
    summary: `Linked to verification ${verificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: verificationId,
  });

  return link;
}

export function getVerificationForMobilePreview(mobilePreviewId: string): string | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewVerificationLink.verificationId ?? null;
}

export function listMobilePreviewsByVerification(verificationId: string): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions().filter(
    (s) =>
      s.mobilePreviewVerificationLink.verificationId === verificationId ||
      s.mobilePreviewOwner.verificationId === verificationId,
  );
}

export function detectMobilePreviewVerificationMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;
  const verification = getCloudVerification(session.mobilePreviewVerificationLink.verificationId);
  if (!verification) return true;
  return (
    verification.verificationOwner.projectId !== session.mobilePreviewOwner.projectId ||
    session.mobilePreviewVerificationLink.mismatchDetected
  );
}

export function resolveVerificationForMobilePreviewRegistration(
  verificationId: string,
): { exists: boolean; projectId: string | null } {
  const verification = getCloudVerification(verificationId);
  if (!verification) return { exists: false, projectId: null };
  return { exists: true, projectId: verification.verificationOwner.projectId };
}
