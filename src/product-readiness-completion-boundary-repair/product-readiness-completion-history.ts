/**
 * Phase 26.90 — Product readiness completion boundary repair history (V1).
 */

import type { ProductReadinessCompletionBoundaryRepairReport } from './product-readiness-completion-boundary-repair-types.js';

const history: ProductReadinessCompletionBoundaryRepairReport[] = [];
const MAX_HISTORY = 32;

export function recordProductReadinessCompletionBoundaryRepair(
  report: ProductReadinessCompletionBoundaryRepairReport,
): void {
  history.unshift(report);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getProductReadinessCompletionBoundaryRepairHistory(): readonly ProductReadinessCompletionBoundaryRepairReport[] {
  return history;
}

export function getLatestProductReadinessCompletionBoundaryRepair():
  | ProductReadinessCompletionBoundaryRepairReport
  | null {
  return history[0] ?? null;
}

export function resetProductReadinessCompletionBoundaryRepairHistoryForTests(): void {
  history.length = 0;
}
