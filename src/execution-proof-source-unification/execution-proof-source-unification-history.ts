/**
 * Phase 26.94 — Execution Proof Source Unification history (V1).
 */

import type { ExecutionProofSourceUnificationReport } from './execution-proof-source-unification-types.js';

const MAX_HISTORY = 32;

export interface ExecutionProofSourceUnificationHistoryEntry {
  readOnly: true;
  unificationId: string;
  generatedAt: string;
  unifiedWorkspaceId: string | null;
  unifiedRunId: string | null;
  staleFindingCount: number;
  passToken: string | null;
}

const history: ExecutionProofSourceUnificationHistoryEntry[] = [];

export function resetExecutionProofSourceUnificationHistoryForTests(): void {
  history.length = 0;
}

export function recordExecutionProofSourceUnificationReport(
  report: ExecutionProofSourceUnificationReport,
): void {
  history.unshift({
    readOnly: true,
    unificationId: report.unificationId,
    generatedAt: report.generatedAt,
    unifiedWorkspaceId: report.reconciliation.unifiedWorkspaceId,
    unifiedRunId: report.reconciliation.unifiedRunId,
    staleFindingCount: report.staleFindings.length,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getExecutionProofSourceUnificationHistorySize(): number {
  return history.length;
}

export function getExecutionProofSourceUnificationHistory(): readonly ExecutionProofSourceUnificationHistoryEntry[] {
  return history;
}
