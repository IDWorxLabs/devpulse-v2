/**
 * Mobile Command Runtime Foundation — session manager.
 */

import {
  nextMobileCommandTrackedSessionId,
  storeMobileCommandTrackedSession,
  getStoredMobileCommandTrackedSession,
  listStoredMobileCommandTrackedSessions,
  getStoredMobileCommandSession,
  storeMobileCommandSession,
} from './mobile-command-store.js';
import { updateMobileCommandSessionOwnership } from './mobile-command-ownership.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandTrackedSession, MobileCommandVisibility } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function createMobileCommandSession(input: {
  mobileCommandId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: MobileCommandVisibility;
}): MobileCommandTrackedSession | null {
  const command = getStoredMobileCommandSession(input.mobileCommandId);
  if (!command) return null;

  const now = Date.now();
  const tracked: MobileCommandTrackedSession = {
    sessionId: nextMobileCommandTrackedSessionId(),
    mobileCommandId: input.mobileCommandId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    monitoringId: input.monitoringId,
    sessionOwner: input.sessionOwner ?? MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    sessionState: command.mobileCommandState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'mobile_command_runtime_foundation' },
    sessionVisibility: input.visibility ?? command.mobileCommandVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeMobileCommandTrackedSession(tracked);

  storeMobileCommandSession({
    ...command,
    mobileCommandOwner: updateMobileCommandSessionOwnership(command.mobileCommandOwner, tracked.sessionId),
    updatedAt: now,
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId: input.mobileCommandId,
    category: 'SESSION',
    summary: `Tracked session ${tracked.sessionId} created`,
    scopeUsed: tracked.sessionId,
  });

  return tracked;
}

export function getMobileCommandTrackedSession(sessionId: string): MobileCommandTrackedSession | null {
  return getStoredMobileCommandTrackedSession(sessionId);
}

export function listMobileCommandTrackedSessions(mobileCommandId?: string): MobileCommandTrackedSession[] {
  const all = listStoredMobileCommandTrackedSessions();
  if (!mobileCommandId) return all;
  return all.filter((s) => s.mobileCommandId === mobileCommandId);
}

export function trackSessionOwnership(sessionId: string, owner: string): MobileCommandTrackedSession | null {
  const session = getStoredMobileCommandTrackedSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeMobileCommandTrackedSession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): MobileCommandTrackedSession | null {
  const session = getStoredMobileCommandTrackedSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeMobileCommandTrackedSession(updated);
  return updated;
}

export function resetMobileCommandSessionManagerForTests(): void {
  // Cleared via store reset
}
