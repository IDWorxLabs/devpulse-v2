/**
 * Founder Launch Decision Authority — bounded history.
 */

import { MAX_FOUNDER_LAUNCH_DECISION_HISTORY } from './founder-launch-decision-authority-registry.js';
import type {
  FounderLaunchDecisionAssessment,
  FounderLaunchDecisionHistoryEntry,
  FounderLaunchDecisionHistorySummary,
} from './founder-launch-decision-authority-types.js';

const history: FounderLaunchDecisionHistoryEntry[] = [];

export function resetFounderLaunchDecisionHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderLaunchDecisionAssessment(
  assessment: FounderLaunchDecisionAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    decisionId: report.decisionId,
    founderLaunchDecision: report.founderLaunchDecision,
    canLaunchNow: report.canLaunchNow,
    decisionConfidence: report.decisionConfidence,
  });
  if (history.length > MAX_FOUNDER_LAUNCH_DECISION_HISTORY) {
    history.length = MAX_FOUNDER_LAUNCH_DECISION_HISTORY;
  }
}

export function getFounderLaunchDecisionHistorySize(): number {
  return history.length;
}

export function buildFounderLaunchDecisionHistorySummary(
  entries: readonly FounderLaunchDecisionHistoryEntry[] = history,
): FounderLaunchDecisionHistorySummary {
  return {
    totalDecisions: entries.length,
    launchDecisions: entries.filter((e) => e.founderLaunchDecision === 'LAUNCH').length,
    rejectDecisions: entries.filter((e) => e.founderLaunchDecision === 'REJECT_LAUNCH').length,
    runMoreProofDecisions: entries.filter((e) => e.founderLaunchDecision === 'RUN_MORE_PROOF').length,
  };
}
