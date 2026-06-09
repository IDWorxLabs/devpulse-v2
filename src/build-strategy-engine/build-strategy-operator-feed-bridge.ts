/**
 * Build Strategy Engine — operator feed bridge.
 */

import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyOperatorFeedLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToOperatorFeed(
  buildStrategyId: string,
): BuildStrategyOperatorFeedLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  const link: BuildStrategyOperatorFeedLink = {
    feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: false,
  };

  storeBuildStrategyRecord({
    ...record,
    strategyOperatorFeedLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${link.feedAuthorityId}`,
    scopeUsed: link.feedAuthorityId,
  });

  return link;
}

export function getOperatorFeedForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyOperatorFeedLink.feedAuthorityId ?? null;
}

export function listBuildStrategiesByOperatorFeed(feedAuthorityId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter(
    (r) => r.strategyOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectBuildStrategyOperatorFeedMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  return record.strategyOperatorFeedLink.mismatchDetected;
}
