/**
 * Build Strategy Engine — autonomy level selection (strategy/planning only).
 */

import {
  nextBuildStrategyAutonomyId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyAutonomy,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyAutonomySelection, AutonomyLevel } from './build-strategy-types.js';
import { resolveDefaultAutonomyForCategory } from './build-strategy-types.js';

export function selectAutonomyLevel(input: {
  buildStrategyId: string;
  autonomyLevel?: AutonomyLevel;
  autonomyReason?: string;
}): BuildStrategyAutonomySelection | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const autonomyLevel = input.autonomyLevel ?? resolveDefaultAutonomyForCategory(record.strategyCategory);
  const autonomy: BuildStrategyAutonomySelection = {
    autonomyId: nextBuildStrategyAutonomyId(),
    buildStrategyId: input.buildStrategyId,
    autonomyLevel,
    autonomyReason: input.autonomyReason ?? `Selected ${autonomyLevel} — strategy metadata only`,
    selectedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyAutonomy(autonomy);
  storeBuildStrategyRecord({ ...record, strategyAutonomy: autonomy, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'AUTONOMY',
    summary: `Autonomy ${autonomy.autonomyId}: ${autonomyLevel}`,
    scopeUsed: autonomy.autonomyId,
  });

  recordBuildStrategyLifecycleEvent(input.buildStrategyId, 'STRATEGY_AUTONOMY_SELECTED', autonomy.autonomyReason);

  return autonomy;
}

export function getBuildStrategyAutonomy(buildStrategyId: string): BuildStrategyAutonomySelection | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyAutonomy ?? null;
}
