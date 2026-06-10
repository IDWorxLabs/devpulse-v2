/**
 * Verification Integration — bounded verification history.
 */

import type { VerificationPlan } from '../verification-intelligence/verification-plan-types.js';
import type { VerificationHistoryEntry, VerificationReadinessModel } from './verification-integration-types.js';
import { MAX_VERIFICATION_HISTORY_SIZE as MAX_HISTORY } from './verification-integration-types.js';

const history: VerificationHistoryEntry[] = [];

export function recordVerificationHistory(
  plan: VerificationPlan,
  readiness: VerificationReadinessModel,
): VerificationHistoryEntry {
  const entry: VerificationHistoryEntry = {
    historyId: `vhist-${plan.id}-${Date.now()}`,
    planId: plan.id,
    strategy: plan.strategy,
    planType: plan.type,
    readinessState: readiness.state,
    visibilityState: readiness.state,
    recordedAt: Date.now(),
  };

  history.push(entry);
  while (history.length > MAX_HISTORY) {
    history.shift();
  }

  return entry;
}

export function getLatestVerificationHistory(): VerificationHistoryEntry | undefined {
  return history[history.length - 1];
}

export function getVerificationHistoryById(planId: string): VerificationHistoryEntry[] {
  return history.filter((h) => h.planId === planId);
}

export function getVerificationHistoryByPlanType(planType: string): VerificationHistoryEntry[] {
  return history.filter((h) => h.planType === planType);
}

export function getVerificationHistorySize(): number {
  return history.length;
}

export function listVerificationHistory(): VerificationHistoryEntry[] {
  return [...history];
}

export function resetVerificationHistoryForTests(): void {
  history.length = 0;
}
