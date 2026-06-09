/**
 * Autonomous Builder Foundation — operator feed bridge.
 */

import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildOperatorFeedLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function linkAutonomousBuildToOperatorFeed(
  autonomousBuildId: string,
): AutonomousBuildOperatorFeedLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  const link: AutonomousBuildOperatorFeedLink = {
    feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  storeAutonomousBuildRecord({
    ...record,
    buildOperatorFeedLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${link.feedAuthorityId}`,
    scopeUsed: link.feedAuthorityId,
  });

  return link;
}

export function getOperatorFeedForAutonomousBuild(autonomousBuildId: string): string | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildOperatorFeedLink.feedAuthorityId ?? null;
}

export function listAutonomousBuildsByOperatorFeed(feedAuthorityId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter(
    (r) => r.buildOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectAutonomousBuildOperatorFeedMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  return record.buildOperatorFeedLink.mismatchDetected;
}
