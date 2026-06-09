/**
 * Mobile Approval Runtime Foundation — Operator Feed bridge.
 */

import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalOperatorFeedLink } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

const OPERATOR_FEED_AUTHORITY = 'devpulse_v2_operator_feed_foundation';

export function linkMobileApprovalToOperatorFeed(
  mobileApprovalId: string,
  feedAuthorityId?: string,
): MobileApprovalOperatorFeedLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  const diag = getOperatorFeedDiagnostics();
  const authorityId = feedAuthorityId ?? OPERATOR_FEED_AUTHORITY;
  const link: MobileApprovalOperatorFeedLink = {
    feedAuthorityId: authorityId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !diag.operatorFeedActive && diag.eventCount === 0,
  };

  storeMobileApprovalSession({ ...session, mobileApprovalOperatorFeedLink: link, updatedAt: Date.now() });
  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${authorityId}`,
    scopeUsed: authorityId,
  });
  return link;
}

export function getOperatorFeedForMobileApproval(mobileApprovalId: string): string | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalOperatorFeedLink.feedAuthorityId ?? null;
}

export function listMobileApprovalsByOperatorFeed(feedAuthorityId: string) {
  return listStoredMobileApprovalSessions().filter(
    (s) => s.mobileApprovalOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectMobileApprovalOperatorFeedMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  return session.mobileApprovalOperatorFeedLink.mismatchDetected;
}
