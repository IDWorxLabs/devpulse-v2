/**
 * Phase 26.99 — Founder simulation crash locator history.
 */

import type { FounderSimulationCrashLocatorReport } from './founder-simulation-crash-locator-types.js';

const history: FounderSimulationCrashLocatorReport[] = [];

export function recordFounderSimulationCrashLocatorReport(
  report: FounderSimulationCrashLocatorReport,
): void {
  history.push({ ...report });
}

export function getFounderSimulationCrashLocatorHistory(): readonly FounderSimulationCrashLocatorReport[] {
  return history;
}

export function getLatestFounderSimulationCrashLocatorReport():
  | FounderSimulationCrashLocatorReport
  | null {
  return history.length > 0 ? history[history.length - 1]! : null;
}

export function resetFounderSimulationCrashLocatorHistoryForTests(): void {
  history.length = 0;
}
