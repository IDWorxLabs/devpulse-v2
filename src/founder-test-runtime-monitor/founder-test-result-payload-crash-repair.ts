/**
 * Founder Test result payload crash repair — safe JSON + split markdown delivery (V1).
 */

import type { StoredFounderTestRunResult } from './founder-test-run-result-store.js';
import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import { resolveStoredFounderTestReportMarkdown } from './founder-test-complete-report-handoff.js';
import { shouldUseFounderTestRuntimeFailureReport } from './founder-test-complete-report-delivery.js';
import { buildFounderTestRuntimeFailureReport } from './runtime-failure-report-builder.js';

export const FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_V1_PASS =
  'FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_V1_PASS';

export const FOUNDER_TEST_RESULT_INLINE_MARKDOWN_MAX_CHARS = 96_000;

export const FOUNDER_TEST_RESULT_PREVIEW_MAX_CHARS = 600;

export const FOUNDER_TEST_RESULT_REPORT_ROUTE = '/api/founder-test/result-report';

export const FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE = '/api/founder-test/result-download';

export const FOUNDER_TEST_RESULT_STORE_PERSISTENCE = 'memory';

export const FOUNDER_TEST_RESULT_SERIALIZATION_FAILED = 'RESULT_SERIALIZATION_FAILED';

export const FOUNDER_TEST_AVAILABLE_DELIVERY_MODES = [
  'inline-json',
  'markdown-endpoint',
  'download-endpoint',
] as const;

export type FounderTestResultDeliveryMode = (typeof FOUNDER_TEST_AVAILABLE_DELIVERY_MODES)[number];

export function buildFounderTestStoreVolatilityFields(): {
  resultStorePersistence: typeof FOUNDER_TEST_RESULT_STORE_PERSISTENCE;
  storeVolatile: true;
} {
  return {
    resultStorePersistence: FOUNDER_TEST_RESULT_STORE_PERSISTENCE,
    storeVolatile: true,
  };
}

export function estimateFounderTestResultPayloadTooLarge(reportMarkdownLength: number): boolean {
  return reportMarkdownLength > FOUNDER_TEST_RESULT_INLINE_MARKDOWN_MAX_CHARS;
}

export function resolveFounderTestResultDeliveryMode(
  reportMarkdownLength: number,
): FounderTestResultDeliveryMode {
  return estimateFounderTestResultPayloadTooLarge(reportMarkdownLength)
    ? 'markdown-endpoint'
    : 'inline-json';
}

export function buildFounderTestReportPreview(markdown: string | null | undefined): string | null {
  if (!markdown?.trim()) return null;
  const text = markdown.trim();
  if (text.length <= FOUNDER_TEST_RESULT_PREVIEW_MAX_CHARS) return text;
  return `${text.slice(0, FOUNDER_TEST_RESULT_PREVIEW_MAX_CHARS)}…`;
}

export function safeStringifyFounderTestJson(
  body: unknown,
): { ok: true; json: string } | { ok: false; error: string } {
  try {
    return { ok: true, json: JSON.stringify(body) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'JSON serialization failed',
    };
  }
}

export function buildFounderTestResultSerializationFailureResponse(input: {
  runId?: string | null;
  reportMarkdownLength?: number | null;
  message: string;
}): Record<string, unknown> {
  return {
    readOnly: true,
    routeReached: true,
    ok: false,
    errorCode: FOUNDER_TEST_RESULT_SERIALIZATION_FAILED,
    message: input.message,
    runId: input.runId ?? null,
    reportMarkdownLength: input.reportMarkdownLength ?? null,
    ...buildFounderTestStoreVolatilityFields(),
  };
}

function resolveBoundedFailureMarkdown(input: {
  stored: StoredFounderTestRunResult;
  runtime?: FounderTestRuntimeSnapshot;
  state: string;
  partialReportMarkdown: string | null;
  errorMessage: string | null;
}): string | null {
  if (!shouldUseFounderTestRuntimeFailureReport({ ok: input.stored.ok, state: input.state })) {
    return null;
  }
  if (!input.runtime) return null;
  const failureReportMarkdown = buildFounderTestRuntimeFailureReport({
    snapshot: input.runtime,
    errorMessage: input.errorMessage ?? 'Founder test failed',
    partialReportMarkdown: input.partialReportMarkdown,
  });
  if (failureReportMarkdown.length <= FOUNDER_TEST_RESULT_INLINE_MARKDOWN_MAX_CHARS) {
    return failureReportMarkdown;
  }
  return buildFounderTestReportPreview(failureReportMarkdown);
}

