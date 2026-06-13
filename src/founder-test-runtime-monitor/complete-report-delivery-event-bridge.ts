/**
 * Complete report delivery event bridge — cache + notification + UI surfaces (V1).
 */

export const COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_V1_PASS =
  'COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_V1_PASS';

export const FOUNDER_TEST_COMPLETE_HEADER_REPORT_READY =
  'Founder Test complete — report ready.';

export const FOUNDER_TEST_COMPLETE_HEADER_PREPARING =
  'Founder Test complete — preparing report.';

export const FOUNDER_TEST_COMPLETE_HEADER_FETCH_FAILED =
  'Founder Test complete — report fetch failed, diagnostic available.';

export function normalizeFounderTestDeliveryRunId(input: {
  runId?: string | null;
  runtimeRunId?: string | null;
  pinnedRunId?: string | null;
  activeRunId?: string | null;
}): string | null {
  return input.runId || input.runtimeRunId || input.pinnedRunId || input.activeRunId || null;
}

export function resolveFounderTestCompleteHeaderHint(input: {
  state: string | null | undefined;
  hasReportMarkdown: boolean;
  fetchFailed: boolean;
  fetching: boolean;
}): string | null {
  if (input.state !== 'COMPLETE') return null;
  if (input.hasReportMarkdown) return FOUNDER_TEST_COMPLETE_HEADER_REPORT_READY;
  if (input.fetchFailed) return FOUNDER_TEST_COMPLETE_HEADER_FETCH_FAILED;
  if (input.fetching) return FOUNDER_TEST_COMPLETE_HEADER_PREPARING;
  return FOUNDER_TEST_COMPLETE_HEADER_PREPARING;
}

export function shouldShowOperatorFeedFetchingLabel(input: {
  state: string | null | undefined;
  hasCachedReport: boolean;
  fetching: boolean;
}): boolean {
  if (input.state !== 'COMPLETE') return false;
  if (input.hasCachedReport) return false;
  return input.fetching === true;
}

export function shouldDeliverFounderTestReportReadyNotification(input: {
  markdown: string | null | undefined;
  state: string | null | undefined;
  skipNotification?: boolean;
}): boolean {
  if (input.skipNotification) return false;
  if (!input.markdown || !input.markdown.trim()) return false;
  return input.state === 'COMPLETE' || input.state == null;
}
