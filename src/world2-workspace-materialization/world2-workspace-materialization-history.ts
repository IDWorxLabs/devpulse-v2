/**
 * World 2 Workspace Materialization — bounded assessment history.
 */

import { MAX_MATERIALIZATION_HISTORY } from './world2-workspace-materialization-registry.js';
import type {
  World2MaterializationState,
  World2WorkspaceMaterializationAssessment,
  World2WorkspaceMaterializationHistorySummary,
} from './world2-workspace-materialization-types.js';

const history: World2WorkspaceMaterializationAssessment[] = [];

export function resetWorld2WorkspaceMaterializationHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2WorkspaceMaterializationAssessment(
  assessment: World2WorkspaceMaterializationAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_MATERIALIZATION_HISTORY) {
    history.shift();
  }
}

export function getWorld2WorkspaceMaterializationHistorySize(): number {
  return history.length;
}

export function getLatestWorld2WorkspaceMaterializationAssessment(): World2WorkspaceMaterializationAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2WorkspaceMaterializationHistory(): readonly World2WorkspaceMaterializationAssessment[] {
  return history;
}

export function buildWorld2WorkspaceMaterializationHistorySummary(
  assessments: readonly World2WorkspaceMaterializationAssessment[] = history,
): World2WorkspaceMaterializationHistorySummary {
  const summary: World2WorkspaceMaterializationHistorySummary = {
    totalAssessments: assessments.length,
    readyBlueprints: 0,
    warningBlueprints: 0,
    blockedBlueprints: 0,
    insufficientEvidenceBlueprints: 0,
    notReadyBlueprints: 0,
  };

  for (const item of assessments) {
    switch (item.materializationState) {
      case 'READY':
        summary.readyBlueprints += 1;
        break;
      case 'READY_WITH_WARNINGS':
        summary.warningBlueprints += 1;
        break;
      case 'BLOCKED':
        summary.blockedBlueprints += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceBlueprints += 1;
        break;
      case 'NOT_READY':
        summary.notReadyBlueprints += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2MaterializationState(
  state: World2MaterializationState,
  assessments: readonly World2WorkspaceMaterializationAssessment[] = history,
): number {
  return assessments.filter((item) => item.materializationState === state).length;
}
