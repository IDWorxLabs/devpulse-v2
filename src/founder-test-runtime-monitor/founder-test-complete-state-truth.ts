/**
 * Founder Test COMPLETE state truth + report handoff public model (V1).
 */

import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import { isFounderTestCompleteSuccessState } from './founder-test-complete-report-delivery.js';
import {
  hasStoredFounderTestReportMarkdownForRun,
  verifyFounderTestCompleteHandoffBoundary,
  maskRuntimeSnapshotUntilHandoffReady,
  FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE,
} from './founder-test-complete-handoff-boundary.js';

export const FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_V1_PASS =
  'FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_V1_PASS';

export const FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING = 'REPORT_HANDOFF_PENDING';

export const FOUNDER_TEST_REPORT_GENERATION_RUNNING_OPERATION = 'Report Generation running';
export const FOUNDER_TEST_REPORT_HANDOFF_PENDING_OPERATION = 'Report Handoff pending';
export const FOUNDER_TEST_PUBLIC_COMPLETE_OPERATION = 'Complete';
export const FOUNDER_TEST_REPORT_HANDOFF_FAILED_OPERATION = 'Report Handoff Failed';

export const FOUNDER_TEST_HANDOFF_STATE_LABELS = {
  founder_test_running: 'Founder Test running',
  report_markdown_building: 'Report markdown building',
  report_markdown_built: 'Report markdown built',
  report_persisted_to_result_store: 'Report persisted to result store',
  result_endpoint_verified: 'Result endpoint verified',
  client_report_fetch_started: 'Client report fetch started',
  client_report_fetch_succeeded: 'Client report fetch succeeded',
  client_report_fetch_failed: 'Client report fetch failed',
  report_handoff_failed: 'Report handoff failed',
  report_handoff_complete: 'Report handoff complete',
} as const;

export type FounderTestHandoffState = keyof typeof FOUNDER_TEST_HANDOFF_STATE_LABELS;

export const FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS_BOUNDED = 3;
export const FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS_BOUNDED = 3000;

export function isReportGenerationOperationLabel(label: string | null | undefined): boolean {
  if (!label) return false;
  return /report generation/i.test(label);
}

export function isExecutionTerminalComplete(snapshot: FounderTestRuntimeSnapshot): boolean {
  if (isFounderTestCompleteSuccessState(snapshot.state)) return true;
  const last = snapshot.lastCompletedOperation ?? '';
  return (
    /founder test complete/i.test(last) ||
    /runtime completed/i.test(last) ||
    snapshot.traceEvents.some(
      (event) => event.operationId === 'runtime-completed' && event.status === 'COMPLETE',
    )
  );
}

export function resolveFounderTestHandoffState(
  snapshot: FounderTestRuntimeSnapshot,
): FounderTestHandoffState {
  const runId = snapshot.runId;
  const storeReady = verifyFounderTestCompleteHandoffBoundary(runId);
  const traces = snapshot.traceEvents ?? [];

  const hasTrace = (operationId: string) =>
    traces.some(
      (event) => event.operationId === operationId && (event.status === 'PASSED' || event.status === 'COMPLETE'),
    );

  if (snapshot.state === 'FAILED') return 'report_handoff_failed';
  if (storeReady) return 'result_endpoint_verified';
  if (hasTrace('final-report-handoff-ready')) return 'result_endpoint_verified';
  if (hasTrace('final-report-stored-by-runid')) return 'report_persisted_to_result_store';
  if (hasTrace('final-report-markdown-built')) return 'report_markdown_built';
  if (isExecutionTerminalComplete(snapshot)) return 'report_handoff_failed';
  if (snapshot.progress?.currentStage === 'REPORT_GENERATION') return 'report_markdown_building';
  if (snapshot.state === 'RUNNING' || snapshot.state === 'STARTING') {
    const stage = snapshot.progress?.currentStage;
    if (stage && stage !== 'REPORT_GENERATION' && stage !== 'REPORT_HANDOFF' && stage !== 'COMPLETE') {
      return 'founder_test_running';
    }
  }
  return 'report_markdown_building';
}

