/**
 * World 2 Repository Snapshot Executor — bounded assessment history.
 */

import { MAX_SNAPSHOT_EXECUTOR_HISTORY } from './world2-repository-snapshot-executor-registry.js';
import type {
  World2RepositorySnapshotExecutorAssessment,
  World2RepositorySnapshotExecutorHistorySummary,
  World2SnapshotExecutionState,
} from './world2-repository-snapshot-executor-types.js';

const history: World2RepositorySnapshotExecutorAssessment[] = [];

export function resetWorld2RepositorySnapshotExecutorHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2RepositorySnapshotExecutorAssessment(
  assessment: World2RepositorySnapshotExecutorAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_SNAPSHOT_EXECUTOR_HISTORY) {
    history.shift();
  }
}

export function getWorld2RepositorySnapshotExecutorHistorySize(): number {
  return history.length;
}

export function getLatestWorld2RepositorySnapshotExecutorAssessment(): World2RepositorySnapshotExecutorAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2RepositorySnapshotExecutorHistory(): readonly World2RepositorySnapshotExecutorAssessment[] {
  return history;
}

export function buildWorld2RepositorySnapshotExecutorHistorySummary(
  assessments: readonly World2RepositorySnapshotExecutorAssessment[] = history,
): World2RepositorySnapshotExecutorHistorySummary {
  const summary: World2RepositorySnapshotExecutorHistorySummary = {
    totalAssessments: assessments.length,
    readyExecutions: 0,
    simulatedExecutions: 0,
    blockedExecutions: 0,
    insufficientEvidenceExecutions: 0,
    notReadyExecutions: 0,
  };

  for (const item of assessments) {
    switch (item.executionState) {
      case 'SNAPSHOT_EXECUTION_READY':
        summary.readyExecutions += 1;
        break;
      case 'SNAPSHOT_EXECUTION_SIMULATED':
        summary.simulatedExecutions += 1;
        break;
      case 'SNAPSHOT_EXECUTION_BLOCKED':
        summary.blockedExecutions += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceExecutions += 1;
        break;
      case 'NOT_READY':
        summary.notReadyExecutions += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2SnapshotExecutionState(
  state: World2SnapshotExecutionState,
  assessments: readonly World2RepositorySnapshotExecutorAssessment[] = history,
): number {
  return assessments.filter((item) => item.executionState === state).length;
}
