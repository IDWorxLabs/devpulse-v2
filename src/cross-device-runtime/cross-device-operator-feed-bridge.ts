/**
 * Cross Device Runtime Foundation — Operator Feed bridge.
 */

import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceOperatorFeedLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

const OPERATOR_FEED_AUTHORITY = 'devpulse_v2_operator_feed_foundation';

export function linkCrossDeviceToOperatorFeed(
  crossDeviceId: string,
  feedAuthorityId?: string,
): CrossDeviceOperatorFeedLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return null;

  const diag = getOperatorFeedDiagnostics();
  const authorityId = feedAuthorityId ?? OPERATOR_FEED_AUTHORITY;
  const link: CrossDeviceOperatorFeedLink = {
    feedAuthorityId: authorityId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !diag.operatorFeedActive && diag.eventCount === 0,
  };

  storeCrossDeviceSession({ ...session, crossDeviceOperatorFeedLink: link, updatedAt: Date.now() });
  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${authorityId}`,
    scopeUsed: authorityId,
  });
  return link;
}

export function getOperatorFeedForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceOperatorFeedLink.feedAuthorityId ?? null;
}

export function listCrossDevicesByOperatorFeed(feedAuthorityId: string) {
  return listStoredCrossDeviceSessions().filter(
    (s) => s.crossDeviceOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectCrossDeviceOperatorFeedMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  return session.crossDeviceOperatorFeedLink.mismatchDetected;
}
