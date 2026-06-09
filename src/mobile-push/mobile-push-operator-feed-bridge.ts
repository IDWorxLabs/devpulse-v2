/**
 * Mobile Push Foundation — operator feed bridge.
 */

import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushOperatorFeedLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToOperatorFeed(pushId: string): PushOperatorFeedLink | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const link: PushOperatorFeedLink = {
    feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  storePushRecord({
    ...record,
    pushOperatorFeedLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${link.feedAuthorityId}`,
    scopeUsed: link.feedAuthorityId,
  });

  return link;
}

export function getOperatorFeedForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushOperatorFeedLink.feedAuthorityId ?? null;
}

export function listPushRecordsByOperatorFeed(feedAuthorityId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter(
    (r) => r.pushOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectPushOperatorFeedMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  return record.pushOperatorFeedLink.mismatchDetected;
}
