/**
 * Mobile Chat Runtime Foundation — Persistent Build bridge.
 */

import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatBuildLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function linkMobileChatToBuild(mobileChatId: string, persistentBuildId: string): MobileChatBuildLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  const build = getPersistentBuild(persistentBuildId);
  if (!session || !build) return null;

  const mismatch = build.buildOwner.projectId !== session.mobileChatOwner.projectId;
  const link: MobileChatBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileChatSession({ ...session, mobileChatBuildLink: link, mobileChatOwner: { ...session.mobileChatOwner, persistentBuildId }, updatedAt: Date.now() });
  recordMobileChatHistoryEntry({ mobileChatId, category: 'PERSISTENT_BUILD', summary: `Linked to build ${persistentBuildId}`, scopeUsed: persistentBuildId });
  return link;
}

export function getBuildForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatBuildLink.persistentBuildId ?? null;
}

export function listMobileChatsByPersistentBuild(persistentBuildId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter(
    (s) => s.mobileChatBuildLink.persistentBuildId === persistentBuildId || s.mobileChatOwner.persistentBuildId === persistentBuildId,
  );
}

export function detectMobileChatBuildMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  const build = getPersistentBuild(session.mobileChatBuildLink.persistentBuildId);
  if (!build) return true;
  return build.buildOwner.projectId !== session.mobileChatOwner.projectId || session.mobileChatBuildLink.mismatchDetected;
}

export function resolveBuildForMobileChatRegistration(persistentBuildId: string): { exists: boolean; projectId: string | null } {
  const build = getPersistentBuild(persistentBuildId);
  if (!build) return { exists: false, projectId: null };
  return { exists: true, projectId: build.buildOwner.projectId };
}
