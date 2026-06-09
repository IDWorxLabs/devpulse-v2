/**
 * Cross Device Runtime Foundation — Mobile Approval Runtime bridge.
 */

import { getMobileApprovalSession } from '../mobile-approval-runtime/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDeviceApprovalLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToApprovalSession(
  crossDeviceId: string,
  mobileApprovalId: string,
): CrossDeviceApprovalLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  const approval = getMobileApprovalSession(mobileApprovalId);
  if (!session || !approval) return null;

  const mismatch = approval.mobileApprovalOwner.projectId !== session.crossDeviceOwner.projectId;
  const link: CrossDeviceApprovalLink = {
    mobileApprovalId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDeviceApprovalLink: link,
    crossDeviceOwner: { ...session.crossDeviceOwner, mobileApprovalSessionId: mobileApprovalId },
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'APPROVAL',
    summary: `Linked to mobile approval ${mobileApprovalId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileApprovalId,
  });

  return link;
}

export function getApprovalSessionForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceApprovalLink.mobileApprovalId ?? null;
}

export function listCrossDevicesByApprovalSession(mobileApprovalId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) =>
      s.crossDeviceApprovalLink.mobileApprovalId === mobileApprovalId ||
      s.crossDeviceOwner.mobileApprovalSessionId === mobileApprovalId,
  );
}

export function detectCrossDeviceApprovalMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  const approval = getMobileApprovalSession(session.crossDeviceApprovalLink.mobileApprovalId);
  if (!approval) return true;
  return (
    approval.mobileApprovalOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceApprovalLink.mismatchDetected
  );
}

export function resolveApprovalForCrossDeviceRegistration(
  mobileApprovalId: string,
): { exists: boolean; projectId: string | null } {
  const approval = getMobileApprovalSession(mobileApprovalId);
  if (!approval) return { exists: false, projectId: null };
  return { exists: true, projectId: approval.mobileApprovalOwner.projectId };
}
