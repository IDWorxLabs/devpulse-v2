/**
 * Mobile Approval Runtime Foundation — session manager.
 */

import {
  nextMobileApprovalTrackedSessionId,
  storeMobileApprovalTrackedSession,
  getStoredMobileApprovalTrackedSession,
  listStoredMobileApprovalTrackedSessions,
  getStoredMobileApprovalSession,
  storeMobileApprovalSession,
} from './mobile-approval-store.js';
import { updateMobileApprovalSessionOwnership } from './mobile-approval-ownership.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalTrackedSession, MobileApprovalVisibility } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function createMobileApprovalSession(input: {
  mobileApprovalId: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: MobileApprovalVisibility;
}): MobileApprovalTrackedSession | null {
  const approval = getStoredMobileApprovalSession(input.mobileApprovalId);
  if (!approval) return null;

  const now = Date.now();
  const tracked: MobileApprovalTrackedSession = {
    sessionId: nextMobileApprovalTrackedSessionId(),
    mobileApprovalId: input.mobileApprovalId,
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    mobilePreviewSessionId: input.mobilePreviewSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    sessionOwner: input.sessionOwner ?? MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    sessionState: approval.mobileApprovalState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'mobile_approval_runtime_foundation' },
    sessionVisibility: input.visibility ?? approval.mobileApprovalVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeMobileApprovalTrackedSession(tracked);

  storeMobileApprovalSession({
    ...approval,
    mobileApprovalOwner: updateMobileApprovalSessionOwnership(approval.mobileApprovalOwner, tracked.sessionId),
    updatedAt: now,
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId: input.mobileApprovalId,
    category: 'SESSION',
    summary: `Tracked session ${tracked.sessionId} created`,
    scopeUsed: tracked.sessionId,
  });

  return tracked;
}

export function getMobileApprovalTrackedSession(sessionId: string): MobileApprovalTrackedSession | null {
  return getStoredMobileApprovalTrackedSession(sessionId);
}

export function listMobileApprovalTrackedSessions(mobileApprovalId?: string): MobileApprovalTrackedSession[] {
  const all = listStoredMobileApprovalTrackedSessions();
  if (!mobileApprovalId) return all;
  return all.filter((s) => s.mobileApprovalId === mobileApprovalId);
}

export function trackSessionOwnership(sessionId: string, owner: string): MobileApprovalTrackedSession | null {
  const session = getStoredMobileApprovalTrackedSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeMobileApprovalTrackedSession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): MobileApprovalTrackedSession | null {
  const session = getStoredMobileApprovalTrackedSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeMobileApprovalTrackedSession(updated);
  return updated;
}

export function resetMobileApprovalSessionManagerForTests(): void {
  // Cleared via store reset
}
