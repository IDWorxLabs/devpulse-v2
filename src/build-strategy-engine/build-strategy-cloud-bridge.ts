/**
 * Build Strategy Engine — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyCloudLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToCloud(
  buildStrategyId: string,
  runtimeId: string,
): BuildStrategyCloudLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const runtime = getRuntime(runtimeId);
  if (!record || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== record.strategyOwnership.projectId;
  const link: BuildStrategyCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeBuildStrategyRecord({
    ...record,
    strategyCloudLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'CLOUD',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyCloudLink.runtimeId ?? null;
}

export function listBuildStrategiesByCloud(runtimeId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter((r) => r.strategyCloudLink.runtimeId === runtimeId);
}

export function detectBuildStrategyCloudMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const runtime = getRuntime(record.strategyCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== record.strategyOwnership.projectId ||
    record.strategyCloudLink.mismatchDetected
  );
}
