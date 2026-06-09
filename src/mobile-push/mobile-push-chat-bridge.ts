/**
 * Mobile Push Foundation — Mobile Chat bridge.
 */

import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushChatLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToChat(
  pushId: string,
  chatSessionId: string,
): PushChatLink | null {
  const record = getStoredPushRecord(pushId);
  const chat = getMobileChatSession(chatSessionId);
  if (!record || !chat) return null;

  const mismatch = chat.mobileChatOwner.projectId !== record.pushOwnership.projectId;
  const link: PushChatLink = {
    chatSessionId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    pushChatLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'CHAT',
    summary: `Linked to chat ${chatSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: chatSessionId,
  });

  return link;
}

export function getChatForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushChatLink.chatSessionId ?? null;
}

export function listPushRecordsByChat(chatSessionId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushChatLink.chatSessionId === chatSessionId);
}

export function detectPushChatMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const chat = getMobileChatSession(record.pushChatLink.chatSessionId);
  if (!chat) return true;
  return (
    chat.mobileChatOwner.projectId !== record.pushOwnership.projectId ||
    record.pushChatLink.mismatchDetected
  );
}
