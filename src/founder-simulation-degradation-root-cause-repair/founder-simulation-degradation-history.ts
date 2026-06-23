/**
 * Phase 27.02 — Founder Simulation Degradation history (V1).
 */

import type { FounderSimulationDegradationRootCauseReport } from './founder-simulation-degradation-root-cause-types.js';

const MAX_HISTORY = 32;

export interface FounderSimulationDegradationHistoryEntry {
  readOnly: true;
  investigationId: string;
  generatedAt: string;
  runId: string | null;
  degraded: boolean;
  totalRuntimeMs: number;
  slowestAuthority: string | null;
  passToken: string | null;
}

const history: FounderSimulationDegradationHistoryEntry[] = [];

export function resetFounderSimulationDegradationHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderSimulationDegradationReport(
  report: FounderSimulationDegradationRootCauseReport,
): void {
  history.unshift({
    readOnly: true,
    investigationId: report.investigationId,
    generatedAt: report.generatedAt,
    runId: report.runId,
    degraded: report.degraded,
    totalRuntimeMs: report.totalSimulationRuntimeMs,
    slowestAuthority: report.slowestAuthority?.authorityName ?? null,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getFounderSimulationDegradationHistorySize(): number {
  return history.length;
}

export function getFounderSimulationDegradationHistory(): readonly FounderSimulationDegradationHistoryEntry[] {
  return history;
}
