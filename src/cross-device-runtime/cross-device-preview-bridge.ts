/**
 * Cross Device Runtime Foundation — Mobile Preview Runtime bridge.
 */

import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDevicePreviewLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToPreviewSession(
  crossDeviceId: string,
  mobilePreviewId: string,
): CrossDevicePreviewLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  const preview = getMobilePreviewSession(mobilePreviewId);
  if (!session || !preview) return null;

  const mismatch = preview.mobilePreviewOwner.projectId !== session.crossDeviceOwner.projectId;
  const link: CrossDevicePreviewLink = {
    mobilePreviewId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDevicePreviewLink: link,
    crossDeviceOwner: { ...session.crossDeviceOwner, mobilePreviewSessionId: mobilePreviewId },
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'PREVIEW',
    summary: `Linked to mobile preview ${mobilePreviewId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobilePreviewId,
  });

  return link;
}

export function getPreviewSessionForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDevicePreviewLink.mobilePreviewId ?? null;
}

export function listCrossDevicesByPreviewSession(mobilePreviewId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) =>
      s.crossDevicePreviewLink.mobilePreviewId === mobilePreviewId ||
      s.crossDeviceOwner.mobilePreviewSessionId === mobilePreviewId,
  );
}

export function detectCrossDevicePreviewMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  const preview = getMobilePreviewSession(session.crossDevicePreviewLink.mobilePreviewId);
  if (!preview) return true;
  return (
    preview.mobilePreviewOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDevicePreviewLink.mismatchDetected
  );
}

export function resolvePreviewForCrossDeviceRegistration(
  mobilePreviewId: string,
): { exists: boolean; projectId: string | null } {
  const preview = getMobilePreviewSession(mobilePreviewId);
  if (!preview) return { exists: false, projectId: null };
  return { exists: true, projectId: preview.mobilePreviewOwner.projectId };
}
