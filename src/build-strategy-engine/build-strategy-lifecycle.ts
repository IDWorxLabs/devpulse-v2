/**
 * Build Strategy Engine — lifecycle events.
 */

import {
  nextBuildStrategyLifecycleEventId,
  storeBuildStrategyLifecycleEvent,
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyLifecycleEvents,
} from './build-strategy-store.js';
import { setBuildStrategyState } from './build-strategy-state-manager.js';
import type {
  BuildStrategyLifecycleEvent,
  BuildStrategyLifecycleEventType,
  BuildStrategyState,
} from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

const STATE_MAP: Partial<Record<BuildStrategyLifecycleEventType, BuildStrategyState>> = {
  STRATEGY_CREATED: 'CREATED',
  STRATEGY_CLASSIFIED: 'CLASSIFIED',
  STRATEGY_MODE_SELECTED: 'MODE_SELECTED',
  STRATEGY_AUTONOMY_SELECTED: 'AUTONOMY_SELECTED',
  STRATEGY_RISK_EVALUATED: 'RISK_EVALUATED',
  STRATEGY_CONFIDENCE_EVALUATED: 'CONFIDENCE_EVALUATED',
  STRATEGY_DEPTH_SELECTED: 'DEPTH_SELECTED',
  STRATEGY_STAGES_RECOMMENDED: 'STAGES_RECOMMENDED',
  STRATEGY_READINESS_EVALUATED: 'STAGES_RECOMMENDED',
  STRATEGY_POLICY_APPLIED: 'READY',
  STRATEGY_READY: 'READY',
  STRATEGY_BLOCKED: 'BLOCKED',
  STRATEGY_COMPLETED: 'COMPLETED',
  STRATEGY_FAILED: 'FAILED',
  STRATEGY_ARCHIVED: 'ARCHIVED',
};

export function recordBuildStrategyLifecycleEvent(
  buildStrategyId: string,
  eventType: BuildStrategyLifecycleEventType,
  notes = '',
): void {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return;

  const targetState = STATE_MAP[eventType];
  const newState = targetState ?? record.strategyState;

  storeBuildStrategyLifecycleEvent({
    eventId: nextBuildStrategyLifecycleEventId(),
    buildStrategyId,
    eventType,
    previousState: record.strategyState,
    newState,
    timestamp: Date.now(),
    sourceModule: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    notes,
  });

  if (targetState && record.strategyState !== targetState) {
    setBuildStrategyState(buildStrategyId, targetState, eventType === 'STRATEGY_CREATED');
  }
}

export function listBuildStrategyLifecycleEvents(buildStrategyId: string): BuildStrategyLifecycleEvent[] {
  return listStoredBuildStrategyLifecycleEvents().filter((e) => e.buildStrategyId === buildStrategyId);
}
