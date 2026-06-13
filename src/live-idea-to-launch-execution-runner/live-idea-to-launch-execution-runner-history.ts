/**
 * Live Idea-To-Launch Execution Runner — bounded history.
 */

import { MAX_LIVE_EXECUTION_RUNNER_HISTORY } from './live-idea-to-launch-execution-runner-registry.js';
import type {
  LiveExecutionRunnerHistoryEntry,
  LiveExecutionRunnerHistorySummary,
  LiveIdeaToLaunchExecutionRunnerAssessment,
} from './live-idea-to-launch-execution-runner-types.js';

const history: LiveExecutionRunnerHistoryEntry[] = [];

export function resetLiveExecutionRunnerHistoryForTests(): void {
  history.length = 0;
}

export function recordLiveExecutionRunnerAssessment(
  assessment: LiveIdeaToLaunchExecutionRunnerAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    runId: report.runId,
    executionState: report.executionState,
    overallExecutionScore: report.overallExecutionScore,
    executionVerdict: report.executionVerdict,
  });
  if (history.length > MAX_LIVE_EXECUTION_RUNNER_HISTORY) {
    history.length = MAX_LIVE_EXECUTION_RUNNER_HISTORY;
  }
}

export function getLiveExecutionRunnerHistorySize(): number {
  return history.length;
}

export function buildLiveExecutionRunnerHistorySummary(
  entries: readonly LiveExecutionRunnerHistoryEntry[] = history,
): LiveExecutionRunnerHistorySummary {
  return {
    totalRuns: entries.length,
    launchReadyRuns: entries.filter((e) => e.executionState === 'LAUNCH_READY').length,
    runtimeConfirmedRuns: entries.filter(
      (e) => e.executionState === 'RUNTIME_CONFIRMED' || e.executionState === 'LAUNCH_READY',
    ).length,
    notProvenRuns: entries.filter((e) => e.executionVerdict === 'NOT_PROVEN' || e.executionVerdict === 'UNKNOWN').length,
  };
}
