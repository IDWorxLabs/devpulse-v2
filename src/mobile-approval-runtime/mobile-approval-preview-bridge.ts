/**
 * Mobile Approval Runtime Foundation — Mobile Preview Runtime bridge.
 */

import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalSession, MobileApprovalPreviewLink } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function linkMobileApprovalToPreviewSession(
  mobileApprovalId: string,
  mobilePreviewId: string,
): MobileApprovalPreviewLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const preview = getMobilePreviewSession(mobilePreviewId);
  if (!session || !preview) return null;

  const mismatch = preview.mobilePreviewOwner.projectId !== session.mobileApprovalOwner.projectId;
  const link: MobileApprovalPreviewLink = {
    mobilePreviewId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalPreviewLink: link,
    mobileApprovalOwner: { ...session.mobileApprovalOwner, mobilePreviewSessionId: mobilePreviewId },
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'PREVIEW',
    summary: `Linked to mobile preview ${mobilePreviewId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobilePreviewId,
  });

  return link;
}

export function getPreviewSessionForMobileApproval(mobileApprovalId: string): string | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalPreviewLink.mobilePreviewId ?? null;
}

export function listMobileApprovalsByPreviewSession(mobilePreviewId: string): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions().filter(
    (s) =>
      s.mobileApprovalPreviewLink.mobilePreviewId === mobilePreviewId ||
      s.mobileApprovalOwner.mobilePreviewSessionId === mobilePreviewId,
  );
}

export function detectMobileApprovalPreviewMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  const preview = getMobilePreviewSession(session.mobileApprovalPreviewLink.mobilePreviewId);
  if (!preview) return true;
  return (
    preview.mobilePreviewOwner.projectId !== session.mobileApprovalOwner.projectId ||
    session.mobileApprovalPreviewLink.mismatchDetected
  );
}

export function resolvePreviewForMobileApprovalRegistration(
  mobilePreviewId: string,
): { exists: boolean; projectId: string | null } {
  const preview = getMobilePreviewSession(mobilePreviewId);
  if (!preview) return { exists: false, projectId: null };
  return { exists: true, projectId: preview.mobilePreviewOwner.projectId };
}
