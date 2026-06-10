/**
 * Autonomous Fixing — bounded fix history.
 */

import type {
  FailureCategory,
  FixHistoryEntry,
  FixPlan,
  FixStrategy,
} from './autonomous-fixing-types.js';
import { MAX_FIX_HISTORY_SIZE } from './autonomous-fixing-types.js';

const history: FixHistoryEntry[] = [];
let historyCounter = 0;

export function recordFixHistory(plan: FixPlan): FixHistoryEntry {
  historyCounter += 1;

  const entry: FixHistoryEntry = {
    historyId: `fix-history-${historyCounter}`,
    planId: plan.id,
    failureCategory: plan.failureCategory,
    strategy: plan.strategy,
    readiness: plan.readiness,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > MAX_FIX_HISTORY_SIZE) {
    history.length = MAX_FIX_HISTORY_SIZE;
  }

  return entry;
}

export function getLatestFixPlans(limit = 10): FixHistoryEntry[] {
  return history.slice(0, limit);
}

export function getLatestFailures(limit = 10): FixHistoryEntry[] {
  return history.slice(0, limit);
}

export function lookupFixHistoryByStrategy(strategy: FixStrategy): FixHistoryEntry[] {
  return history.filter((e) => e.strategy === strategy);
}

export function lookupFixHistoryByCategory(category: FailureCategory): FixHistoryEntry[] {
  return history.filter((e) => e.failureCategory === category);
}

export function getFixHistorySize(): number {
  return history.length;
}

export function resetFixHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
