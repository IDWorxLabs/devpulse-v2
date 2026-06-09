/**
 * Mobile Preview Runtime Foundation — Persistent Build bridge.
 */

import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredMobilePreviewSession, listStoredMobilePreviewSessions, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewSession, MobilePreviewBuildLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function linkMobilePreviewToBuild(
  mobilePreviewId: string,
  persistentBuildId: string,
): MobilePreviewBuildLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  const build = getPersistentBuild(persistentBuildId);
  if (!session || !build) return null;

  const mismatch = build.buildOwner.projectId !== session.mobilePreviewOwner.projectId;
  const link: MobilePreviewBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewBuildLink: link,
    mobilePreviewOwner: { ...session.mobilePreviewOwner, persistentBuildId },
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'PERSISTENT_BUILD',
    summary: `Linked to build ${persistentBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: persistentBuildId,
  });

  return link;
}

export function getBuildForMobilePreview(mobilePreviewId: string): string | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewBuildLink.persistentBuildId ?? null;
}

export function listMobilePreviewsByPersistentBuild(persistentBuildId: string): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions().filter(
    (s) =>
      s.mobilePreviewBuildLink.persistentBuildId === persistentBuildId ||
      s.mobilePreviewOwner.persistentBuildId === persistentBuildId,
  );
}

export function detectMobilePreviewBuildMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;
  const build = getPersistentBuild(session.mobilePreviewBuildLink.persistentBuildId);
  if (!build) return true;
  return (
    build.buildOwner.projectId !== session.mobilePreviewOwner.projectId ||
    session.mobilePreviewBuildLink.mismatchDetected
  );
}

export function resolveBuildForMobilePreviewRegistration(
  persistentBuildId: string,
): { exists: boolean; projectId: string | null } {
  const build = getPersistentBuild(persistentBuildId);
  if (!build) return { exists: false, projectId: null };
  return { exists: true, projectId: build.buildOwner.projectId };
}
