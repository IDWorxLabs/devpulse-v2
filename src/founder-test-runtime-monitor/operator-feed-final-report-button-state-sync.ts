/**
 * Operator Feed final report button state sync — per-run fetch state + label contract (V1).
 */

export const OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_V1_PASS =
  'OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_V1_PASS';

export const FOUNDER_TEST_FINAL_REPORT_FETCH_STATES = [
  'idle',
  'fetching',
  'available',
  'failed',
] as const;

export type FounderTestFinalReportFetchState =
  (typeof FOUNDER_TEST_FINAL_REPORT_FETCH_STATES)[number];

export const FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT = 'Copy Final Report';
export const FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT = 'Open Final Report';
export const FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT = 'Fetching Report...';
export const FOUNDER_TEST_OPERATOR_FEED_COPY_HANDOFF_DIAGNOSTIC = 'Copy Handoff Diagnostic';
export const FOUNDER_TEST_OPERATOR_FEED_OPEN_HANDOFF_DIAGNOSTIC = 'Open Handoff Diagnostic';
export const FOUNDER_TEST_OPERATOR_FEED_RETRY_FETCH_RESULT = 'Retry Fetch Result';

export function resolveFounderTestFinalReportFetchState(input: {
  hasCachedReport: boolean;
  currentState?: FounderTestFinalReportFetchState | null;
  fetching?: boolean;
  fetchFailed?: boolean;
}): FounderTestFinalReportFetchState {
  if (input.hasCachedReport) return 'available';
  if (input.fetching) return 'fetching';
  if (input.fetchFailed && input.currentState !== 'available') return 'failed';
  return input.currentState || 'idle';
}

export function shouldApplyFailedFetchState(input: {
  hasCachedReport: boolean;
  currentState?: FounderTestFinalReportFetchState | null;
}): boolean {
  if (input.hasCachedReport) return false;
  return input.currentState !== 'available';
}

export function resolveFounderTestOperatorFeedReportButtonLabels(input: {
  isComplete: boolean;
  hasCachedReport: boolean;
  fetchState: FounderTestFinalReportFetchState;
  handoffStalled?: boolean;
}): { copy: string; open: string; enabled: boolean; fetchingStatus?: string | null } {
  if (input.isComplete && input.hasCachedReport) {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
      open: FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT,
      enabled: true,
      fetchingStatus: null,
    };
  }
  if (input.isComplete && input.handoffStalled) {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_COPY_HANDOFF_DIAGNOSTIC,
      open: FOUNDER_TEST_OPERATOR_FEED_OPEN_HANDOFF_DIAGNOSTIC,
      enabled: true,
      fetchingStatus: 'Report Handoff Diagnostic available',
    };
  }
  if (
    input.isComplete &&
    !input.hasCachedReport &&
    input.fetchState === 'fetching'
  ) {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
      open: FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT,
      enabled: false,
      fetchingStatus: FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT,
    };
  }
  if (input.isComplete && !input.hasCachedReport && input.fetchState === 'failed') {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_COPY_HANDOFF_DIAGNOSTIC,
      open: FOUNDER_TEST_OPERATOR_FEED_OPEN_HANDOFF_DIAGNOSTIC,
      enabled: true,
      fetchingStatus: null,
    };
  }
  if (input.isComplete && !input.hasCachedReport) {
    return {
      copy: FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
      open: FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT,
      enabled: false,
      fetchingStatus: FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT,
    };
  }
  return {
    copy: 'Copy Latest Report',
    open: 'Open Report',
    enabled: true,
    fetchingStatus: null,
  };
}

export function shouldShowOperatorFeedFetchingReportLabel(input: {
  hasCachedReport: boolean;
  fetchState: FounderTestFinalReportFetchState;
  handoffStalled?: boolean;
}): boolean {
  if (input.hasCachedReport) return false;
  if (input.handoffStalled) return false;
  return input.fetchState === 'fetching';
}

export function resolveFounderTestReportHandoffStatusLabel(input: {
  runtime?: { publicState?: string; handoffStateLabel?: string; state?: string } | null;
  fetchState?: FounderTestFinalReportFetchState | null;
  hasCachedReport?: boolean;
  handoffStalled?: boolean;
  fetchFailed?: boolean;
}): string | null {
  if (input.hasCachedReport) return null;
  if (input.handoffStalled || input.fetchFailed) return 'Report Handoff Diagnostic available';
  if (input.fetchState === 'fetching') return FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT;
  if (input.runtime?.handoffStateLabel) return input.runtime.handoffStateLabel;
  if (input.runtime?.publicState === 'REPORT_HANDOFF_PENDING') return 'Report Handoff pending';
  return null;
}
