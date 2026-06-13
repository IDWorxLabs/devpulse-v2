/**
 * Founder Execution Proof — bounded history (max 16).
 */

import { MAX_FOUNDER_EXECUTION_PROOF_HISTORY } from './founder-execution-proof-registry.js';
import type {
  FounderExecutionProofAssessment,
  FounderExecutionProofHistoryEntry,
  FounderExecutionProofHistorySummary,
  FounderExecutionState,
  LaunchRecommendationState,
} from './founder-execution-proof-types.js';

const history: FounderExecutionProofHistoryEntry[] = [];

export function resetFounderExecutionProofHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderExecutionProofAssessment(
  assessment: FounderExecutionProofAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    proofId: report.proofId,
    founderExecutionScore: report.founderExecutionScore,
    founderExecutionState: report.founderExecutionState,
    launchRecommendation: report.launchRecommendation,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_FOUNDER_EXECUTION_PROOF_HISTORY) {
    history.length = MAX_FOUNDER_EXECUTION_PROOF_HISTORY;
  }
}

export function getFounderExecutionProofHistorySize(): number {
  return history.length;
}

export function getLatestFounderExecutionProofHistoryEntry(): FounderExecutionProofHistoryEntry | null {
  return history[0] ?? null;
}

export function getFounderExecutionProofHistory(): readonly FounderExecutionProofHistoryEntry[] {
  return [...history];
}

function countState<T extends string>(
  field: keyof FounderExecutionProofHistoryEntry,
  value: T,
  entries: readonly FounderExecutionProofHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry[field] === value).length;
}

export function buildFounderExecutionProofHistorySummary(
  entries: readonly FounderExecutionProofHistoryEntry[] = history,
): FounderExecutionProofHistorySummary {
  return {
    totalAssessments: entries.length,
    provenExecutions: countState('founderExecutionState', 'FOUNDER_EXECUTION_PROVEN' as FounderExecutionState, entries),
    provenWithWarningsExecutions: countState(
      'founderExecutionState',
      'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS' as FounderExecutionState,
      entries,
    ),
    notProvenExecutions: countState(
      'founderExecutionState',
      'FOUNDER_EXECUTION_NOT_PROVEN' as FounderExecutionState,
      entries,
    ),
    blockedExecutions: countState(
      'founderExecutionState',
      'FOUNDER_EXECUTION_BLOCKED' as FounderExecutionState,
      entries,
    ),
    insufficientEvidenceExecutions: countState(
      'founderExecutionState',
      'INSUFFICIENT_EVIDENCE' as FounderExecutionState,
      entries,
    ),
  };
}

export function countLaunchRecommendation(
  recommendation: LaunchRecommendationState,
  entries: readonly FounderExecutionProofHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.launchRecommendation === recommendation).length;
}
