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
    runId: input.stored?.runId ?? input.requestedRunId,
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

export const FOUNDER_TEST_RESULT_HANDOFF_MAX_TRACE_EVENTS = 48;

export const FOUNDER_TEST_RESULT_HANDOFF_MAX_FEED_EVENTS = 24;

export const FOUNDER_TEST_RESULT_HANDOFF_MAX_TRACE_LINE_CHARS = 320;

const HANDOFF_PRESERVED_TOP_LEVEL_KEYS = new Set([
  'ok',
  'readOnly',
  'mode',
  'runId',
  'runtime',
  'report',
  'reportMarkdown',
  'founderTestLaunchReadinessReportMarkdown',
  'founderTestLaunchReadinessAssessment',
  'launchReadiness',
  'finalReportReady',
  'finalReportPreparing',
  'finalReportPreparingReason',
  'payloadTruncationNotes',
  'executionHandoffSummary',
]);

const HEAVY_HANDOFF_EXTRA_KEYS = new Set([
  'verificationResults',
  'phaseFeedEvents',
  'changeIntelligence',
  'founderActionCenter',
  'founderSensemaking',
  'founderFrictionHeatmap',
  'chatStressSimulation',
  'productReadinessSimulation',
  'artifactBuildTrace',
  'runtimeTrace',
  'debugPayload',
  'traceEvents',
  'feed',
  'report',
  'reportMarkdown',
  'founderTestLaunchReadinessReportMarkdown',
]);

