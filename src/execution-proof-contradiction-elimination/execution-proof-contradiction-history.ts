/**
 * Phase 27.01 — Execution Proof Contradiction history (V1).
 */

import type { ExecutionProofContradictionEliminationReport } from './execution-proof-contradiction-elimination-types.js';

const MAX_HISTORY = 32;

export interface ExecutionProofContradictionHistoryEntry {
  readOnly: true;
  eliminationId: string;
  generatedAt: string;
  contradictionCount: number;
  infrastructureDefectCount: number;
  passToken: string | null;
}

const history: ExecutionProofContradictionHistoryEntry[] = [];

export function resetExecutionProofContradictionHistoryForTests(): void {
  history.length = 0;
}

export function recordExecutionProofContradictionReport(
  report: ExecutionProofContradictionEliminationReport,
): void {
  history.unshift({
    readOnly: true,
    eliminationId: report.eliminationId,
    generatedAt: report.generatedAt,
    contradictionCount: report.contradictions.length,
    infrastructureDefectCount: report.elimination.infrastructureDefectCount,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getExecutionProofContradictionHistorySize(): number {
  return history.length;
}

export function getExecutionProofContradictionHistory(): readonly ExecutionProofContradictionHistoryEntry[] {
  return history;
}
