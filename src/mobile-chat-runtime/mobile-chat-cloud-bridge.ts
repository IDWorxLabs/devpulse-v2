/**
 * Mobile Chat Runtime Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatCloudLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function linkMobileChatToCloud(mobileChatId: string, runtimeId: string): MobileChatCloudLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  const runtime = getRuntime(runtimeId);
  if (!session || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== session.mobileChatOwner.projectId;
  const link: MobileChatCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileChatSession({
    ...session,
    mobileChatCloudLink: link,
    mobileChatOwner: { ...session.mobileChatOwner, runtimeId },
    updatedAt: Date.now(),
  });

  recordMobileChatHistoryEntry({
    mobileChatId,
    category: 'RUNTIME',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatCloudLink.runtimeId ?? null;
}

export function listMobileChatsByRuntime(runtimeId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter(
    (s) => s.mobileChatCloudLink.runtimeId === runtimeId || s.mobileChatOwner.runtimeId === runtimeId,
  );
}

export function detectMobileChatCloudMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  const runtime = getRuntime(session.mobileChatCloudLink.runtimeId);
  if (!runtime) return true;
  return runtime.runtimeOwner.projectId !== session.mobileChatOwner.projectId || session.mobileChatCloudLink.mismatchDetected;
}

export function resolveRuntimeForMobileChatRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}
