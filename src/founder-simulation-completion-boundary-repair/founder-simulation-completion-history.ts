/**
 * Phase 26.96 — Founder Simulation Completion history (V1).
 */

import type { FounderSimulationCompletionBoundaryReport } from './founder-simulation-completion-boundary-repair-types.js';

const MAX_HISTORY = 32;

export interface FounderSimulationCompletionHistoryEntry {
  readOnly: true;
  repairId: string;
  generatedAt: string;
  completionEventId: string | null;
  degraded: boolean;
  elapsedMs: number;
  passToken: string | null;
}

const history: FounderSimulationCompletionHistoryEntry[] = [];

export function resetFounderSimulationCompletionHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderSimulationCompletionReport(
  report: FounderSimulationCompletionBoundaryReport,
): void {
  history.unshift({
    readOnly: true,
    repairId: report.repairId,
    generatedAt: report.generatedAt,
    completionEventId: report.trace.completionEventId,
    degraded: report.degraded,
    elapsedMs: report.elapsedMs,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getFounderSimulationCompletionHistorySize(): number {
  return history.length;
}

export function getFounderSimulationCompletionHistory(): readonly FounderSimulationCompletionHistoryEntry[] {
  return history;
}
