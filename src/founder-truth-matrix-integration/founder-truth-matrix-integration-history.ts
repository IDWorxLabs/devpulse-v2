/**
 * Phase 26.71 — Founder Truth Matrix Integration history (V1).
 */

import { MAX_TRUTH_MATRIX_INTEGRATION_HISTORY } from './founder-truth-matrix-integration-registry.js';
import type {
  FounderTruthMatrixIntegrationAssessment,
  FounderTruthMatrixIntegrationHistoryEntry,
} from './founder-truth-matrix-integration-types.js';

const history: FounderTruthMatrixIntegrationHistoryEntry[] = [];

export function resetFounderTruthMatrixIntegrationHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderTruthMatrixIntegrationAssessment(
  assessment: FounderTruthMatrixIntegrationAssessment,
): void {
  history.unshift({
    readOnly: true,
    integrationId: assessment.report.integrationId,
    generatedAt: assessment.report.generatedAt,
    productLaunchBlocked: assessment.report.reconciliation.productLaunchBlocked,
    testingSystemDefectCount: assessment.report.reconciliation.testingSystemDefectCount,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_TRUTH_MATRIX_INTEGRATION_HISTORY) {
    history.length = MAX_TRUTH_MATRIX_INTEGRATION_HISTORY;
  }
}

export function getFounderTruthMatrixIntegrationHistorySize(): number {
  return history.length;
}

export function getLatestFounderTruthMatrixIntegrationHistoryEntry(): FounderTruthMatrixIntegrationHistoryEntry | null {
  return history[0] ?? null;
}

export function getFounderTruthMatrixIntegrationHistory(): readonly FounderTruthMatrixIntegrationHistoryEntry[] {
  return history;
}
