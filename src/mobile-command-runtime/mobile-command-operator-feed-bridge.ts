/**
 * Mobile Command Runtime Foundation — Operator Feed bridge.
 */

import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandOperatorFeedLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

const OPERATOR_FEED_AUTHORITY = 'devpulse_v2_operator_feed_foundation';

export function linkMobileCommandToOperatorFeed(mobileCommandId: string, feedAuthorityId?: string): MobileCommandOperatorFeedLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return null;

  const diag = getOperatorFeedDiagnostics();
  const authorityId = feedAuthorityId ?? OPERATOR_FEED_AUTHORITY;
  const link: MobileCommandOperatorFeedLink = {
    feedAuthorityId: authorityId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !diag.operatorFeedActive && diag.eventCount === 0,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandOperatorFeedLink: link,
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${authorityId}`,
    scopeUsed: authorityId,
  });

  return link;
}

export function getOperatorFeedForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandOperatorFeedLink.feedAuthorityId ?? null;
}

export function listMobileCommandsByOperatorFeed(feedAuthorityId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) => s.mobileCommandOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectMobileCommandOperatorFeedMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  return session.mobileCommandOperatorFeedLink.mismatchDetected;
}
