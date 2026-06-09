/**
 * Mobile Preview Runtime Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredMobilePreviewSession, listStoredMobilePreviewSessions, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewSession, MobilePreviewCloudLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function linkMobilePreviewToCloud(mobilePreviewId: string, runtimeId: string): MobilePreviewCloudLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  const runtime = getRuntime(runtimeId);
  if (!session || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== session.mobilePreviewOwner.projectId;
  const link: MobilePreviewCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewCloudLink: link,
    mobilePreviewOwner: { ...session.mobilePreviewOwner, runtimeId },
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'RUNTIME',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForMobilePreview(mobilePreviewId: string): string | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewCloudLink.runtimeId ?? null;
}

export function listMobilePreviewsByRuntime(runtimeId: string): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions().filter(
    (s) => s.mobilePreviewCloudLink.runtimeId === runtimeId || s.mobilePreviewOwner.runtimeId === runtimeId,
  );
}

export function detectMobilePreviewCloudMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;
  const runtime = getRuntime(session.mobilePreviewCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== session.mobilePreviewOwner.projectId ||
    session.mobilePreviewCloudLink.mismatchDetected
  );
}

export function resolveRuntimeForMobilePreviewRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}
