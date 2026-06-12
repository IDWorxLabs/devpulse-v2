/**
 * World 2 Disposable Workspace Instantiator — bounded assessment history.
 */

import { MAX_INSTANTIATOR_HISTORY } from './world2-disposable-workspace-instantiator-registry.js';
import type {
  World2DisposableWorkspaceInstantiatorAssessment,
  World2DisposableWorkspaceInstantiatorHistorySummary,
  World2InstantiationResultState,
} from './world2-disposable-workspace-instantiator-types.js';

const history: World2DisposableWorkspaceInstantiatorAssessment[] = [];

export function resetWorld2DisposableWorkspaceInstantiatorHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2DisposableWorkspaceInstantiatorAssessment(
  assessment: World2DisposableWorkspaceInstantiatorAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_INSTANTIATOR_HISTORY) {
    history.shift();
  }
}

export function getWorld2DisposableWorkspaceInstantiatorHistorySize(): number {
  return history.length;
}

export function getLatestWorld2DisposableWorkspaceInstantiatorAssessment(): World2DisposableWorkspaceInstantiatorAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2DisposableWorkspaceInstantiatorHistory(): readonly World2DisposableWorkspaceInstantiatorAssessment[] {
  return history;
}

export function buildWorld2DisposableWorkspaceInstantiatorHistorySummary(
  assessments: readonly World2DisposableWorkspaceInstantiatorAssessment[] = history,
): World2DisposableWorkspaceInstantiatorHistorySummary {
  const summary: World2DisposableWorkspaceInstantiatorHistorySummary = {
    totalAssessments: assessments.length,
    readyInstantiations: 0,
    simulatedInstantiations: 0,
    blockedInstantiations: 0,
    insufficientEvidenceInstantiations: 0,
    notReadyInstantiations: 0,
  };

  for (const item of assessments) {
    switch (item.resultState) {
      case 'INSTANTIATION_READY':
        summary.readyInstantiations += 1;
        break;
      case 'INSTANTIATION_SIMULATED':
        summary.simulatedInstantiations += 1;
        break;
      case 'INSTANTIATION_BLOCKED':
        summary.blockedInstantiations += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceInstantiations += 1;
        break;
      case 'NOT_READY':
        summary.notReadyInstantiations += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2InstantiationResultState(
  state: World2InstantiationResultState,
  assessments: readonly World2DisposableWorkspaceInstantiatorAssessment[] = history,
): number {
  return assessments.filter((item) => item.resultState === state).length;
}
