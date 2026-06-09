/**
 * Mobile Chat Runtime Foundation — session manager.
 */

import {
  nextMobileChatTrackedSessionId,
  storeMobileChatTrackedSession,
  getStoredMobileChatTrackedSession,
  listStoredMobileChatTrackedSessions,
  getStoredMobileChatSession,
  storeMobileChatSession,
} from './mobile-chat-store.js';
import { updateMobileChatSessionOwnership } from './mobile-chat-ownership.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatTrackedSession, MobileChatVisibility } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function createMobileChatSession(input: {
  mobileChatId: string;
  projectId: string;
  mobileCommandSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: MobileChatVisibility;
}): MobileChatTrackedSession | null {
  const chat = getStoredMobileChatSession(input.mobileChatId);
  if (!chat) return null;

  const now = Date.now();
  const tracked: MobileChatTrackedSession = {
    sessionId: nextMobileChatTrackedSessionId(),
    mobileChatId: input.mobileChatId,
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    monitoringId: input.monitoringId,
    sessionOwner: input.sessionOwner ?? MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    sessionState: chat.mobileChatState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'mobile_chat_runtime_foundation' },
    sessionVisibility: input.visibility ?? chat.mobileChatVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeMobileChatTrackedSession(tracked);

  storeMobileChatSession({
    ...chat,
    mobileChatOwner: updateMobileChatSessionOwnership(chat.mobileChatOwner, tracked.sessionId),
    updatedAt: now,
  });

  recordMobileChatHistoryEntry({
    mobileChatId: input.mobileChatId,
    category: 'SESSION',
    summary: `Tracked session ${tracked.sessionId} created`,
    scopeUsed: tracked.sessionId,
  });

  return tracked;
}

export function getMobileChatTrackedSession(sessionId: string): MobileChatTrackedSession | null {
  return getStoredMobileChatTrackedSession(sessionId);
}

export function listMobileChatTrackedSessions(mobileChatId?: string): MobileChatTrackedSession[] {
  const all = listStoredMobileChatTrackedSessions();
  if (!mobileChatId) return all;
  return all.filter((s) => s.mobileChatId === mobileChatId);
}

export function trackSessionOwnership(sessionId: string, owner: string): MobileChatTrackedSession | null {
  const session = getStoredMobileChatTrackedSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeMobileChatTrackedSession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): MobileChatTrackedSession | null {
  const session = getStoredMobileChatTrackedSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeMobileChatTrackedSession(updated);
  return updated;
}

export function resetMobileChatSessionManagerForTests(): void {
  // Cleared via store reset
}
