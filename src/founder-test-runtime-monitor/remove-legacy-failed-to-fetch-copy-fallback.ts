/**
 * Remove legacy Failed to fetch copy fallback — COMPLETE handoff diagnostic only (V1).
 */

export const REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS =
  'REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS';

export const FOUNDER_TEST_RUNTIME_FAILURE_REPORT_HEADING = '# Founder Test Runtime Failure Report';

export const FOUNDER_TEST_HANDOFF_DIAGNOSTIC_HEADING =
  '# Founder Test Complete — Report Handoff / Fetch Failure Diagnostic';

export function isGenericFailedToFetchMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return /failed to fetch/i.test(String(message));
}

export function shouldBlockRuntimeFailureReportForCompleteRun(input: {
  runtimeState: string | null | undefined;
  errorMessage?: string | null;
}): boolean {
  if (input.runtimeState !== 'COMPLETE') return false;
  return true;
}

export function shouldUseCompleteHandoffDiagnosticCopy(input: {
  runtimeState: string | null | undefined;
  hasCachedFinalReport?: boolean;
  handoffStalled?: boolean;
  fetchFailed?: boolean;
  hasFetchDiagnostic?: boolean;
  hasDebugSnapshot?: boolean;
  errorMessage?: string | null;
}): boolean {
  if (input.runtimeState !== 'COMPLETE' || input.hasCachedFinalReport) return false;
  return (
    input.handoffStalled === true ||
    input.fetchFailed === true ||
    input.hasFetchDiagnostic === true ||
    input.hasDebugSnapshot === true ||
    isGenericFailedToFetchMessage(input.errorMessage)
  );
}

export function completeCopyMustIncludeHandoffDiagnosticFields(markdown: string): boolean {
  return (
    markdown.includes('## Result Fetch') &&
    markdown.includes('Requested URL:') &&
    markdown.includes('Requested runId:') &&
    markdown.includes('result-debug routeReached:') &&
    markdown.includes('storedRunIds:') &&
    markdown.includes('hasStoredResult:') &&
    markdown.includes('hasReportMarkdown:') &&
    markdown.includes('reportMarkdownLength:')
  );
}

export function completeCopyMustNotIncludeGenericFailedToFetch(markdown: string): boolean {
  if (!markdown.includes(FOUNDER_TEST_RUNTIME_FAILURE_REPORT_HEADING)) return true;
  return !/## Error[\s\S]*Failed to fetch/i.test(markdown);
}