export function buildFounderTestResultMetadataResponse(
  stored: StoredFounderTestRunResult,
): Record<string, unknown> {
  const payload = stored.payload as Record<string, unknown>;
  const runtime = payload.runtime as FounderTestRuntimeSnapshot | undefined;
  const state = runtime?.state ?? (stored.ok ? 'COMPLETE' : 'FAILED');
  const reportMarkdown = resolveStoredFounderTestReportMarkdown(stored);
  const reportMarkdownLength = reportMarkdown?.length ?? 0;
  const payloadTooLarge = estimateFounderTestResultPayloadTooLarge(reportMarkdownLength);
  const deliveryMode = resolveFounderTestResultDeliveryMode(reportMarkdownLength);
  const partialReportMarkdown =
    typeof payload.founderTestLaunchReadinessReportMarkdown === 'string'
      ? payload.founderTestLaunchReadinessReportMarkdown
      : null;
  const errorMessage =
    stored.errorMessage ?? (typeof payload.error === 'string' ? payload.error : null);

  const response: Record<string, unknown> = {
    ok: stored.ok,
    readOnly: true,
    ready: true,
    runId: stored.runId,
    state,
    generatedAt: stored.completedAt,
    hasReportMarkdown: Boolean(reportMarkdown?.trim()),
    reportMarkdownLength,
    payloadTooLarge,
    deliveryMode,
    reportPreview: buildFounderTestReportPreview(reportMarkdown),
    reportDownloadAvailable: Boolean(reportMarkdown?.trim()),
    reportMarkdownEndpoint: FOUNDER_TEST_RESULT_REPORT_ROUTE,
    reportDownloadEndpoint: FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE,
    availableDeliveryModes: [...FOUNDER_TEST_AVAILABLE_DELIVERY_MODES],
    runtime: runtime
      ? {
          runId: runtime.runId,
          state: runtime.state,
          publicState: runtime.publicState ?? runtime.state,
          handoffState: runtime.handoffState ?? null,
          handoffStateLabel: runtime.handoffStateLabel ?? null,
        }
      : null,
    error: errorMessage,
    partialReportMarkdown:
      !stored.ok && partialReportMarkdown
        ? buildFounderTestReportPreview(partialReportMarkdown)
        : null,
    failureReportMarkdown: resolveBoundedFailureMarkdown({
      stored,
      runtime,
      state,
      partialReportMarkdown,
      errorMessage,
    }),
    reportMarkdown: null,
    ...buildFounderTestStoreVolatilityFields(),
  };

  if (deliveryMode === 'inline-json' && reportMarkdown?.trim()) {
    response.reportMarkdown = reportMarkdown;
  }

  return response;
}

export function buildBoundedFounderTestResultDebugResponse(input: {
  requestedRunId: string | null;
  stored: StoredFounderTestRunResult | null;
  storedRunIds: readonly string[];
  runtime: FounderTestRuntimeSnapshot;
  resultEndpointStatus: number;
  serverStartedAt?: string;
  processId?: number;
  uptimeSeconds?: number;
  listeningPort?: number;
  listeningHost?: string;
}): Record<string, unknown> {
  const storedMarkdown = input.stored ? resolveStoredFounderTestReportMarkdown(input.stored) : null;
  const reportMarkdownLength = storedMarkdown?.length ?? 0;
  const reportPreview = buildFounderTestReportPreview(storedMarkdown);
  const payloadTooLarge = estimateFounderTestResultPayloadTooLarge(reportMarkdownLength);

  return {
    readOnly: true,
    routeReached: true,
    requestedRunId: input.requestedRunId,
    runId: input.requestedRunId,
    hasStoredResult: Boolean(input.stored),
    hasReportMarkdown: Boolean(storedMarkdown?.trim()),
    reportMarkdownLength,
    reportPreviewLength: reportPreview?.length ?? 0,
    payloadTooLarge,
    storedRunIds: [...input.storedRunIds],
    runtimeState: input.runtime.state,
    publicState: input.runtime.publicState ?? input.runtime.state,
    handoffState: input.runtime.handoffState ?? null,
    currentOperation: input.runtime.currentOperation ?? null,
    generatedAt: new Date().toISOString(),
    contentTypeExpected: 'application/json',
    endpointStatus: input.resultEndpointStatus,
    runtimeRunId: input.runtime.runId,
    storedRunId: input.stored?.runId ?? null,
    reportHandoffStalled: input.resultEndpointStatus === 202 || !storedMarkdown?.trim(),
    finalReportReady: input.stored?.payload?.finalReportReady === true,
    deliveryMode: resolveFounderTestResultDeliveryMode(reportMarkdownLength),
    reportMarkdownEndpoint: FOUNDER_TEST_RESULT_REPORT_ROUTE,
    reportDownloadEndpoint: FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE,
    serverStartedAt: input.serverStartedAt ?? null,
    processId: input.processId ?? null,
    uptimeSeconds: input.uptimeSeconds ?? null,
    listeningPort: input.listeningPort ?? null,
    listeningHost: input.listeningHost ?? null,
    ...buildFounderTestStoreVolatilityFields(),
  };
}

export function resolveStoredFounderTestReportMarkdownForDelivery(
  runId: string | null | undefined,
  peek: (runId?: string | null) => StoredFounderTestRunResult | null,
): string | null {
  if (!runId) return null;
  const stored = peek(runId);
  if (!stored) return null;
  return resolveStoredFounderTestReportMarkdown(stored);
}

export function buildFounderTestResultDownloadFilename(runId: string): string {
  const safeRunId = runId.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
  return `founder-test-report-${safeRunId}.md`;
}
