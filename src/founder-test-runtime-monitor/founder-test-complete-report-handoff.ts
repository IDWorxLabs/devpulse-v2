/**
 * Founder Test complete report handoff — persistence + result endpoint contract (V1).
 */

import type { StoredFounderTestRunResult } from './founder-test-run-result-store.js';
import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import { formatDurationClock } from './runtime-progress-estimator.js';
import {
  FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE,
  isFounderTestCompleteSuccessState,
} from './founder-test-complete-report-delivery.js';

export const COMPLETE_REPORT_HANDOFF_REPAIR_V1_PASS = 'COMPLETE_REPORT_HANDOFF_REPAIR_V1_PASS';

export const COMPLETE_REPORT_HANDOFF_RESULT_RETRY_ATTEMPTS = 3;

export const COMPLETE_REPORT_HANDOFF_RETRY_DELAY_MS = 600;

export const COMPLETE_REPORT_HANDOFF_PREPARING_REASON =
  'Final report persisted after runtime completion — retrying result fetch';

export function resolveStoredFounderTestReportMarkdown(
  stored: StoredFounderTestRunResult,
): string | null {
  if (!stored.ok) return null;
  const payload = stored.payload;
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

export function buildFounderTestRunHandoffPayload(input: {
  runId: string;
  ok: boolean;
  runtime: FounderTestRuntimeSnapshot;
  report?: { reportMarkdown?: string } | null;
  reportMarkdown?: string | null;
  launchReadiness?: unknown;
  founderTestLaunchReadinessAssessment?: unknown;
  founderTestLaunchReadinessReportMarkdown?: string | null;
  mode?: string;
  finalReportReady?: boolean;
  finalReportPreparing?: boolean;
  finalReportPreparingReason?: string | null;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  const reportMarkdown = input.reportMarkdown ?? input.report?.reportMarkdown ?? null;
  return {
    ok: input.ok,
    readOnly: true,
    mode: input.mode ?? 'founder-testing-v5',
    runId: input.runId,
    launchReadiness: input.launchReadiness ?? null,
    founderTestLaunchReadinessAssessment: input.founderTestLaunchReadinessAssessment ?? null,
    founderTestLaunchReadinessReportMarkdown: input.founderTestLaunchReadinessReportMarkdown ?? null,
    runtime: input.runtime,
    report: input.report ?? (reportMarkdown ? { reportMarkdown } : null),
    reportMarkdown,
    finalReportReady: input.finalReportReady ?? Boolean(reportMarkdown?.trim()),
    finalReportPreparing: input.finalReportPreparing ?? !reportMarkdown?.trim(),
    finalReportPreparingReason: input.finalReportPreparingReason ?? null,
    ...input.extra,
  };
}

export function buildFounderTestCompleteHandoffFallbackMarkdown(input: {
  snapshot: FounderTestRuntimeSnapshot;
  runId?: string | null;
  reason: string;
  fetchAttempts?: number;
}): string {
  const runId = input.runId ?? input.snapshot.runId ?? 'n/a';
  return [
    '# Founder Test Complete — Report Handoff Diagnostic',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Status',
    '',
    '- State: COMPLETE',
    `- Run ID: ${runId}`,
    `- Reason: ${input.reason}`,
    ...(input.fetchAttempts != null ? [`- Result fetch attempts: ${input.fetchAttempts}`] : []),
    '',
    'All founder test stages completed. The final report could not be retrieved from the result endpoint after bounded retries.',
    '',
    '## Runtime Snapshot',
    '',
    `- Elapsed: ${formatDurationClock(input.snapshot.progress?.elapsedMs ?? input.snapshot.elapsedMs ?? 0)}`,
    `- Stages passed: ${input.snapshot.stages?.filter((stage) => stage.status === 'PASSED').length ?? 0}/${input.snapshot.progress?.totalStages ?? 11}`,
    '',
  ].join('\n');
}

export function shouldReturnCompleteResultHttp200(stored: StoredFounderTestRunResult): boolean {
  if (!stored.ok) return false;
  const runtime = stored.payload.runtime as FounderTestRuntimeSnapshot | undefined;
  const state = runtime?.state ?? 'COMPLETE';
  if (!isFounderTestCompleteSuccessState(state)) return stored.ok;
  return Boolean(resolveStoredFounderTestReportMarkdown(stored));
}

export function buildCompleteFounderTestResultPendingHandoffResponse(
  runtime: FounderTestRuntimeSnapshot,
  requestedRunId: string | null,
  reason: string = COMPLETE_REPORT_HANDOFF_PREPARING_REASON,
): Record<string, unknown> {
  return {
    ready: false,
    ok: true,
    readOnly: true,
    runId: requestedRunId || runtime.runId,
    state: 'COMPLETING',
    generatedAt: runtime.endedAt ?? new Date().toISOString(),
    reportMarkdown: null,
    partialReportMarkdown: null,
    failureReportMarkdown: null,
    preparingFinalReport: true,
    finalReportPreparing: true,
    finalReportPreparingReason: reason,
    message: FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE,
    runtime,
  };
}
