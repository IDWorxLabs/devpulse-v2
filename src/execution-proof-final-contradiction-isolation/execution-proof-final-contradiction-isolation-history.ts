/**
 * Phase 27.06 — Execution Proof Final Contradiction Isolation history (V1).
 */

import type { ExecutionProofFinalContradictionIsolationReport } from './execution-proof-final-contradiction-isolation-types.js';

const history: ExecutionProofFinalContradictionIsolationReport[] = [];

export function recordExecutionProofFinalContradictionIsolationReport(
  report: ExecutionProofFinalContradictionIsolationReport,
): void {
  history.unshift(report);
  if (history.length > 16) history.length = 16;
}

export function getExecutionProofFinalContradictionIsolationHistory(): readonly ExecutionProofFinalContradictionIsolationReport[] {
  return history;
}

export function resetExecutionProofFinalContradictionIsolationHistoryForTests(): void {
  history.length = 0;
}
