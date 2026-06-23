/**
 * Launch Blocker Board V1 — read-only authority (no repair phases).
 */

import { collectLaunchBlockerBoardEntries } from './launch-blocker-board-collector.js';
import { sortLaunchBlockerEntries } from './launch-blocker-board-classifier.js';
import { recordLaunchBlockerBoardReport, resetLaunchBlockerBoardHistoryForTests } from './launch-blocker-board-history.js';
import {
  buildLaunchBlockerBoardReportMarkdown,
} from './launch-blocker-board-report-builder.js';
import {
  CANONICAL_LAUNCH_BLOCKER_IDS,
  LAUNCH_BLOCKER_BOARD_CORE_QUESTION,
  LAUNCH_BLOCKER_BOARD_PASS,
  MAX_TOP_LAUNCH_BLOCKERS,
  STRATEGY_RESET_RULE,
} from './launch-blocker-board-registry.js';
import type {
  BuildLaunchBlockerBoardInput,
  LaunchBlockerBoardArtifacts,
  LaunchBlockerBoardAssessment,
  LaunchBlockerBoardEntry,
  LaunchBlockerBoardReport,
  LaunchBlockerBucket,
} from './launch-blocker-board-types.js';

let boardCounter = 0;

export function resetLaunchBlockerBoardCounterForTests(): void {
  boardCounter = 0;
}

export function resetLaunchBlockerBoardModuleForTests(): void {
  resetLaunchBlockerBoardCounterForTests();
  resetLaunchBlockerBoardHistoryForTests();
}

function nextBoardId(): string {
  boardCounter += 1;
  return `launch-blocker-board-${boardCounter}-${Date.now()}`;
}

function prioritizeCanonicalBlockers(entries: LaunchBlockerBoardEntry[]): LaunchBlockerBoardEntry[] {
  const sorted = sortLaunchBlockerEntries(entries);
  const canonical = CANONICAL_LAUNCH_BLOCKER_IDS.flatMap((id) => {
    const match = sorted.find((entry) => entry.blockerId === id);
    return match ? [match] : [];
  });
  const rest = sorted.filter(
    (entry) => !CANONICAL_LAUNCH_BLOCKER_IDS.includes(entry.blockerId as (typeof CANONICAL_LAUNCH_BLOCKER_IDS)[number]),
  );
  return [...canonical, ...rest];
}

function countBuckets(entries: LaunchBlockerBoardEntry[]): Record<LaunchBlockerBucket, number> {
  return {
    REAL_PRODUCT_GAP: entries.filter((entry) => entry.bucket === 'REAL_PRODUCT_GAP').length,
    CLAIM_WORDING_GAP: entries.filter((entry) => entry.bucket === 'CLAIM_WORDING_GAP').length,
    UI_UX_GAP: entries.filter((entry) => entry.bucket === 'UI_UX_GAP').length,
    FOUNDER_TEST_NOISE: entries.filter((entry) => entry.bucket === 'FOUNDER_TEST_NOISE').length,
  };
}

export function assembleLaunchBlockerBoard(input: BuildLaunchBlockerBoardInput): LaunchBlockerBoardAssessment {
  const boardId = nextBoardId();
  const generatedAt = new Date().toISOString();
  const runId = input.runId ?? input.launchReadiness.runId;

  const allBlockers = prioritizeCanonicalBlockers(
    collectLaunchBlockerBoardEntries({
      launchReadiness: input.launchReadiness,
      simulationElapsedMs: input.simulationElapsedMs,
      simulationDegraded: input.simulationDegraded,
      simulationDiagnosticMarkdown: input.simulationDiagnosticMarkdown,
      degradationAssessment: input.degradationAssessment,
      unifiedLaunchBlockers: input.unifiedLaunchBlockers,
    }),
  );

  const keepBlockers = allBlockers.filter((entry) => entry.disposition !== 'IGNORE');
  const topLaunchBlockers = keepBlockers.slice(0, MAX_TOP_LAUNCH_BLOCKERS);
  const bucketCounts = countBuckets(allBlockers);

  const report: LaunchBlockerBoardReport = {
    readOnly: true,
    advisoryOnly: true,
    boardId,
    generatedAt,
    runId,
    coreQuestion: LAUNCH_BLOCKER_BOARD_CORE_QUESTION,
    strategyResetRule: STRATEGY_RESET_RULE,
    launchReadinessVerdict: input.launchReadiness.launchReadinessVerdict,
    founderReadinessScore: input.launchReadiness.founderReadinessScore,
    bucketCounts,
    topLaunchBlockers,
    allBlockers,
    productGapCount: bucketCounts.REAL_PRODUCT_GAP + bucketCounts.CLAIM_WORDING_GAP + bucketCounts.UI_UX_GAP,
    testingNoiseCount: bucketCounts.FOUNDER_TEST_NOISE,
    passToken: LAUNCH_BLOCKER_BOARD_PASS,
  };

  if (!input.skipHistoryRecording) {
    recordLaunchBlockerBoardReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'LAUNCH_BLOCKER_BOARD_COMPLETE',
    report,
  };
}

export function buildLaunchBlockerBoardArtifacts(
  input: BuildLaunchBlockerBoardInput,
): LaunchBlockerBoardArtifacts {
  const launchBlockerBoardAssessment = assembleLaunchBlockerBoard(input);
  return {
    launchBlockerBoardAssessment,
    launchBlockerBoardReportMarkdown: buildLaunchBlockerBoardReportMarkdown(
      launchBlockerBoardAssessment.report,
    ),
  };
}