function truncateHandoffString(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}…`;
}

function resolveHandoffReportMarkdown(payload: Record<string, unknown>): string | null {
  const report = payload.report as { reportMarkdown?: string } | undefined;
  if (typeof report?.reportMarkdown === 'string' && report.reportMarkdown.trim()) {
    return report.reportMarkdown;
  }
  if (typeof payload.reportMarkdown === 'string' && payload.reportMarkdown.trim()) {
    return payload.reportMarkdown;
  }
  if (
    typeof payload.founderTestLaunchReadinessReportMarkdown === 'string' &&
    payload.founderTestLaunchReadinessReportMarkdown.trim()
  ) {
    return payload.founderTestLaunchReadinessReportMarkdown;
  }
  return null;
}

function summarizeLaunchReadinessAssessmentForStorage(assessment: unknown): Record<string, unknown> | null {
  if (assessment == null) return null;
  if (typeof assessment !== 'object') {
    return { readOnly: true, truncated: true, valueType: typeof assessment };
  }
  const record = assessment as Record<string, unknown>;
  const report = record.report as Record<string, unknown> | undefined;
  return {
    readOnly: true,
    truncated: true,
    launchReadinessVerdict: report?.launchReadinessVerdict ?? null,
    productReadinessScore: report?.productReadinessScore ?? null,
    blockingIssueCount: Array.isArray(report?.blockingIssues) ? report.blockingIssues.length : null,
    topRecommendedActionCount: Array.isArray(report?.topRecommendedActions)
      ? report.topRecommendedActions.length
      : null,
  };
}

function summarizeLaunchReadinessForStorage(launchReadiness: unknown): Record<string, unknown> | null {
  if (launchReadiness == null) return null;
  if (typeof launchReadiness !== 'object') {
    return { readOnly: true, truncated: true, valueType: typeof launchReadiness };
  }
  const record = launchReadiness as Record<string, unknown>;
  return {
    readOnly: true,
    truncated: true,
    launchReadinessVerdict: record.launchReadinessVerdict ?? null,
    productReadinessScore: record.productReadinessScore ?? null,
    blockingIssueCount: Array.isArray(record.blockingIssues) ? record.blockingIssues.length : null,
    topRecommendedActionCount: Array.isArray(record.topRecommendedActions)
      ? record.topRecommendedActions.length
      : null,
  };
}

function buildExecutionHandoffSummaryForStorage(
  payload: Record<string, unknown>,
  notes: string[],
): Record<string, unknown> {
  const summary: Record<string, unknown> = { readOnly: true, truncated: true };
  let stripped = 0;

  for (const [key, value] of Object.entries(payload)) {
    if (HANDOFF_PRESERVED_TOP_LEVEL_KEYS.has(key)) continue;
    if (value == null) continue;

    if (HEAVY_HANDOFF_EXTRA_KEYS.has(key)) {
      stripped++;
      summary[`${key}Present`] = true;
      if (Array.isArray(value)) summary[`${key}Count`] = value.length;
      continue;
    }

    if (typeof value === 'string') {
      if (value.length > 500) {
        stripped++;
        summary[`${key}Length`] = value.length;
        continue;
      }
      summary[key] = value;
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      summary[key] = value;
      continue;
    }

    stripped++;
    summary[`${key}Present`] = true;
    if (Array.isArray(value)) summary[`${key}Count`] = value.length;
  }

  if (stripped > 0) {
    notes.push(`execution handoff: ${stripped} oversized extra field(s) summarized`);
  }

  return summary;
}

export function boundFounderTestRuntimeSnapshotForStorage(
  runtime: FounderTestRuntimeSnapshot | null | undefined,
  notes: string[] = [],
): FounderTestRuntimeSnapshot | null {
  if (!runtime || typeof runtime !== 'object') return runtime ?? null;

  const originalTraceCount = runtime.traceEvents?.length ?? 0;
  const traceEvents = (runtime.traceEvents ?? [])
    .slice(-FOUNDER_TEST_RESULT_HANDOFF_MAX_TRACE_EVENTS)
    .map((event) => ({
      ...event,
      displayLine: truncateHandoffString(
        event.displayLine,
        FOUNDER_TEST_RESULT_HANDOFF_MAX_TRACE_LINE_CHARS,
      ),
    }));
  if (originalTraceCount > traceEvents.length) {
    notes.push(
      `runtime.traceEvents capped from ${originalTraceCount} to ${traceEvents.length} events`,
    );
  }

  const originalFeedCount = runtime.feed?.events?.length ?? 0;
  const feedEvents = (runtime.feed?.events ?? [])
    .slice(-FOUNDER_TEST_RESULT_HANDOFF_MAX_FEED_EVENTS)
    .map((event) => ({
      ...event,
      message: truncateHandoffString(event.message, FOUNDER_TEST_RESULT_HANDOFF_MAX_TRACE_LINE_CHARS),
    }));
  if (originalFeedCount > feedEvents.length) {
    notes.push(`runtime.feed.events capped from ${originalFeedCount} to ${feedEvents.length} events`);
  }

  return {
    ...runtime,
    traceEvents,
    feed: {
      ...runtime.feed,
      events: feedEvents,
    },
  };
}

export function boundFounderTestResultHandoffPayloadForStorage(payload: Record<string, unknown>): {
  payload: Record<string, unknown>;
  truncationNotes: string[];
} {
  const notes: string[] = [];
  const reportMarkdown = resolveHandoffReportMarkdown(payload);
  const launchMarkdown =
    typeof payload.founderTestLaunchReadinessReportMarkdown === 'string'
      ? payload.founderTestLaunchReadinessReportMarkdown
      : null;
  const dedupedLaunchMarkdown =
    launchMarkdown && reportMarkdown && launchMarkdown === reportMarkdown ? null : launchMarkdown;

  if (launchMarkdown && dedupedLaunchMarkdown == null && reportMarkdown) {
    notes.push('founderTestLaunchReadinessReportMarkdown deduplicated (same as reportMarkdown)');
  }

  const boundedRuntime = boundFounderTestRuntimeSnapshotForStorage(
    payload.runtime as FounderTestRuntimeSnapshot | undefined,
    notes,
  );

  if (payload.founderTestLaunchReadinessAssessment != null) {
    notes.push('founderTestLaunchReadinessAssessment summarized for storage');
  }
  if (payload.launchReadiness != null) {
    notes.push('launchReadiness summarized for storage');
  }

  const executionHandoffSummary = buildExecutionHandoffSummaryForStorage(payload, notes);

  const bounded: Record<string, unknown> = {
    ok: payload.ok,
    readOnly: payload.readOnly ?? true,
    mode: payload.mode ?? 'founder-testing-v5',
    runId: payload.runId,
    runtime: boundedRuntime,
    report: reportMarkdown ? { reportMarkdown } : payload.report ?? null,
    reportMarkdown,
    founderTestLaunchReadinessReportMarkdown: dedupedLaunchMarkdown,
    founderTestLaunchReadinessAssessment: summarizeLaunchReadinessAssessmentForStorage(
      payload.founderTestLaunchReadinessAssessment,
    ),
    launchReadiness: summarizeLaunchReadinessForStorage(payload.launchReadiness),
    finalReportReady: payload.finalReportReady,
    finalReportPreparing: payload.finalReportPreparing,
    finalReportPreparingReason: payload.finalReportPreparingReason ?? null,
    executionHandoffSummary,
  };

  if (notes.length > 0) {
    bounded.payloadTruncationNotes = notes;
  }

  return { payload: bounded, truncationNotes: notes };
}

function estimateBoundedRuntimeSnapshotBytes(runtime: unknown): number {
  if (!runtime || typeof runtime !== 'object') return 0;
  const snapshot = runtime as FounderTestRuntimeSnapshot;
  let bytes = 512;
  for (const event of snapshot.traceEvents ?? []) {
    bytes += Buffer.byteLength(event.displayLine ?? '', 'utf8') + 128;
  }
  for (const event of snapshot.feed?.events ?? []) {
    bytes += Buffer.byteLength(event.message ?? '', 'utf8') + 96;
  }
  bytes += (snapshot.stages?.length ?? 0) * 160;
  return bytes;
}

export function estimateStoredFounderTestResultPayloadBytesSafely(
  stored: StoredFounderTestRunResult,
): number {
  const payload = stored.payload as Record<string, unknown>;
  const reportMarkdown = resolveStoredFounderTestReportMarkdown(stored) ?? '';
  let bytes = Buffer.byteLength(reportMarkdown, 'utf8');
  bytes += Buffer.byteLength(stored.runId, 'utf8');
  bytes += Buffer.byteLength(stored.completedAt, 'utf8');
  bytes += stored.errorMessage ? Buffer.byteLength(stored.errorMessage, 'utf8') : 0;
  bytes += estimateBoundedRuntimeSnapshotBytes(payload.runtime);

  const launchMarkdown = payload.founderTestLaunchReadinessReportMarkdown;
  if (typeof launchMarkdown === 'string' && launchMarkdown !== reportMarkdown) {
    bytes += Buffer.byteLength(launchMarkdown, 'utf8');
  }

  bytes += 4_096;
  if (Array.isArray(payload.payloadTruncationNotes)) {
    for (const note of payload.payloadTruncationNotes) {
      if (typeof note === 'string') bytes += Buffer.byteLength(note, 'utf8');
    }
  }

  return bytes;
}
