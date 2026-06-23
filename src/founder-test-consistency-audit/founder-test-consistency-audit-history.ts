/**
 * Phase 26.70 — Founder Test Consistency Audit history (V1).
 */

import type {
  FounderTestConsistencyAuditAssessment,
  FounderTestConsistencyAuditHistoryEntry,
} from './founder-test-consistency-audit-types.js';
import { MAX_CONSISTENCY_AUDIT_HISTORY } from './founder-test-consistency-audit-registry.js';

const history: FounderTestConsistencyAuditHistoryEntry[] = [];

export function resetFounderTestConsistencyAuditHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderTestConsistencyAuditAssessment(
  assessment: FounderTestConsistencyAuditAssessment,
): void {
  history.unshift({
    readOnly: true,
    auditId: assessment.report.auditId,
    generatedAt: assessment.report.generatedAt,
    contradictionCount: assessment.report.contradictionCount,
    overallConfidence: assessment.report.overallConfidence,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_CONSISTENCY_AUDIT_HISTORY) {
    history.length = MAX_CONSISTENCY_AUDIT_HISTORY;
  }
}

export function getFounderTestConsistencyAuditHistorySize(): number {
  return history.length;
}

export function getLatestFounderTestConsistencyAuditHistoryEntry(): FounderTestConsistencyAuditHistoryEntry | null {
  return history[0] ?? null;
}

export function getFounderTestConsistencyAuditHistory(): readonly FounderTestConsistencyAuditHistoryEntry[] {
  return history;
}
