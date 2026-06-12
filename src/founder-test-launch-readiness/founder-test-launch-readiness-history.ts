/**
 * Founder Test Launch Readiness — bounded history store (max 16 runs).
 */

import { MAX_FOUNDER_TEST_LAUNCH_READINESS_HISTORY } from './founder-test-launch-readiness-registry.js';
import type {
  FounderTestLaunchReadinessAssessment,
  FounderTestLaunchReadinessHistoryEntry,
  FounderTestLaunchReadinessHistorySummary,
  LaunchReadinessVerdict,
} from './founder-test-launch-readiness-types.js';

const history: FounderTestLaunchReadinessHistoryEntry[] = [];

export function resetFounderTestLaunchReadinessHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderTestLaunchReadinessAssessment(
  assessment: FounderTestLaunchReadinessAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    runId: report.runId,
    score: report.founderReadinessScore,
    verdict: report.launchReadinessVerdict,
    blockerCount: report.topBlockers.length,
    warningCount: report.topWarnings.length,
  });
  if (history.length > MAX_FOUNDER_TEST_LAUNCH_READINESS_HISTORY) {
    history.length = MAX_FOUNDER_TEST_LAUNCH_READINESS_HISTORY;
  }
}

export function getFounderTestLaunchReadinessHistorySize(): number {
  return history.length;
}

export function getLatestFounderTestLaunchReadinessHistoryEntry(): FounderTestLaunchReadinessHistoryEntry | null {
  return history[0] ?? null;
}

export function getFounderTestLaunchReadinessHistory(): readonly FounderTestLaunchReadinessHistoryEntry[] {
  return [...history];
}

export function countLaunchReadinessVerdict(
  verdict: LaunchReadinessVerdict,
  entries: readonly FounderTestLaunchReadinessHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.verdict === verdict).length;
}

export function buildFounderTestLaunchReadinessHistorySummary(
  entries: readonly FounderTestLaunchReadinessHistoryEntry[] = history,
): FounderTestLaunchReadinessHistorySummary {
  return {
    totalRuns: entries.length,
    launchReadyRuns: countLaunchReadinessVerdict('LAUNCH_READY', entries),
    launchReadyWithWarningsRuns: countLaunchReadinessVerdict('LAUNCH_READY_WITH_WARNINGS', entries),
    notLaunchReadyRuns: countLaunchReadinessVerdict('NOT_LAUNCH_READY', entries),
    blockedRuns: countLaunchReadinessVerdict('BLOCKED', entries),
    insufficientEvidenceRuns: countLaunchReadinessVerdict('INSUFFICIENT_EVIDENCE', entries),
  };
}
