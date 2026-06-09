/**
 * Mobile Preview Runtime Foundation — Operator Feed bridge.
 */

import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getStoredMobilePreviewSession, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewOperatorFeedLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

const OPERATOR_FEED_AUTHORITY = 'devpulse_v2_operator_feed_foundation';

export function linkMobilePreviewToOperatorFeed(
  mobilePreviewId: string,
  feedAuthorityId?: string,
): MobilePreviewOperatorFeedLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;

  const diag = getOperatorFeedDiagnostics();
  const authorityId = feedAuthorityId ?? OPERATOR_FEED_AUTHORITY;
  const link: MobilePreviewOperatorFeedLink = {
    feedAuthorityId: authorityId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !diag.operatorFeedActive && diag.eventCount === 0,
  };

  storeMobilePreviewSession({ ...session, mobilePreviewOperatorFeedLink: link, updatedAt: Date.now() });
  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${authorityId}`,
    scopeUsed: authorityId,
  });
  return link;
}

export function getOperatorFeedForMobilePreview(mobilePreviewId: string): string | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewOperatorFeedLink.feedAuthorityId ?? null;
}

export function detectMobilePreviewOperatorFeedMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;
  return session.mobilePreviewOperatorFeedLink.mismatchDetected;
}