export function resolveFounderTestPublicState(snapshot: FounderTestRuntimeSnapshot): string {
  if (snapshot.state === 'FAILED' || snapshot.state === 'CANCELLED') return snapshot.state;
  if (snapshot.state === 'IDLE') return 'IDLE';
  if (snapshot.state === 'STALLED') return 'STALLED';

  const storeReady = verifyFounderTestCompleteHandoffBoundary(snapshot.runId);
  const terminal = isExecutionTerminalComplete(snapshot);

  if (terminal || snapshot.state === 'COMPLETING') {
    if (!storeReady) return FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING;
    return 'COMPLETE';
  }

  if (snapshot.state === 'RUNNING' || snapshot.state === 'STARTING') {
    const handoff = resolveFounderTestHandoffState(snapshot);
    if (handoff === 'founder_test_running') {
      return snapshot.state;
    }
    if (handoff !== 'report_markdown_building' && !storeReady) {
      return FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING;
    }
    return snapshot.state;
  }

  return snapshot.state;
}

export function hasContradictoryCompleteState(snapshot: FounderTestRuntimeSnapshot): boolean {
  const publicState = resolveFounderTestPublicState(snapshot);
  if (publicState === 'COMPLETE') return false;
  if (!isFounderTestCompleteSuccessState(snapshot.state) && !isExecutionTerminalComplete(snapshot)) {
    return false;
  }
  return (
    isReportGenerationOperationLabel(snapshot.currentOperation) ||
    /fetching report/i.test(snapshot.currentOperation ?? '') ||
    (snapshot.progress?.currentStage === 'REPORT_GENERATION' &&
      snapshot.progress?.currentStageLabel != null &&
      !verifyFounderTestCompleteHandoffBoundary(snapshot.runId))
  );
}

function reconcileProgressForHandoff(
  snapshot: FounderTestRuntimeSnapshot,
  publicState: string,
): FounderTestRuntimeSnapshot['progress'] {
  const progress = snapshot.progress;
  const totalStages = progress.totalStages;
  const terminal = isExecutionTerminalComplete(snapshot) || publicState !== 'RUNNING';

  if (!terminal) return progress;

  const stageLabel =
    publicState === 'COMPLETE'
      ? 'Complete'
      : publicState === FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING
        ? 'Report Handoff'
        : progress.currentStageLabel ?? 'Complete';

  return {
    ...progress,
    currentStage: publicState === 'COMPLETE' ? 'COMPLETE' : 'REPORT_HANDOFF',
    currentStageLabel: stageLabel,
    currentStageOrder: totalStages,
    completedStages: totalStages,
    remainingStages: 0,
    percentComplete: 100,
    estimatedRemainingMs: 0,
  };
}

function reconcileCurrentOperation(input: {
  snapshot: FounderTestRuntimeSnapshot;
  publicState: string;
  storeReady: boolean;
}): string | null {
  const { snapshot, publicState, storeReady } = input;

  if (snapshot.state === 'FAILED') {
    return FOUNDER_TEST_REPORT_HANDOFF_FAILED_OPERATION;
  }

  if (publicState === 'COMPLETE' && storeReady) {
    return FOUNDER_TEST_PUBLIC_COMPLETE_OPERATION;
  }

  if (
    publicState === FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING ||
    snapshot.state === 'COMPLETING' ||
    (isExecutionTerminalComplete(snapshot) && !storeReady)
  ) {
    return FOUNDER_TEST_REPORT_HANDOFF_PENDING_OPERATION;
  }

  if (
    isExecutionTerminalComplete(snapshot) &&
    (isReportGenerationOperationLabel(snapshot.currentOperation) ||
      /report generation.*running/i.test(snapshot.currentOperation ?? ''))
  ) {
    return storeReady
      ? FOUNDER_TEST_REPORT_HANDOFF_PENDING_OPERATION
      : FOUNDER_TEST_REPORT_HANDOFF_PENDING_OPERATION;
  }

  if (
    isExecutionTerminalComplete(snapshot) &&
    snapshot.lastCompletedOperation &&
    /founder test complete/i.test(snapshot.lastCompletedOperation)
  ) {
    return storeReady ? FOUNDER_TEST_PUBLIC_COMPLETE_OPERATION : FOUNDER_TEST_REPORT_HANDOFF_PENDING_OPERATION;
  }

  return snapshot.currentOperation;
}

