/**
 * Complete report preparing stall — handoff boundaries + debug diagnostics (V1).
 */

import type { StoredFounderTestRunResult } from './founder-test-run-result-store.js';
import { resolveStoredFounderTestReportMarkdown } from './founder-test-complete-report-handoff.js';
import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import {
  buildReportHandoffRunIdDiagnosticFields,
  buildReportHandoffRunIdPropagationDiagnosticLines,
} from './report-handoff-runid-propagation.js';
import {
  buildResultDebugResponseDiagnosticLines,
  buildResultFetchFailureDiagnosticLines,
} from './result-fetch-failure-diagnostic-surface.js';

export const COMPLETE_REPORT_PREPARING_STALL_REPAIR_V1_PASS =
  'COMPLETE_REPORT_PREPARING_STALL_REPAIR_V1_PASS';

export const COMPLETE_REPORT_HANDOFF_STALL_MS = 10_000;

export const REPORT_HANDOFF_TRACE_BOUNDARIES = [
  {
    operationId: 'final-report-markdown-built',
    label: 'Final report markdown built',
  },
  {
    operationId: 'final-report-stored-by-runid',
    label: 'Final report stored by runId',
  },
  {
    operationId: 'final-report-handoff-ready',
    label: 'Final report handoff ready',
  },
  {
    operationId: 'final-report-client-cache-ready',
    label: 'Final report delivered to client cache',
  },
  {
    operationId: 'final-report-notification-delivered',
    label: 'Final report notification delivered',
  },
] as const;

export const FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED =
  'Founder Test complete — report handoff stalled.';

export const FOUNDER_TEST_RESULT_DEBUG_CONTENT_TYPE_EXPECTED = 'application/json';

export function resolveMissingReportHandoffBoundary(input: {
  reportMarkdownBuilt: boolean;
  storedByRunId: boolean;
  hasReportMarkdown: boolean;
  clientCacheReady?: boolean;
  notificationDelivered?: boolean;
}): string {
  if (!input.reportMarkdownBuilt) return 'Final report markdown built';
  if (!input.storedByRunId) return 'Final report stored by runId';
  if (!input.hasReportMarkdown) return 'Final report stored by runId';
  if (input.clientCacheReady === false) return 'Final report delivered to client cache';
  if (input.notificationDelivered === false) return 'Final report notification delivered';
  return 'Final report delivered to client cache';
}

export function buildFounderTestResultDebugResponse(input: {
  requestedRunId: string | null;
  stored: StoredFounderTestRunResult | null;
  storedRunIds: readonly string[];
  runtime: FounderTestRuntimeSnapshot;
  resultEndpointStatus: number;
  clientCacheReady?: boolean;
  notificationDelivered?: boolean;
}): Record<string, unknown> {
  const storedMarkdown = input.stored ? resolveStoredFounderTestReportMarkdown(input.stored) : null;
  const reportMarkdownBuilt = Boolean(storedMarkdown?.trim());
  const storedByRunId = Boolean(input.stored && input.requestedRunId && input.stored.runId === input.requestedRunId);
  const hasReportMarkdown = Boolean(storedMarkdown?.trim());
  const missingHandoffBoundary = resolveMissingReportHandoffBoundary({
    reportMarkdownBuilt,
    storedByRunId,
    hasReportMarkdown,
    clientCacheReady: input.clientCacheReady,
    notificationDelivered: input.notificationDelivered,
  });

  return {
    readOnly: true,
    routeReached: true,
    requestedRunId: input.requestedRunId,
    hasStoredResult: Boolean(input.stored),
    hasReportMarkdown,
    reportMarkdownLength: storedMarkdown?.length ?? 0,
    storedRunIds: [...input.storedRunIds],
    runtimeState: input.runtime.state,
    publicState: input.runtime.publicState ?? input.runtime.state,
    handoffState: input.runtime.handoffState ?? missingHandoffBoundary,
    currentOperation: input.runtime.currentOperation ?? null,
    generatedAt: new Date().toISOString(),
    contentTypeExpected: FOUNDER_TEST_RESULT_DEBUG_CONTENT_TYPE_EXPECTED,
    endpointStatus: input.resultEndpointStatus,
    runtimeRunId: input.runtime.runId,
    storedRunId: input.stored?.runId ?? null,
    missingHandoffBoundary,
    reportHandoffStalled: input.resultEndpointStatus === 202 || !hasReportMarkdown,
    finalReportReady: input.stored?.payload?.finalReportReady === true,
  };
}

export function buildReportHandoffStallDiagnosticMarkdown(input: {
  runtime: FounderTestRuntimeSnapshot;
  debug: Record<string, unknown>;
  clientCacheReady?: boolean;
  notificationDelivered?: boolean;
  cardRunId?: string | null;
  pinnedRunId?: string | null;
  resolvedActiveRunId?: string | null;
  fetchDiagnostic?: Record<string, unknown> | null;
}): string {
  const debug = input.debug;
  const runIdFields = buildReportHandoffRunIdDiagnosticFields({
    requestedRunId: (debug.requestedRunId as string | null | undefined) ?? null,
    cardRunId:
      input.cardRunId ??
      (debug.runtimeCardRunId as string | null | undefined) ??
      null,
    pinnedRunId:
      input.pinnedRunId ?? (debug.pinnedRunId as string | null | undefined) ?? null,
    resolvedActiveRunId:
      input.resolvedActiveRunId ??
      (debug.resolvedActiveRunId as string | null | undefined) ??
      null,
    runtimeSnapshotRunId:
      (debug.runtimeRunId as string | null | undefined) ?? input.runtime.runId ?? null,
  });
  return [
    '# Founder Test Complete — Report Handoff Stalled',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Status',
    '',
    FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED,
    '',
    `- Missing boundary: ${String(debug.missingHandoffBoundary ?? 'unknown')}`,
    '',
    '## Handoff Debug',
    '',
    ...buildReportHandoffRunIdPropagationDiagnosticLines(runIdFields),
    '',
    `- Stored runId: ${String(debug.storedRunId ?? 'n/a')}`,
    `- hasStoredResult: ${String(debug.hasStoredResult ?? false)}`,
    `- hasReportMarkdown: ${String(debug.hasReportMarkdown ?? false)}`,
    `- reportMarkdownLength: ${String(debug.reportMarkdownLength ?? 0)}`,
    `- storedRunIds: ${Array.isArray(debug.storedRunIds) ? debug.storedRunIds.join(', ') : 'none'}`,
    `- endpoint status: ${String(debug.endpointStatus ?? 'n/a')}`,
    `- client cache ready: ${String(input.clientCacheReady ?? false)}`,
    `- notification delivered: ${String(input.notificationDelivered ?? false)}`,
    '',
    '## Result Fetch',
    '',
    ...buildResultFetchFailureDiagnosticLines(
      (input.fetchDiagnostic ?? {}) as Parameters<typeof buildResultFetchFailureDiagnosticLines>[0],
    ),
    '',
    '## Result Debug Endpoint',
    '',
    ...buildResultDebugResponseDiagnosticLines(
      (input.fetchDiagnostic?.resultDebugResponse as Record<string, unknown> | undefined) ??
        input.debug,
    ),
    '',
    '## Runtime Snapshot',
    '',
    `- State: ${input.runtime.state}`,
    `- Elapsed: ${input.runtime.progress?.elapsedMs ?? input.runtime.elapsedMs ?? 0} ms`,
    '',
  ].join('\n');
}
