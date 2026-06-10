/**
 * Multi Project Verification Orchestration — bounded history.
 */

import type {
  VerificationOrchestrationHistoryEntry,
  VerificationOrchestrationPlan,
} from './verification-orchestration-types.js';
import { DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE } from './verification-orchestration-types.js';

const history: VerificationOrchestrationHistoryEntry[] = [];
let historyCounter = 0;

export function recordVerificationOrchestrationHistory(
  plan: VerificationOrchestrationPlan,
  conflictCount: number,
): VerificationOrchestrationHistoryEntry {
  historyCounter += 1;

  const projectCount = plan.groups.reduce((sum, g) => sum + g.projectIds.length, 0);

  const entry: VerificationOrchestrationHistoryEntry = {
    historyId: `verification-orchestration-history-${historyCounter}`,
    planId: plan.planId,
    projectCount,
    conflictCount,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE) {
    history.length = DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE;
  }

  return entry;
}

export function getVerificationOrchestrationHistory(limit = 20): VerificationOrchestrationHistoryEntry[] {
  return history.slice(0, limit);
}

export function getVerificationOrchestrationHistorySize(): number {
  return history.length;
}

export function resetVerificationOrchestrationHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
