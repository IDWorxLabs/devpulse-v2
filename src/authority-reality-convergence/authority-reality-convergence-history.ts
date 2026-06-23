/**
 * Phase 27.00 — Authority Reality Convergence history (V1).
 */

import type { AuthorityRealityConvergenceReport } from './authority-reality-convergence-types.js';

const MAX_HISTORY = 32;

export interface AuthorityRealityConvergenceHistoryEntry {
  readOnly: true;
  convergenceId: string;
  generatedAt: string;
  convergedWorkspaceId: string | null;
  convergedRunId: string | null;
  divergenceCount: number;
  allLaunchCriticalAligned: boolean;
  passToken: string | null;
}

const history: AuthorityRealityConvergenceHistoryEntry[] = [];

export function resetAuthorityRealityConvergenceHistoryForTests(): void {
  history.length = 0;
}

export function recordAuthorityRealityConvergenceReport(
  report: AuthorityRealityConvergenceReport,
): void {
  history.unshift({
    readOnly: true,
    convergenceId: report.convergenceId,
    generatedAt: report.generatedAt,
    convergedWorkspaceId: report.reconciliation.convergedWorkspaceId,
    convergedRunId: report.reconciliation.convergedRunId,
    divergenceCount: report.divergences.length,
    allLaunchCriticalAligned: report.reconciliation.allLaunchCriticalAligned,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getAuthorityRealityConvergenceHistorySize(): number {
  return history.length;
}

export function getAuthorityRealityConvergenceHistory(): readonly AuthorityRealityConvergenceHistoryEntry[] {
  return history;
}
