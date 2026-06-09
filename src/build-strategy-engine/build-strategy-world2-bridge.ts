/**
 * Build Strategy Engine — World2 metadata bridge.
 */

import { readSystemSummariesForBuildStrategy } from './read-cache.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyWorld2Link } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

function listWorld2SystemSummaries(): ReturnType<typeof readSystemSummariesForBuildStrategy> {
  return readSystemSummariesForBuildStrategy().filter((s) => s.systemId.includes('world2'));
}

export function validateWorld2OperationId(world2OperationId: string): boolean {
  if (!world2OperationId) return false;
  return listWorld2SystemSummaries().some(
    (s) => s.systemId.includes(world2OperationId) || s.summary.includes(world2OperationId),
  );
}

export function linkBuildStrategyToWorld2(
  buildStrategyId: string,
  world2OperationId: string,
): BuildStrategyWorld2Link | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  const exists = validateWorld2OperationId(world2OperationId);
  const link: BuildStrategyWorld2Link = {
    world2OperationId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: !exists,
  };

  storeBuildStrategyRecord({
    ...record,
    strategyWorld2Link: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'WORLD2',
    summary: `Linked to world2 operation ${world2OperationId}${link.mismatchDetected ? ' — MISMATCH' : ''}`,
    scopeUsed: world2OperationId,
  });

  return link;
}

export function getWorld2ForBuildStrategy(buildStrategyId: string): string | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const operationId = record?.strategyWorld2Link.world2OperationId;
  return operationId && operationId.length > 0 ? operationId : null;
}

export function listBuildStrategiesByWorld2(world2OperationId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter(
    (r) => r.strategyWorld2Link.world2OperationId === world2OperationId,
  );
}

export function detectBuildStrategyWorld2Mismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const operationId = record.strategyWorld2Link.world2OperationId;
  if (!operationId) return true;
  return record.strategyWorld2Link.mismatchDetected || !validateWorld2OperationId(operationId);
}