export function reconcilePublicFounderTestRuntimeSnapshot(
  snapshot: FounderTestRuntimeSnapshot,
): FounderTestRuntimeSnapshot & {
  publicState: string;
  handoffState: FounderTestHandoffState;
  handoffStateLabel: string;
  internalState: FounderTestRuntimeSnapshot['state'];
} {
  const masked = maskRuntimeSnapshotUntilHandoffReady(snapshot);
  const publicState = resolveFounderTestPublicState(masked);
  const handoffState = resolveFounderTestHandoffState(masked);
  const handoffStateLabel = FOUNDER_TEST_HANDOFF_STATE_LABELS[handoffState];
  const storeReady = verifyFounderTestCompleteHandoffBoundary(masked.runId);
  const terminal = isExecutionTerminalComplete(masked);

  const state =
    publicState === 'COMPLETE'
      ? 'COMPLETE'
      : publicState === FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING || masked.state === 'COMPLETING'
        ? 'COMPLETING'
        : masked.state;

  const currentOperation = reconcileCurrentOperation({ snapshot: masked, publicState, storeReady });
  const progress = reconcileProgressForHandoff(masked, publicState);

  const uiSummaryBase = masked.uiSummary ?? {
    headline: 'Founder Test',
    stageLine: FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE,
    elapsedLine: `Elapsed: ${progress.elapsedMs} ms`,
    remainingLine: 'Remaining: —',
  };

  const uiSummary = {
    ...uiSummaryBase,
    headline:
      publicState === 'COMPLETE'
        ? 'Founder Test Complete'
        : publicState === FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING
          ? 'Founder Test — Report Handoff Pending'
          : uiSummaryBase.headline,
    stageLine:
      publicState === 'COMPLETE'
        ? 'All stages finished'
        : handoffStateLabel,
    remainingLine: terminal ? 'Remaining: 00:00' : uiSummaryBase.remainingLine,
  };

  const traceStageStatus =
    publicState === 'COMPLETE'
      ? 'COMPLETE'
      : publicState === FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING || state === 'COMPLETING'
        ? 'RUNNING'
        : masked.traceStageStatus;

  return {
    ...masked,
    state,
    publicState,
    handoffState,
    handoffStateLabel,
    internalState: snapshot.state,
    currentOperation,
    progress,
    uiSummary,
    traceStageStatus,
    nextExpectedOperation:
      publicState === 'COMPLETE'
        ? 'Report delivered to client'
        : publicState === FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING
          ? 'Client report fetch'
          : masked.nextExpectedOperation,
  };
}

export function resolvePublicFounderTestRuntimeSnapshotWithStateTruth(
  snapshot: FounderTestRuntimeSnapshot,
): FounderTestRuntimeSnapshot {
  return reconcilePublicFounderTestRuntimeSnapshot(snapshot);
}

export function publicCompleteRequiresStoredReportMarkdown(): boolean {
  return true;
}

export function completeCannotCoexistWithReportGenerationRunning(
  snapshot: FounderTestRuntimeSnapshot,
): boolean {
  const reconciled = reconcilePublicFounderTestRuntimeSnapshot(snapshot);
  if (reconciled.publicState !== 'COMPLETE') return true;
  return !isReportGenerationOperationLabel(reconciled.currentOperation);
}

export function completeCannotCoexistWithStagePending(snapshot: FounderTestRuntimeSnapshot): boolean {
  const reconciled = reconcilePublicFounderTestRuntimeSnapshot(snapshot);
  if (reconciled.publicState !== 'COMPLETE') return true;
  return Boolean(reconciled.progress.currentStageLabel && reconciled.uiSummary.stageLine !== 'Stage pending');
}
