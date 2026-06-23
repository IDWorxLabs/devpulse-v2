/**
 * Evidence Propagation Reconciliation — history (Phase 26.88).
 */

import type { EvidencePropagationReconciliationAssessment } from './evidence-propagation-reconciliation-types.js';

const MAX_HISTORY = 16;
const history: EvidencePropagationReconciliationAssessment[] = [];

export function resetEvidencePropagationReconciliationHistoryForTests(): void {
  history.length = 0;
}

export function recordEvidencePropagationReconciliationAssessment(
  assessment: EvidencePropagationReconciliationAssessment,
): void {
  history.unshift(assessment);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
}

export function getEvidencePropagationReconciliationHistorySize(): number {
  return history.length;
}

export function peekLatestEvidencePropagationReconciliationAssessment(): EvidencePropagationReconciliationAssessment | null {
  return history[0] ?? null;
}
