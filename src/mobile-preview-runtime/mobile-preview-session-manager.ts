/**
 * Mobile Preview Runtime Foundation — session manager.
 */

import {
  nextMobilePreviewTrackedSessionId,
  storeMobilePreviewTrackedSession,
  getStoredMobilePreviewTrackedSession,
  listStoredMobilePreviewTrackedSessions,
  getStoredMobilePreviewSession,
  storeMobilePreviewSession,
} from './mobile-preview-store.js';
import { updateMobilePreviewSessionOwnership } from './mobile-preview-ownership.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewTrackedSession, MobilePreviewVisibility } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function createMobilePreviewSession(input: {
  mobilePreviewId: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: MobilePreviewVisibility;
}): MobilePreviewTrackedSession | null {
  const preview = getStoredMobilePreviewSession(input.mobilePreviewId);
  if (!preview) return null;

  const now = Date.now();
  const tracked: MobilePreviewTrackedSession = {
    sessionId: nextMobilePreviewTrackedSessionId(),
    mobilePreviewId: input.mobilePreviewId,
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    sessionOwner: input.sessionOwner ?? MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    sessionState: preview.mobilePreviewState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'mobile_preview_runtime_foundation' },
    sessionVisibility: input.visibility ?? preview.mobilePreviewVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeMobilePreviewTrackedSession(tracked);

  storeMobilePreviewSession({
    ...preview,
    mobilePreviewOwner: updateMobilePreviewSessionOwnership(preview.mobilePreviewOwner, tracked.sessionId),
    updatedAt: now,
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId: input.mobilePreviewId,
    category: 'SESSION',
    summary: `Tracked session ${tracked.sessionId} created`,
    scopeUsed: tracked.sessionId,
  });

  return tracked;
}

export function getMobilePreviewTrackedSession(sessionId: string): MobilePreviewTrackedSession | null {
  return getStoredMobilePreviewTrackedSession(sessionId);
}

export function listMobilePreviewTrackedSessions(mobilePreviewId?: string): MobilePreviewTrackedSession[] {
  const all = listStoredMobilePreviewTrackedSessions();
  if (!mobilePreviewId) return all;
  return all.filter((s) => s.mobilePreviewId === mobilePreviewId);
}

export function trackSessionOwnership(sessionId: string, owner: string): MobilePreviewTrackedSession | null {
  const session = getStoredMobilePreviewTrackedSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeMobilePreviewTrackedSession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): MobilePreviewTrackedSession | null {
  const session = getStoredMobilePreviewTrackedSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeMobilePreviewTrackedSession(updated);
  return updated;
}

export function resetMobilePreviewSessionManagerForTests(): void {
  // Cleared via store reset
}
