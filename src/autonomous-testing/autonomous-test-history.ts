/**
 * Autonomous Testing — bounded history.
 */

import type { AutonomousTestHistoryEntry, AutonomousTestPlan, AutonomousTestResult } from './autonomous-testing-types.js';
import { MAX_AUTONOMOUS_TEST_HISTORY_SIZE as MAX_HISTORY } from './autonomous-testing-types.js';

const history: AutonomousTestHistoryEntry[] = [];
let latestPlan: AutonomousTestPlan | null = null;
let latestResult: AutonomousTestResult | null = null;

export function recordAutonomousTestHistory(
  plan: AutonomousTestPlan,
  result?: AutonomousTestResult,
): AutonomousTestHistoryEntry {
  latestPlan = plan;
  if (result) latestResult = result;

  const entry: AutonomousTestHistoryEntry = {
    historyId: `athist-${plan.id}-${Date.now()}`,
    planId: plan.id,
    depth: plan.depth,
    readiness: plan.readiness,
    resultStatus: result?.status ?? 'NOT_EXECUTED',
    recordedAt: Date.now(),
  };

  history.push(entry);
  while (history.length > MAX_HISTORY) {
    history.shift();
  }

  return entry;
}

export function getLatestAutonomousTestPlan(): AutonomousTestPlan | null {
  return latestPlan;
}

export function getLatestAutonomousTestResult(): AutonomousTestResult | null {
  return latestResult;
}

export function getAutonomousTestHistoryById(planId: string): AutonomousTestHistoryEntry[] {
  return history.filter((h) => h.planId === planId);
}

export function getAutonomousTestHistoryByDepth(depth: string): AutonomousTestHistoryEntry[] {
  return history.filter((h) => h.depth === depth);
}

export function getAutonomousTestHistoryByReadiness(readiness: string): AutonomousTestHistoryEntry[] {
  return history.filter((h) => h.readiness === readiness);
}

export function getAutonomousTestHistorySize(): number {
  return history.length;
}

export function resetAutonomousTestHistoryForTests(): void {
  history.length = 0;
  latestPlan = null;
  latestResult = null;
}
