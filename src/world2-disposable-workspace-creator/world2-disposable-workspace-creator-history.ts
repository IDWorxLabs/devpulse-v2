/**
 * World 2 Disposable Workspace Creator — bounded assessment history.
 */

import { MAX_CREATOR_HISTORY } from './world2-disposable-workspace-creator-registry.js';
import type {
  World2CreationState,
  World2DisposableWorkspaceCreatorAssessment,
  World2DisposableWorkspaceCreatorHistorySummary,
} from './world2-disposable-workspace-creator-types.js';

const history: World2DisposableWorkspaceCreatorAssessment[] = [];

export function resetWorld2DisposableWorkspaceCreatorHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2DisposableWorkspaceCreatorAssessment(
  assessment: World2DisposableWorkspaceCreatorAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_CREATOR_HISTORY) {
    history.shift();
  }
}

export function getWorld2DisposableWorkspaceCreatorHistorySize(): number {
  return history.length;
}

export function getLatestWorld2DisposableWorkspaceCreatorAssessment(): World2DisposableWorkspaceCreatorAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2DisposableWorkspaceCreatorHistory(): readonly World2DisposableWorkspaceCreatorAssessment[] {
  return history;
}

export function buildWorld2DisposableWorkspaceCreatorHistorySummary(
  assessments: readonly World2DisposableWorkspaceCreatorAssessment[] = history,
): World2DisposableWorkspaceCreatorHistorySummary {
  const summary: World2DisposableWorkspaceCreatorHistorySummary = {
    totalAssessments: assessments.length,
    creationReadyPlans: 0,
    restrictedCreationPlans: 0,
    blockedCreationPlans: 0,
    insufficientEvidencePlans: 0,
    notReadyPlans: 0,
  };

  for (const item of assessments) {
    switch (item.creationState) {
      case 'CREATION_READY':
        summary.creationReadyPlans += 1;
        break;
      case 'CREATION_READY_WITH_RESTRICTIONS':
        summary.restrictedCreationPlans += 1;
        break;
      case 'CREATION_BLOCKED':
        summary.blockedCreationPlans += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidencePlans += 1;
        break;
      case 'NOT_READY':
        summary.notReadyPlans += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2CreationState(
  state: World2CreationState,
  assessments: readonly World2DisposableWorkspaceCreatorAssessment[] = history,
): number {
  return assessments.filter((item) => item.creationState === state).length;
}
