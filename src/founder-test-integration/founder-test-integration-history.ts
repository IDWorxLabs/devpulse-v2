/**
 * Founder Test Integration — bounded run history.
 */

import { MAX_FOUNDER_TEST_HISTORY } from './founder-test-integration-registry.js';
import type { FounderTestAssessment, FounderTestHistorySummary, FounderTestVerdict } from './founder-test-integration-types.js';

const history: FounderTestAssessment[] = [];

export function resetFounderTestIntegrationHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderTestAssessment(assessment: FounderTestAssessment): void {
  history.push(assessment);
  while (history.length > MAX_FOUNDER_TEST_HISTORY) {
    history.shift();
  }
}

export function getFounderTestHistorySize(): number {
  return history.length;
}

export function getLatestFounderTestAssessment(): FounderTestAssessment | null {
  return history.at(-1) ?? null;
}

export function getFounderTestHistory(): readonly FounderTestAssessment[] {
  return history;
}

export function buildFounderTestHistorySummary(
  assessments: readonly FounderTestAssessment[] = history,
): FounderTestHistorySummary {
  const summary: FounderTestHistorySummary = {
    totalRuns: assessments.length,
    readyRuns: 0,
    warningRuns: 0,
    blockedRuns: 0,
    insufficientEvidenceRuns: 0,
    notReadyRuns: 0,
  };

  for (const item of assessments) {
    switch (item.verdict) {
      case 'FOUNDER_READY':
        summary.readyRuns += 1;
        break;
      case 'FOUNDER_READY_WITH_WARNINGS':
        summary.warningRuns += 1;
        break;
      case 'BLOCKED':
        summary.blockedRuns += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceRuns += 1;
        break;
      case 'NOT_FOUNDER_READY':
        summary.notReadyRuns += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countFounderTestVerdict(
  verdict: FounderTestVerdict,
  assessments: readonly FounderTestAssessment[] = history,
): number {
  return assessments.filter((item) => item.verdict === verdict).length;
}
