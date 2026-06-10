/**
 * Capability Build Engine — bounded history.
 */

import type {
  CapabilityBuildPlan,
  CapabilityBuildHistoryEntry,
  CapabilityBuildValidationPlan,
  CapabilityRollbackPlan,
  CapabilityRolloutPlan,
} from './capability-build-types.js';
import { DEFAULT_MAX_BUILD_HISTORY_SIZE } from './capability-build-types.js';

const history: CapabilityBuildHistoryEntry[] = [];
let historyCounter = 0;

export function recordCapabilityBuildHistory(
  plan: CapabilityBuildPlan,
  _context: {
    rollout: CapabilityRolloutPlan;
    rollback: CapabilityRollbackPlan;
    validation: CapabilityBuildValidationPlan;
  },
): void {
  historyCounter += 1;
  const entry: CapabilityBuildHistoryEntry = {
    historyId: `build-history-${historyCounter}`,
    buildPlanId: plan.buildPlanId,
    buildType: plan.buildType,
    executionStrategy: plan.executionStrategy,
    recordedAt: Date.now(),
  };
  history.push(entry);
  while (history.length > DEFAULT_MAX_BUILD_HISTORY_SIZE) {
    history.shift();
  }
}

export function getCapabilityBuildHistory(): CapabilityBuildHistoryEntry[] {
  return [...history];
}

export function getCapabilityBuildHistorySize(): number {
  return history.length;
}

export function resetCapabilityBuildHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
