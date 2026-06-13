/**
 * Founder Test complete report delivery — final report selection vs diagnostics (V1).
 */

import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import { formatDurationClock } from './runtime-progress-estimator.js';

export const FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_V1_PASS =
  'FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_V1_PASS';

export const FOUNDER_TEST_COMPLETE_NOTIFICATION_TITLE = 'Founder Test Report Ready';

export const FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE = 'Final report preparing';

export function isFounderTestCompleteSuccessState(state: string | null | undefined): boolean {
  return state === 'COMPLETE';
}

export function isFounderTestRuntimeFailureReportMarkdown(markdown: string | null | undefined): boolean {
  if (!markdown || !markdown.trim()) return false;
  return (
    markdown.includes('# Founder Test Runtime Failure Report') ||
    markdown.includes('Founder test still running')
  );
}

export function shouldUseFounderTestRuntimeFailureReport(input: {
  ok: boolean;
  state: string | null | undefined;
}): boolean {
  if (isFounderTestCompleteSuccessState(input.state) && input.ok) return false;
  return (
    !input.ok ||
    input.state === 'FAILED' ||
    input.state === 'STALLED' ||
    input.state === 'CANCELLED'
  );
}

export function resolveFounderTestReportMarkdownPreference(input: {
  reportMarkdown?: string | null;
  partialReportMarkdown?: string | null;
  failureReportMarkdown?: string | null;
  runtimeState?: string | null;
  ok?: boolean;
}): {
  markdown: string | null;
  source: 'final-report' | 'partial-report' | 'failure-report' | 'preparing' | 'none';
} {
  if (input.reportMarkdown?.trim()) {
    return { markdown: input.reportMarkdown, source: 'final-report' };
  }
  if (
    input.partialReportMarkdown?.trim() &&
    !isFounderTestRuntimeFailureReportMarkdown(input.partialReportMarkdown)
  ) {
    return { markdown: input.partialReportMarkdown, source: 'partial-report' };
  }
  if (
    isFounderTestCompleteSuccessState(input.runtimeState) &&
    input.ok !== false
  ) {
    return { markdown: null, source: 'preparing' };
  }
  if (input.failureReportMarkdown?.trim()) {
    return { markdown: input.failureReportMarkdown, source: 'failure-report' };
  }
  return { markdown: null, source: 'none' };
}

export function buildFounderTestCompletePreparingDiagnosticMarkdown(input: {
  snapshot: FounderTestRuntimeSnapshot;
  runId?: string | null;
  generatedAt?: string | null;
}): string {
  const runId = input.runId ?? input.snapshot.runId ?? 'n/a';
  const generatedAt = input.generatedAt ?? input.snapshot.endedAt ?? new Date().toISOString();
  return [
    '# Founder Test Complete — Report Preparing',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Status',
    '',
    FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE,
    '',
    'All founder test stages completed successfully. The final report is being assembled — retry Copy/Open Report in a moment.',
    '',
    '## Runtime Snapshot',
    '',
    `- Run ID: ${runId}`,
    `- State: COMPLETE`,
    `- Elapsed: ${formatDurationClock(input.snapshot.progress?.elapsedMs ?? input.snapshot.elapsedMs ?? 0)}`,
    `- Stages passed: ${input.snapshot.stages?.filter((stage) => stage.status === 'PASSED').length ?? 0}/${input.snapshot.progress?.totalStages ?? 11}`,
    '',
  ].join('\n');
}

export function buildCompleteFounderTestResultPendingResponse(
  runtime: FounderTestRuntimeSnapshot,
  requestedRunId: string | null,
): Record<string, unknown> {
  return {
    ready: false,
    ok: true,
    readOnly: true,
    runId: requestedRunId || runtime.runId,
    state: 'COMPLETE',
    generatedAt: runtime.endedAt ?? new Date().toISOString(),
    reportMarkdown: null,
    partialReportMarkdown: null,
    failureReportMarkdown: null,
    preparingFinalReport: true,
    message: FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE,
    runtime,
  };
}
