/**
 * Founder Acceptance Gate — bounded assessment history.
 */

import { MAX_FOUNDER_ACCEPTANCE_HISTORY } from './founder-acceptance-gate-registry.js';
import type {
  FounderAcceptanceAssessment,
  FounderAcceptanceHistorySummary,
  FounderAcceptanceState,
} from './founder-acceptance-gate-types.js';

const history: FounderAcceptanceAssessment[] = [];

export function resetFounderAcceptanceGateHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderAcceptanceAssessment(assessment: FounderAcceptanceAssessment): void {
  history.push(assessment);
  while (history.length > MAX_FOUNDER_ACCEPTANCE_HISTORY) {
    history.shift();
  }
}

export function getFounderAcceptanceHistorySize(): number {
  return history.length;
}

export function getLatestFounderAcceptanceAssessment(): FounderAcceptanceAssessment | null {
  return history.at(-1) ?? null;
}

export function getFounderAcceptanceHistory(): readonly FounderAcceptanceAssessment[] {
  return history;
}

export function buildFounderAcceptanceHistorySummary(
  assessments: readonly FounderAcceptanceAssessment[] = history,
): FounderAcceptanceHistorySummary {
  const summary: FounderAcceptanceHistorySummary = {
    totalAssessments: assessments.length,
    acceptedCount: 0,
    acceptedWithWarningsCount: 0,
    rejectedCount: 0,
    blockedCount: 0,
    insufficientEvidenceCount: 0,
  };

  for (const item of assessments) {
    switch (item.acceptanceState) {
      case 'ACCEPTED':
        summary.acceptedCount += 1;
        break;
      case 'ACCEPTED_WITH_WARNINGS':
        summary.acceptedWithWarningsCount += 1;
        break;
      case 'NOT_ACCEPTED':
        summary.rejectedCount += 1;
        break;
      case 'BLOCKED':
        summary.blockedCount += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceCount += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countFounderAcceptanceState(
  state: FounderAcceptanceState,
  assessments: readonly FounderAcceptanceAssessment[] = history,
): number {
  return assessments.filter((item) => item.acceptanceState === state).length;
}
