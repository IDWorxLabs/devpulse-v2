/**
 * Phase 26.5 — Bounded product readiness history.
 */

import type {
  ProductReadinessAssessment,
  ProductReadinessHistoryEntry,
} from './product-readiness-types.js';

const MAX_HISTORY = 16;
const history: ProductReadinessHistoryEntry[] = [];

export function resetProductReadinessHistoryForTests(): void {
  history.length = 0;
}

export function recordProductReadinessAssessment(assessment: ProductReadinessAssessment): void {
  history.push({
    timestamp: assessment.report.generatedAt,
    runId: assessment.report.runId,
    readinessScore: assessment.report.readinessScore,
    verdict: assessment.report.verdict,
    launchBlocked: assessment.report.launchBlocked,
    blockerCount: assessment.report.automaticBlockers.length,
  });
  while (history.length > MAX_HISTORY) history.shift();
}

export function getProductReadinessHistory(): readonly ProductReadinessHistoryEntry[] {
  return history;
}

export function getProductReadinessHistorySize(): number {
  return history.length;
}

export function getLatestProductReadinessHistoryEntry(): ProductReadinessHistoryEntry | null {
  return history.length ? history[history.length - 1]! : null;
}
