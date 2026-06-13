/**
 * Founder Test COMPLETE handoff boundary — store-before-complete gate (V1).
 */

import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import { isFounderTestCompleteSuccessState } from './founder-test-complete-report-delivery.js';
import {
  resolveStoredFounderTestReportMarkdown,
} from './founder-test-complete-report-handoff.js';
import {
  peekFounderTestRunResult,
} from './founder-test-run-result-store.js';

export const FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_V1_PASS =
  'FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_V1_PASS';

export const FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN =
  'Report markdown missing before completion boundary';

export const FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY =
  'Result store missing report markdown for runId';

export const FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE =
  'Final report handoff pending — result store not ready';

export function hasStoredFounderTestReportMarkdownForRun(runId: string | null | undefined): boolean {
  if (!runId) return false;
  const stored = peekFounderTestRunResult(runId);
  if (!stored) return false;
  return Boolean(resolveStoredFounderTestReportMarkdown(stored));
}

export function verifyFounderTestCompleteHandoffBoundary(runId: string | null | undefined): boolean {
  return hasStoredFounderTestReportMarkdownForRun(runId);
}

export function canEmitFounderTestRuntimeComplete(input: {
  runId: string | null | undefined;
  reportMarkdown: string | null | undefined;
}): boolean {
  if (!input.runId) return false;
  if (!input.reportMarkdown?.trim()) return false;
  return verifyFounderTestCompleteHandoffBoundary(input.runId);
}

export function maskRuntimeSnapshotUntilHandoffReady(
  snapshot: FounderTestRuntimeSnapshot,
): FounderTestRuntimeSnapshot {
  if (!isFounderTestCompleteSuccessState(snapshot.state)) return snapshot;
  const runId = snapshot.runId;
  if (!runId) return snapshot;
  if (verifyFounderTestCompleteHandoffBoundary(runId)) return snapshot;

  const uiSummary = snapshot.uiSummary ?? {
    headline: 'Founder Test Completing',
    stageLine: FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE,
    elapsedLine: 'Elapsed: —',
    remainingLine: 'Remaining: —',
  };

  return {
    ...snapshot,
    state: 'COMPLETING',
    uiSummary: {
      ...uiSummary,
      headline: 'Founder Test Completing',
      stageLine: FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE,
    },
    missingCompletionBoundary: 'Final report stored in result store before COMPLETE',
  };
}

export function resolvePublicFounderTestRuntimeSnapshot(
  snapshot: FounderTestRuntimeSnapshot,
): FounderTestRuntimeSnapshot {
  // State truth reconciliation applied in founder-test-complete-state-truth (imported by monitor).
  return maskRuntimeSnapshotUntilHandoffReady(snapshot);
}
