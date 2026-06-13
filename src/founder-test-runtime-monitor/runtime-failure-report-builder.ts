/**
 * Runtime Failure Report Builder — diagnostic copy text for failed founder test runs (V1).
 */

import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import { formatRuntimeFeedLines } from './runtime-feed-builder.js';
import { formatDurationClock } from './runtime-progress-estimator.js';

export function buildFounderTestRuntimeFailureReport(input: {
  snapshot: FounderTestRuntimeSnapshot;
  errorMessage: string;
  partialReportMarkdown?: string | null;
}): string {
  const lines: string[] = [
    '# Founder Test Runtime Failure Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Error',
    '',
    input.errorMessage,
    '',
    '## Runtime Snapshot',
    '',
    `- Run ID: ${input.snapshot.runId ?? 'n/a'}`,
    `- State: ${input.snapshot.state}`,
    `- Stage: ${input.snapshot.progress.currentStageLabel ?? 'unknown'} (${input.snapshot.progress.currentStageOrder}/${input.snapshot.progress.totalStages})`,
    `- Elapsed: ${formatDurationClock(input.snapshot.progress.elapsedMs)}`,
    `- Stall health: ${input.snapshot.stallAnalysis.health}`,
    `- Stall reason: ${input.snapshot.stallReason ?? input.snapshot.stallAnalysis.warningMessage ?? 'none'}`,
    `- Last heartbeat: ${input.snapshot.lastHeartbeatAt ?? 'n/a'}`,
    `- Seconds since heartbeat: ${input.snapshot.secondsSinceLastHeartbeat}`,
    `- Last successful artifact sub-step: ${input.snapshot.lastSuccessfulArtifactSubstep ?? 'n/a'}`,
    `- Active artifact sub-step: ${input.snapshot.activeArtifactBuildSubstep ?? 'none'}`,
    `- Artifact sub-step stall: ${input.snapshot.artifactBuildSubstepStallReason ?? 'none'}`,
    `- Missing completion boundary: ${input.snapshot.missingCompletionBoundary ?? 'none'}`,
    `- Stage 2 completion gap: ${input.snapshot.stage2CompletionGap ? 'yes' : 'no'}`,
    `- Handler alive: ${input.snapshot.handlerAlive ? 'yes' : 'no'}`,
    `- Handler last alive: ${input.snapshot.handlerLastAliveAt ?? 'n/a'}`,
    `- POST timed out: ${input.snapshot.postTimedOut ? 'yes' : 'no'}`,
    `- Chat stress started: ${input.snapshot.chatStressStartedCount ?? 0}`,
    `- Chat stress settled: ${input.snapshot.chatStressSettledCount ?? 0}`,
    `- Chat stress pending: ${input.snapshot.chatStressPendingCount ?? 0}`,
    ...((input.snapshot.chatStressPendingScenarioIds ?? []).length
      ? [`- Chat stress pending scenarios: ${(input.snapshot.chatStressPendingScenarioIds ?? []).join(', ')}`]
      : []),
    `- Chat stress active scenario: ${input.snapshot.chatStressActiveScenarioId ?? 'n/a'}`,
    `- Chat stress last settled: ${input.snapshot.chatStressLastSettledScenarioId ?? 'n/a'}`,
    ...((input.snapshot.chatStressTimeoutScenarioIds ?? []).length
      ? [`- Chat stress timeout scenarios: ${(input.snapshot.chatStressTimeoutScenarioIds ?? []).join(', ')}`]
      : []),
    ...((input.snapshot.chatStressFailedScenarioIds ?? []).length
      ? [`- Chat stress failed scenarios: ${(input.snapshot.chatStressFailedScenarioIds ?? []).join(', ')}`]
      : []),
    ...((input.snapshot.chatStressWatchdogOverdueScenarioIds ?? []).length
      ? [`- Chat stress watchdog overdue: ${(input.snapshot.chatStressWatchdogOverdueScenarioIds ?? []).join(', ')}`]
      : []),
    `- Chat stress max pending elapsed ms: ${input.snapshot.chatStressMaxPendingElapsedMs ?? 0}`,
    `- Last chat stress scenario: ${input.snapshot.chatStressLastScenario ?? 'n/a'}`,
    `- Last completed scenario: ${input.snapshot.lastSuccessfulArtifactSubstep ?? input.snapshot.lastCompletedOperation ?? 'n/a'}`,
    `- Runtime monitor running: ${input.snapshot.state === 'RUNNING' || input.snapshot.state === 'STALLED' ? 'yes' : 'no'}`,
    '',
    '## Artifact Build Trace',
    '',
  ];

  for (const event of input.snapshot.traceEvents.filter((entry) =>
    entry.operationId.includes('launch-readiness') ||
    entry.operationId.includes('loading-') ||
    entry.operationId.includes('running-') ||
    entry.operationId.includes('assessing-') ||
    entry.operationId.includes('building-launch') ||
    entry.operationId.includes('artifact-substep'),
  )) {
    lines.push(`- ${event.displayLine}`);
  }

  lines.push('', '## Stage Timings', '');

  for (const stage of input.snapshot.stages) {
    lines.push(
      `- ${stage.order}. ${stage.label}: ${stage.status}${stage.durationMs != null ? ` (${stage.durationMs} ms)` : ''}`,
    );
  }

  lines.push('', '## Runtime Feed', '');
  for (const line of formatRuntimeFeedLines(input.snapshot.feed)) {
    lines.push(`- ${line}`);
  }

  if (input.partialReportMarkdown && input.partialReportMarkdown.trim()) {
    lines.push('', '## Partial Founder Test Report', '', input.partialReportMarkdown.trim(), '');
  }

  return lines.join('\n');
}

export function buildFounderTestMinimalDiagnosticReport(errorMessage: string): string {
  return [
    '# Founder Test Diagnostic Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Error',
    '',
    errorMessage,
    '',
    'No runtime snapshot or founder test report was available at copy time.',
    '',
  ].join('\n');
}
