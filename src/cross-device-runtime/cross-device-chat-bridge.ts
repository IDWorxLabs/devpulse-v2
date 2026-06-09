/**
 * Cross Device Runtime Foundation — Mobile Chat Runtime bridge.
 */

import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDeviceChatLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToChatSession(
  crossDeviceId: string,
  mobileChatId: string,
): CrossDeviceChatLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  const chat = getMobileChatSession(mobileChatId);
  if (!session || !chat) return null;

  const mismatch = chat.mobileChatOwner.projectId !== session.crossDeviceOwner.projectId;
  const link: CrossDeviceChatLink = {
    mobileChatId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDeviceChatLink: link,
    crossDeviceOwner: { ...session.crossDeviceOwner, mobileChatSessionId: mobileChatId },
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'CHAT',
    summary: `Linked to mobile chat ${mobileChatId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileChatId,
  });

  return link;
}

export function getChatSessionForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceChatLink.mobileChatId ?? null;
}

export function listCrossDevicesByChatSession(mobileChatId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) =>
      s.crossDeviceChatLink.mobileChatId === mobileChatId ||
      s.crossDeviceOwner.mobileChatSessionId === mobileChatId,
  );
}

export function detectCrossDeviceChatMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  const chat = getMobileChatSession(session.crossDeviceChatLink.mobileChatId);
  if (!chat) return true;
  return (
    chat.mobileChatOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceChatLink.mismatchDetected
  );
}

export function resolveChatForCrossDeviceRegistration(
  mobileChatId: string,
): { exists: boolean; projectId: string | null } {
  const chat = getMobileChatSession(mobileChatId);
  if (!chat) return { exists: false, projectId: null };
  return { exists: true, projectId: chat.mobileChatOwner.projectId };
}
