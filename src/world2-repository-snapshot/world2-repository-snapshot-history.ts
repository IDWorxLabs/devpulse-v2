/**
 * World 2 Repository Snapshot — bounded assessment history.
 */

import { MAX_SNAPSHOT_HISTORY } from './world2-repository-snapshot-registry.js';
import type {
  World2RepositorySnapshotAssessment,
  World2RepositorySnapshotHistorySummary,
  World2SnapshotState,
} from './world2-repository-snapshot-types.js';

const history: World2RepositorySnapshotAssessment[] = [];

export function resetWorld2RepositorySnapshotHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2RepositorySnapshotAssessment(
  assessment: World2RepositorySnapshotAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_SNAPSHOT_HISTORY) {
    history.shift();
  }
}

export function getWorld2RepositorySnapshotHistorySize(): number {
  return history.length;
}

export function getLatestWorld2RepositorySnapshotAssessment(): World2RepositorySnapshotAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2RepositorySnapshotHistory(): readonly World2RepositorySnapshotAssessment[] {
  return history;
}

export function buildWorld2RepositorySnapshotHistorySummary(
  assessments: readonly World2RepositorySnapshotAssessment[] = history,
): World2RepositorySnapshotHistorySummary {
  const summary: World2RepositorySnapshotHistorySummary = {
    totalAssessments: assessments.length,
    readySnapshots: 0,
    restrictedSnapshots: 0,
    blockedSnapshots: 0,
    insufficientEvidenceSnapshots: 0,
    notReadySnapshots: 0,
  };

  for (const item of assessments) {
    switch (item.snapshotState) {
      case 'SNAPSHOT_READY':
        summary.readySnapshots += 1;
        break;
      case 'SNAPSHOT_READY_WITH_RESTRICTIONS':
        summary.restrictedSnapshots += 1;
        break;
      case 'SNAPSHOT_BLOCKED':
        summary.blockedSnapshots += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceSnapshots += 1;
        break;
      case 'NOT_READY':
        summary.notReadySnapshots += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2SnapshotState(
  state: World2SnapshotState,
  assessments: readonly World2RepositorySnapshotAssessment[] = history,
): number {
  return assessments.filter((item) => item.snapshotState === state).length;
}
