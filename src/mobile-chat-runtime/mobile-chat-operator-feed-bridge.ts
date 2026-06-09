/**
 * Mobile Chat Runtime Foundation — Operator Feed bridge.
 */

import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatOperatorFeedLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

const OPERATOR_FEED_AUTHORITY = 'devpulse_v2_operator_feed_foundation';

export function linkMobileChatToOperatorFeed(mobileChatId: string, feedAuthorityId?: string): MobileChatOperatorFeedLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return null;

  const diag = getOperatorFeedDiagnostics();
  const authorityId = feedAuthorityId ?? OPERATOR_FEED_AUTHORITY;
  const link: MobileChatOperatorFeedLink = {
    feedAuthorityId: authorityId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !diag.operatorFeedActive && diag.eventCount === 0,
  };

  storeMobileChatSession({ ...session, mobileChatOperatorFeedLink: link, updatedAt: Date.now() });
  recordMobileChatHistoryEntry({ mobileChatId, category: 'OPERATOR_FEED', summary: `Linked to operator feed ${authorityId}`, scopeUsed: authorityId });
  return link;
}

export function getOperatorFeedForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatOperatorFeedLink.feedAuthorityId ?? null;
}

export function listMobileChatsByOperatorFeed(feedAuthorityId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter((s) => s.mobileChatOperatorFeedLink.feedAuthorityId === feedAuthorityId);
}

export function detectMobileChatOperatorFeedMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  return session.mobileChatOperatorFeedLink.mismatchDetected;
}
