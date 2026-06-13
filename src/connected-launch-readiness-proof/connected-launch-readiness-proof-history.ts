/**
 * Connected Launch Readiness Proof — bounded history.
 */

import { MAX_LAUNCH_READINESS_PROOF_HISTORY } from './connected-launch-readiness-proof-registry.js';
import type {
  LaunchReadinessProofAssessment,
  LaunchReadinessProofHistoryEntry,
  LaunchReadinessProofHistorySummary,
} from './connected-launch-readiness-proof-types.js';

const history: LaunchReadinessProofHistoryEntry[] = [];

export function resetLaunchReadinessProofHistoryForTests(): void {
  history.length = 0;
}

export function recordLaunchReadinessProofAssessment(
  assessment: LaunchReadinessProofAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    launchProofLevel: report.launchProofLevel,
    launchState: report.launchState,
    launchLinkageConnected: report.linkage.launchLinkageConnected,
  });
  if (history.length > MAX_LAUNCH_READINESS_PROOF_HISTORY) {
    history.length = MAX_LAUNCH_READINESS_PROOF_HISTORY;
  }
}

export function getLaunchReadinessProofHistorySize(): number {
  return history.length;
}

export function buildLaunchReadinessProofHistorySummary(
  entries: readonly LaunchReadinessProofHistoryEntry[] = history,
): LaunchReadinessProofHistorySummary {
  return {
    totalAssessments: entries.length,
    provenLaunches: entries.filter((e) => e.launchProofLevel === 'PROVEN').length,
    partialLaunches: entries.filter((e) => e.launchProofLevel === 'PARTIAL').length,
    notProvenLaunches: entries.filter((e) => e.launchProofLevel === 'NOT_PROVEN').length,
  };
}
