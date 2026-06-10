/**
 * Capability Planning Engine — bounded history.
 */

import type { CapabilityPlan, CapabilityPlanHistoryEntry } from './capability-planning-types.js';
import { DEFAULT_MAX_PLANNING_HISTORY_SIZE } from './capability-planning-types.js';

const history: CapabilityPlanHistoryEntry[] = [];
let historyCounter = 0;

export function recordCapabilityPlanHistory(plan: CapabilityPlan): void {
  historyCounter += 1;
  const entry: CapabilityPlanHistoryEntry = {
    historyId: `plan-history-${historyCounter}`,
    planId: plan.planId,
    planType: plan.planType,
    approvalRequirement: plan.approvalRequirement,
    recordedAt: Date.now(),
  };
  history.push(entry);
  while (history.length > DEFAULT_MAX_PLANNING_HISTORY_SIZE) {
    history.shift();
  }
}

export function getCapabilityPlanHistory(): CapabilityPlanHistoryEntry[] {
  return [...history];
}

export function getCapabilityPlanHistorySize(): number {
  return history.length;
}

export function resetCapabilityPlanningHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
