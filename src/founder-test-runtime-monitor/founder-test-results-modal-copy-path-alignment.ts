/**
 * Founder Test Results modal copy/open path alignment — shared handoff resolver (V1).
 */

import type { FounderTestFinalReportFetchState } from './operator-feed-final-report-button-state-sync.js';
import {
  FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
  FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT,
  FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT,
  resolveFounderTestOperatorFeedReportButtonLabels,
} from './operator-feed-final-report-button-state-sync.js';

export const FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS =
  'FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS';

export const FOUNDER_TEST_RESULTS_PANEL_COPY_HANDOFF_DIAGNOSTIC = 'Copy Handoff Diagnostic';
export const FOUNDER_TEST_RESULTS_PANEL_OPEN_HANDOFF_DIAGNOSTIC = 'Open Handoff Diagnostic';
export const FOUNDER_TEST_RESULTS_PANEL_COPY_RUNTIME_DIAGNOSTIC = 'Copy Runtime Diagnostic';
export const FOUNDER_TEST_RESULTS_PANEL_OPEN_RUNTIME_DIAGNOSTIC = 'Open Runtime Diagnostic';
export const FOUNDER_TEST_RESULTS_PANEL_COPY_REPORT = 'Copy Report';
export const FOUNDER_TEST_RESULTS_PANEL_OPEN_REPORT = 'Open Report';

export const FOUNDER_TEST_REPORT_HANDOFF_PAYLOAD_SOURCES = [
  'local-cache',
  'full-report',
  'notification',
  'partial-report',
  'complete-fetch-failure-diagnostic',
  'complete-preparing',
  'runtime-diagnostic',
  'runtime-failure',
  'diagnostic',
] as const;

export type FounderTestReportHandoffPayloadSource =
  (typeof FOUNDER_TEST_REPORT_HANDOFF_PAYLOAD_SOURCES)[number];

export function shouldUseFounderTestHandoffDiagnosticForCompleteReport(input: {
  handoffStalled?: boolean;
  fetchFailed?: boolean;
  hasFetchDiagnostic?: boolean;
  hasDebugSnapshot?: boolean;
}): boolean {
  return (
    input.handoffStalled === true ||
    input.fetchFailed === true ||
    input.hasFetchDiagnostic === true ||
    input.hasDebugSnapshot === true
  );
}

export function isFounderTestRuntimeDiagnosticPayloadSource(
  source: string | null | undefined,
): boolean {
  return source === 'runtime-diagnostic' || source === 'runtime-failure' || source === 'diagnostic';
}

export function shouldAvoidRuntimeFailureReportForCompleteHandoff(input: {
  runtimeState: string | null | undefined;
  handoffStalled?: boolean;
  fetchFailed?: boolean;
  hasFetchDiagnostic?: boolean;
}): boolean {
  if (input.runtimeState !== 'COMPLETE') return false;
  return shouldUseFounderTestHandoffDiagnosticForCompleteReport(input);
}

export function resolveFounderTestResultsPanelReportActionLabels(input: {
  isComplete: boolean;
  hasCachedReport: boolean;
  fetchState: FounderTestFinalReportFetchState;
  handoffStalled?: boolean;
  payloadSource?: string | null;
}): { copy: string; open: string; enabled: boolean } {
  const operatorLabels = resolveFounderTestOperatorFeedReportButtonLabels({
    isComplete: input.isComplete,
    hasCachedReport: input.hasCachedReport,
    fetchState: input.fetchState,
    handoffStalled: input.handoffStalled,
  });

  if (operatorLabels.copy === 'Copy Handoff Diagnostic') {
    return {
      copy: FOUNDER_TEST_RESULTS_PANEL_COPY_HANDOFF_DIAGNOSTIC,
      open: FOUNDER_TEST_RESULTS_PANEL_OPEN_HANDOFF_DIAGNOSTIC,
      enabled: true,
    };
  }

  if (operatorLabels.copy === FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT) {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT,
      open: FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT,
      enabled: false,
    };
  }

  if (input.isComplete && input.hasCachedReport) {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
      open: FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT,
      enabled: true,
    };
  }

  if (input.isComplete) {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
      open: FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT,
      enabled: true,
    };
  }

  if (isFounderTestRuntimeDiagnosticPayloadSource(input.payloadSource)) {
    return {
      copy: FOUNDER_TEST_RESULTS_PANEL_COPY_RUNTIME_DIAGNOSTIC,
      open: FOUNDER_TEST_RESULTS_PANEL_OPEN_RUNTIME_DIAGNOSTIC,
      enabled: true,
    };
  }

  return {
    copy: FOUNDER_TEST_RESULTS_PANEL_COPY_REPORT,
    open: FOUNDER_TEST_RESULTS_PANEL_OPEN_REPORT,
    enabled: operatorLabels.enabled,
  };
}
