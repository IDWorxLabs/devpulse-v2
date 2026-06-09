/**
 * Build Strategy Engine — build depth selection (strategy/planning only).
 */

import {
  nextBuildStrategyDepthId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyDepth,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyDepthSelection, BuildDepth } from './build-strategy-types.js';
import { resolveDefaultDepthForCategory } from './build-strategy-types.js';

export function selectBuildDepth(input: {
  buildStrategyId: string;
  buildDepth?: BuildDepth;
  depthReason?: string;
}): BuildStrategyDepthSelection | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const buildDepth = input.buildDepth ?? resolveDefaultDepthForCategory(record.strategyCategory);
  const depth: BuildStrategyDepthSelection = {
    depthId: nextBuildStrategyDepthId(),
    buildStrategyId: input.buildStrategyId,
    buildDepth,
    depthReason: input.depthReason ?? `Selected ${buildDepth} — strategy/planning depth metadata only`,
    selectedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyDepth(depth);
  storeBuildStrategyRecord({ ...record, strategyDepth: depth, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'DEPTH',
    summary: `Depth ${depth.depthId}: ${buildDepth}`,
    scopeUsed: depth.depthId,
  });

  recordBuildStrategyLifecycleEvent(input.buildStrategyId, 'STRATEGY_DEPTH_SELECTED', depth.depthReason);

  return depth;
}

export function getBuildStrategyDepth(buildStrategyId: string): BuildStrategyDepthSelection | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyDepth ?? null;
}
