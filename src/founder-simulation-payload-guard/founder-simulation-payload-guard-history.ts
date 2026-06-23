/**
 * Phase 26.97 — Founder Simulation Payload Guard history (V1).
 */

import type { FounderSimulationPayloadGuardReport } from './founder-simulation-payload-guard-types.js';

const MAX_HISTORY = 32;

export interface FounderSimulationPayloadGuardHistoryEntry {
  readOnly: true;
  guardId: string;
  generatedAt: string;
  repairsApplied: number;
  degraded: boolean;
  passToken: string | null;
}

const history: FounderSimulationPayloadGuardHistoryEntry[] = [];

export function resetFounderSimulationPayloadGuardHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderSimulationPayloadGuardReport(report: FounderSimulationPayloadGuardReport): void {
  history.unshift({
    readOnly: true,
    guardId: report.guardId,
    generatedAt: report.generatedAt,
    repairsApplied: report.repairsApplied,
    degraded: report.degraded,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getFounderSimulationPayloadGuardHistorySize(): number {
  return history.length;
}

export function getFounderSimulationPayloadGuardHistory(): readonly FounderSimulationPayloadGuardHistoryEntry[] {
  return history;
}
