/**
 * Build Strategy Engine — build mode selection (strategy/planning only).
 */

import {
  nextBuildStrategyModeId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyMode,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyModeSelection, BuildMode } from './build-strategy-types.js';
import { resolveDefaultBuildModeForCategory } from './build-strategy-types.js';

export function selectBuildMode(input: {
  buildStrategyId: string;
  buildMode?: BuildMode;
  modeReason?: string;
}): BuildStrategyModeSelection | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const buildMode = input.buildMode ?? resolveDefaultBuildModeForCategory(record.strategyCategory);
  const mode: BuildStrategyModeSelection = {
    modeId: nextBuildStrategyModeId(),
    buildStrategyId: input.buildStrategyId,
    buildMode,
    modeReason: input.modeReason ?? `Selected ${buildMode} — strategy/planning only, no execution`,
    selectedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyMode(mode);
  storeBuildStrategyRecord({ ...record, strategyMode: mode, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'MODE',
    summary: `Mode ${mode.modeId}: ${buildMode}`,
    scopeUsed: mode.modeId,
  });

  recordBuildStrategyLifecycleEvent(input.buildStrategyId, 'STRATEGY_MODE_SELECTED', mode.modeReason);

  return mode;
}

export function getBuildStrategyMode(buildStrategyId: string): BuildStrategyModeSelection | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyMode ?? null;
}
