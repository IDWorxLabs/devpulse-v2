/**
 * Parallel Build Orchestration — bounded history.
 */

import type { OrchestrationHistoryEntry, OrchestrationPlan } from './orchestration-types.js';
import { DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE } from './orchestration-types.js';

const history: OrchestrationHistoryEntry[] = [];
let historyCounter = 0;

export function recordOrchestrationHistory(
  plan: OrchestrationPlan,
  conflictCount: number,
): OrchestrationHistoryEntry {
  historyCounter += 1;

  const entry: OrchestrationHistoryEntry = {
    historyId: `orchestration-history-${historyCounter}`,
    planId: plan.planId,
    projectCount: plan.projects.length,
    conflictCount,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE) {
    history.length = DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE;
  }

  return entry;
}

export function getOrchestrationHistory(limit = 20): OrchestrationHistoryEntry[] {
  return history.slice(0, limit);
}

export function getOrchestrationHistorySize(): number {
  return history.length;
}

export function resetOrchestrationHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
