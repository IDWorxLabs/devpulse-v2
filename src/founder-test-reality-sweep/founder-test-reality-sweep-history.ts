/**
 * Founder Test Reality Sweep — bounded history (max 16).
 */

import { MAX_FOUNDER_TEST_REALITY_SWEEP_HISTORY } from './founder-test-reality-sweep-registry.js';
import type {
  FounderLaunchVerdict,
  FounderTestRealitySweepAssessment,
  FounderTestRealitySweepHistoryEntry,
  FounderTestRealitySweepHistorySummary,
} from './founder-test-reality-sweep-types.js';

const history: FounderTestRealitySweepHistoryEntry[] = [];

export function resetFounderTestRealitySweepHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderTestRealitySweepAssessment(
  assessment: FounderTestRealitySweepAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    sweepId: report.sweepId,
    launchReadinessPercent: report.launchReadinessPercent,
    founderLaunchVerdict: report.founderLaunchVerdict,
    blockerCount: report.launchBlockers.length,
    warningCount: report.launchWarnings.length,
  });
  if (history.length > MAX_FOUNDER_TEST_REALITY_SWEEP_HISTORY) {
    history.length = MAX_FOUNDER_TEST_REALITY_SWEEP_HISTORY;
  }
}

export function getFounderTestRealitySweepHistorySize(): number {
  return history.length;
}

export function getLatestFounderTestRealitySweepHistoryEntry(): FounderTestRealitySweepHistoryEntry | null {
  return history[0] ?? null;
}

export function getFounderTestRealitySweepHistory(): readonly FounderTestRealitySweepHistoryEntry[] {
  return [...history];
}

function countVerdict(
  verdict: FounderLaunchVerdict,
  entries: readonly FounderTestRealitySweepHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.founderLaunchVerdict === verdict).length;
}

export function buildFounderTestRealitySweepHistorySummary(
  entries: readonly FounderTestRealitySweepHistoryEntry[] = history,
): FounderTestRealitySweepHistorySummary {
  return {
    totalAssessments: entries.length,
    readyToLaunchAssessments: countVerdict('READY_TO_LAUNCH', entries),
    readyWithWarningsAssessments: countVerdict('READY_WITH_WARNINGS', entries),
    notReadyAssessments: countVerdict('NOT_READY_TO_LAUNCH', entries),
    blockedAssessments: countVerdict('BLOCK_LAUNCH', entries),
    insufficientEvidenceAssessments: countVerdict('INSUFFICIENT_EVIDENCE', entries),
  };
}
