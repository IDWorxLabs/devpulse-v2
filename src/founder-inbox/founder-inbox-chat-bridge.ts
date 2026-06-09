/**
 * Founder Inbox Foundation — Mobile Chat bridge.
 */

import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxChatLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToChat(inboxEntryId: string, chatSessionId: string): InboxChatLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  const chat = getMobileChatSession(chatSessionId);
  if (!entry || !chat) return null;

  const mismatch = chat.mobileChatOwner.projectId !== entry.inboxOwnership.projectId;
  const link: InboxChatLink = {
    chatSessionId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    inboxChatLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'CHAT',
    summary: `Linked to chat ${chatSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: chatSessionId,
  });

  return link;
}

export function getChatForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxChatLink.chatSessionId ?? null;
}

export function listInboxEntriesByChat(chatSessionId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxChatLink.chatSessionId === chatSessionId);
}

export function detectInboxChatMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  const chat = getMobileChatSession(entry.inboxChatLink.chatSessionId);
  if (!chat) return true;
  return (
    chat.mobileChatOwner.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxChatLink.mismatchDetected
  );
}
