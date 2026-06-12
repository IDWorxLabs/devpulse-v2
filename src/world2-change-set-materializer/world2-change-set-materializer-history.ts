/**
 * World 2 Change Set Materializer — bounded assessment history.
 */

import { MAX_CHANGE_MATERIALIZER_HISTORY } from './world2-change-set-materializer-registry.js';
import type {
  World2ChangeMaterializationState,
  World2ChangeSetMaterializerAssessment,
  World2ChangeSetMaterializerHistorySummary,
} from './world2-change-set-materializer-types.js';

const history: World2ChangeSetMaterializerAssessment[] = [];

export function resetWorld2ChangeSetMaterializerHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2ChangeSetMaterializerAssessment(
  assessment: World2ChangeSetMaterializerAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_CHANGE_MATERIALIZER_HISTORY) {
    history.shift();
  }
}

export function getWorld2ChangeSetMaterializerHistorySize(): number {
  return history.length;
}

export function getLatestWorld2ChangeSetMaterializerAssessment(): World2ChangeSetMaterializerAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2ChangeSetMaterializerHistory(): readonly World2ChangeSetMaterializerAssessment[] {
  return history;
}

export function buildWorld2ChangeSetMaterializerHistorySummary(
  assessments: readonly World2ChangeSetMaterializerAssessment[] = history,
): World2ChangeSetMaterializerHistorySummary {
  const summary: World2ChangeSetMaterializerHistorySummary = {
    totalAssessments: assessments.length,
    readyMaterializations: 0,
    simulatedMaterializations: 0,
    blockedMaterializations: 0,
    insufficientEvidenceMaterializations: 0,
    notReadyMaterializations: 0,
  };

  for (const item of assessments) {
    switch (item.materializationState) {
      case 'CHANGE_MATERIALIZATION_READY':
        summary.readyMaterializations += 1;
        break;
      case 'CHANGE_MATERIALIZATION_SIMULATED':
        summary.simulatedMaterializations += 1;
        break;
      case 'CHANGE_MATERIALIZATION_BLOCKED':
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

export function countWorld2ChangeMaterializationState(
  state: World2ChangeMaterializationState,
  assessments: readonly World2ChangeSetMaterializerAssessment[] = history,
): number {
  return assessments.filter((item) => item.materializationState === state).length;
}
