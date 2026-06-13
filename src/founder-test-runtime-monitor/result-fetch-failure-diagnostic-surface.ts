/**
 * Result fetch failure diagnostic surface — endpoint + client fetch proof (V1).
 */

import {
  buildFounderTestApiUrl,
  buildFounderTestResultDebugUrl as buildFounderTestResultDebugUrlWithBase,
  buildFounderTestResultFetchUrl as buildFounderTestResultFetchUrlWithBase,
  buildFounderTestResultReportUrl as buildFounderTestResultReportUrlWithBase,
  buildFounderTestResultDownloadUrl as buildFounderTestResultDownloadUrlWithBase,
  FOUNDER_TEST_RESULT_REPORT_ROUTE,
  FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE,
} from './founder-test-api-base-url-routing.js';

export const RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_V1_PASS =
  'RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_V1_PASS';

export const FOUNDER_TEST_RESULT_ROUTE = '/api/founder-test/result';

export const FOUNDER_TEST_RESULT_DEBUG_ROUTE = '/api/founder-test/result-debug';

export const FOUNDER_TEST_RESULT_DEBUG_CONTENT_TYPE_EXPECTED = 'application/json';

export const NON_JSON_RESPONSE_PREVIEW_MAX_CHARS = 120;

export interface ResultFetchAttemptDiagnostic {
  requestedUrl: string;
  requestedRunId: string | null;
  fetchErrorMessage: string | null;
  httpStatus: number | null;
  responseContentType: string | null;
  jsonParseFailed: boolean;
  nonJsonResponsePreview: string | null;
  resultDebugResponse: Record<string, unknown> | null;
}

export function previewNonJsonResponseBody(
  body: string | null | undefined,
  maxChars: number = NON_JSON_RESPONSE_PREVIEW_MAX_CHARS,
): string {
  if (!body) return '';
  const normalized = String(body).replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}…`;
}

export function buildFounderTestResultFetchUrl(runId: string, baseUrl: string = ''): string {
  return buildFounderTestResultFetchUrlWithBase(baseUrl, runId);
}

export function buildFounderTestResultDebugUrl(runId: string, baseUrl: string = ''): string {
  return buildFounderTestResultDebugUrlWithBase(baseUrl, runId);
}

export function buildFounderTestResultReportUrl(runId: string, baseUrl: string = ''): string {
  return buildFounderTestResultReportUrlWithBase(baseUrl, runId);
}

export function buildFounderTestResultDownloadUrl(runId: string, baseUrl: string = ''): string {
  return buildFounderTestResultDownloadUrlWithBase(baseUrl, runId);
}

export { FOUNDER_TEST_RESULT_REPORT_ROUTE, FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE };

export { buildFounderTestApiUrl };

export function buildResultFetchFailureDiagnosticLines(
  diagnostic: Partial<ResultFetchAttemptDiagnostic>,
): string[] {
  return [
    `- Requested URL: ${diagnostic.requestedUrl ?? 'n/a'}`,
    `- Requested runId: ${diagnostic.requestedRunId ?? 'n/a'}`,
    `- Fetch error message: ${diagnostic.fetchErrorMessage ?? 'none'}`,
    `- HTTP status: ${diagnostic.httpStatus != null ? String(diagnostic.httpStatus) : 'n/a'}`,
    `- Response content-type: ${diagnostic.responseContentType ?? 'n/a'}`,
    `- JSON parse failed: ${String(diagnostic.jsonParseFailed === true)}`,
    `- Non-JSON response preview: ${diagnostic.nonJsonResponsePreview ?? 'none'}`,
  ];
}

export function buildResultDebugResponseDiagnosticLines(
  debug: Record<string, unknown> | null | undefined,
): string[] {
  if (!debug) {
    return ['- result-debug response: unavailable'];
  }
  return [
    `- result-debug routeReached: ${String(debug.routeReached ?? false)}`,
    `- result-debug requestedRunId: ${String(debug.requestedRunId ?? 'n/a')}`,
    `- result-debug hasStoredResult: ${String(debug.hasStoredResult ?? false)}`,
    `- result-debug storedRunIds: ${
      Array.isArray(debug.storedRunIds) ? debug.storedRunIds.join(', ') : 'none'
    }`,
    `- result-debug runtimeState: ${String(debug.runtimeState ?? 'n/a')}`,
    `- result-debug publicState: ${String(debug.publicState ?? 'n/a')}`,
    `- result-debug handoffState: ${String(debug.handoffState ?? 'n/a')}`,
    `- result-debug currentOperation: ${String(debug.currentOperation ?? 'n/a')}`,
    `- result-debug hasReportMarkdown: ${String(debug.hasReportMarkdown ?? false)}`,
    `- result-debug reportMarkdownLength: ${String(debug.reportMarkdownLength ?? 0)}`,
    `- result-debug generatedAt: ${String(debug.generatedAt ?? 'n/a')}`,
    `- result-debug contentTypeExpected: ${String(
      debug.contentTypeExpected ?? FOUNDER_TEST_RESULT_DEBUG_CONTENT_TYPE_EXPECTED,
    )}`,
  ];
}

export function buildResultFetchFailureDiagnosticMarkdown(input: {
  title?: string;
  runIdLines?: string[];
  fetchDiagnostic: Partial<ResultFetchAttemptDiagnostic>;
  debugResponse?: Record<string, unknown> | null;
  extraLines?: string[];
}): string {
  const title = input.title ?? '# Founder Test — Result Fetch Failure Diagnostic';
  return [
    title,
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Result Fetch',
    '',
    ...buildResultFetchFailureDiagnosticLines(input.fetchDiagnostic),
    '',
    '## Result Debug Endpoint',
    '',
    ...buildResultDebugResponseDiagnosticLines(
      input.debugResponse ?? input.fetchDiagnostic.resultDebugResponse ?? null,
    ),
    ...(input.runIdLines && input.runIdLines.length ? ['', '## RunId Propagation', '', ...input.runIdLines] : []),
    ...(input.extraLines && input.extraLines.length ? ['', ...input.extraLines] : []),
    '',
  ].join('\n');
}
