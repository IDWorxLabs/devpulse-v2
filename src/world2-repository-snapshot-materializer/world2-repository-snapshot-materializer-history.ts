/**
 * World 2 Repository Snapshot Materializer — bounded assessment history.
 */

import { MAX_SNAPSHOT_MATERIALIZER_HISTORY } from './world2-repository-snapshot-materializer-registry.js';
import type {
  World2RepositorySnapshotMaterializerAssessment,
  World2RepositorySnapshotMaterializerHistorySummary,
  World2SnapshotMaterializationState,
} from './world2-repository-snapshot-materializer-types.js';

const history: World2RepositorySnapshotMaterializerAssessment[] = [];

export function resetWorld2RepositorySnapshotMaterializerHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2RepositorySnapshotMaterializerAssessment(
  assessment: World2RepositorySnapshotMaterializerAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_SNAPSHOT_MATERIALIZER_HISTORY) {
    history.shift();
  }
}

export function getWorld2RepositorySnapshotMaterializerHistorySize(): number {
  return history.length;
}

export function getLatestWorld2RepositorySnapshotMaterializerAssessment(): World2RepositorySnapshotMaterializerAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2RepositorySnapshotMaterializerHistory(): readonly World2RepositorySnapshotMaterializerAssessment[] {
  return history;
}

export function buildWorld2RepositorySnapshotMaterializerHistorySummary(
  assessments: readonly World2RepositorySnapshotMaterializerAssessment[] = history,
): World2RepositorySnapshotMaterializerHistorySummary {
  const summary: World2RepositorySnapshotMaterializerHistorySummary = {
    totalAssessments: assessments.length,
    readyMaterializations: 0,
    simulatedMaterializations: 0,
    blockedMaterializations: 0,
    insufficientEvidenceMaterializations: 0,
    notReadyMaterializations: 0,
  };

  for (const item of assessments) {
    switch (item.materializationState) {
      case 'MATERIALIZATION_READY':
        summary.readyMaterializations += 1;
        break;
      case 'MATERIALIZATION_SIMULATED':
        summary.simulatedMaterializations += 1;
        break;
      case 'MATERIALIZATION_BLOCKED':
        summary.blockedMaterializations += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceMaterializations += 1;
        break;
      case 'NOT_READY':
        summary.notReadyMaterializations += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2SnapshotMaterializationState(
  state: World2SnapshotMaterializationState,
  assessments: readonly World2RepositorySnapshotMaterializerAssessment[] = history,
): number {
  return assessments.filter((item) => item.materializationState === state).length;
}
