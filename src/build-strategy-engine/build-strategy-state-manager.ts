/**
 * Build Strategy Engine — state manager.
 */

import {
  getStoredBuildStrategyRecord,
  appendBuildStrategyStateHistory,
  storeBuildStrategyRecord,
  getStoredBuildStrategyStateHistory,
} from './build-strategy-store.js';
import type { BuildStrategyState, BuildStrategyStateHistoryEntry } from './build-strategy-types.js';
import { isValidBuildStrategyStateTransition } from './build-strategy-types.js';

export function setBuildStrategyState(
  buildStrategyId: string,
  newState: BuildStrategyState,
  force = false,
): { ok: boolean; previousState: BuildStrategyState | null; error?: string } {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) {
    return { ok: false, previousState: null, error: `Strategy record not found: ${buildStrategyId}` };
  }

  const previousState = record.strategyState;
  if (!force && !isValidBuildStrategyStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeBuildStrategyRecord({
    ...record,
    strategyState: newState,
    strategyStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendBuildStrategyStateHistory({
    buildStrategyId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getBuildStrategyState(buildStrategyId: string): BuildStrategyState | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyState ?? null;
}

export function trackBuildStrategyStateHistory(buildStrategyId: string): BuildStrategyStateHistoryEntry[] {
  return getStoredBuildStrategyStateHistory(buildStrategyId);
}

function resolveStatusForState(
  state: BuildStrategyState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'READY' || state === 'COMPLETED') return 'HEALTHY';
  if (state === 'FAILED' || state === 'BLOCKED') return 'BLOCKED';
  if (
    state === 'CREATED' || state === 'CLASSIFIED' || state === 'MODE_SELECTED' ||
    state === 'AUTONOMY_SELECTED' || state === 'RISK_EVALUATED' || state === 'CONFIDENCE_EVALUATED' ||
    state === 'DEPTH_SELECTED' || state === 'STAGES_RECOMMENDED'
  ) {
    return 'WAITING';
  }
  if (state === 'ARCHIVED') return 'DEGRADED';
  return 'UNKNOWN';
}
