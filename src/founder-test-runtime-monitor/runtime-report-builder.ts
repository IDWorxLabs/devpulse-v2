/**
 * Runtime Report Builder — founder test runtime monitor report (V1).
 */

import {
  FOUNDER_TEST_RUNTIME_MONITOR_REPORT_TITLE,
  FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS,
} from './founder-test-runtime-registry.js';
import type {
  FounderTestRuntimeHistoryEntry,
  FounderTestRuntimeMonitorReport,
  FounderTestRuntimeSnapshot,
} from './founder-test-runtime-types.js';
import { formatRuntimeFeedLines } from './runtime-feed-builder.js';

export function buildFounderTestRuntimeMonitorReport(input: {
  snapshots: readonly FounderTestRuntimeSnapshot[];
  history: readonly FounderTestRuntimeHistoryEntry[];
}): FounderTestRuntimeMonitorReport {
  const latestSnapshot = input.snapshots[0] ?? null;
  const durations = input.history
    .map((entry) => entry.totalDurationMs)
    .filter((value): value is number => value != null);

  const averageDurationMs =
    durations.length === 0
      ? 0
      : Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalRuns: input.history.length,
    latestSnapshot,
    historySummary: {
      totalRuns: input.history.length,
      completeCount: input.history.filter((entry) => entry.finalState === 'COMPLETE').length,
      failedCount: input.history.filter((entry) => entry.finalState === 'FAILED').length,
      stalledCount: input.history.filter((entry) => entry.stallDetected).length,
      averageDurationMs,
    },
  };
}

export function buildFounderTestRuntimeMonitorReportMarkdown(
  report: FounderTestRuntimeMonitorReport,
  snapshots: readonly FounderTestRuntimeSnapshot[] = report.latestSnapshot ? [report.latestSnapshot] : [],
): string {
  const lines: string[] = [
    `# ${FOUNDER_TEST_RUNTIME_MONITOR_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total runs recorded: ${report.historySummary.totalRuns}`,
    `- Complete: ${report.historySummary.completeCount}`,
    `- Failed: ${report.historySummary.failedCount}`,
    `- Stalled: ${report.historySummary.stalledCount}`,
    `- Average duration: ${report.historySummary.averageDurationMs} ms`,
    '',
    '## Runtime States',
    '',
    '- IDLE, STARTING, RUNNING, COMPLETING, COMPLETE, FAILED, CANCELLED, STALLED',
    '',
  ];

  for (const snapshot of snapshots) {
    lines.push('## Latest Snapshot', '');
    lines.push(`- Run ID: ${snapshot.runId ?? 'n/a'}`);
    lines.push(`- State: ${snapshot.state}`);
    lines.push(`- Progress: ${snapshot.progress.percentComplete}% (${snapshot.progress.completedStages}/${snapshot.progress.totalStages})`);
    lines.push(`- Current stage: ${snapshot.progress.currentStageLabel ?? 'none'}`);
    lines.push(`- Stall health: ${snapshot.stallAnalysis.health}`);
    lines.push('');

    lines.push('## Stage Timings', '');
    for (const stage of snapshot.stages) {
      lines.push(
        `- ${stage.order}. ${stage.label}: ${stage.status}${stage.durationMs != null ? ` (${stage.durationMs} ms)` : ''}`,
      );
    }
    lines.push('');

    lines.push('## Progress Calculation', '');
    lines.push(`- Completed stages: ${snapshot.progress.completedStages}`);
    lines.push(`- Remaining stages: ${snapshot.progress.remainingStages}`);
    lines.push(`- Elapsed: ${snapshot.progress.elapsedMs} ms`);
    lines.push(`- Estimated remaining: ${snapshot.progress.estimatedRemainingMs ?? 'n/a'} ms`);
    lines.push('');

    lines.push('## Stall Behavior', '');
    lines.push(`- Health: ${snapshot.stallAnalysis.health}`);
    lines.push(`- Warning: ${snapshot.stallAnalysis.warningMessage ?? 'none'}`);
    lines.push('');

    lines.push('## Feed Samples', '');
    for (const line of formatRuntimeFeedLines(snapshot.feed).slice(-8)) {
      lines.push(`- ${line}`);
    }
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS}`, '');
  return lines.join('\n');
}
