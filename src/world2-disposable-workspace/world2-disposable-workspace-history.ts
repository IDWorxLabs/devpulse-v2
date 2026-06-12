/**
 * World 2 Disposable Workspace — bounded assessment history.
 */

import { MAX_DISPOSABLE_WORKSPACE_HISTORY } from './world2-disposable-workspace-registry.js';
import type {
  World2DisposableWorkspaceAssessment,
  World2DisposableWorkspaceHistorySummary,
  World2WorkspaceState,
} from './world2-disposable-workspace-types.js';

const history: World2DisposableWorkspaceAssessment[] = [];

export function resetWorld2DisposableWorkspaceHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2DisposableWorkspaceAssessment(
  assessment: World2DisposableWorkspaceAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_DISPOSABLE_WORKSPACE_HISTORY) {
    history.shift();
  }
}

export function getWorld2DisposableWorkspaceHistorySize(): number {
  return history.length;
}

export function getLatestWorld2DisposableWorkspaceAssessment(): World2DisposableWorkspaceAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2DisposableWorkspaceHistory(): readonly World2DisposableWorkspaceAssessment[] {
  return history;
}

export function buildWorld2DisposableWorkspaceHistorySummary(
  assessments: readonly World2DisposableWorkspaceAssessment[] = history,
): World2DisposableWorkspaceHistorySummary {
  const summary: World2DisposableWorkspaceHistorySummary = {
    totalAssessments: assessments.length,
    readyWorkspaces: 0,
    warningWorkspaces: 0,
    blockedWorkspaces: 0,
    insufficientEvidenceWorkspaces: 0,
    notCreatedWorkspaces: 0,
    lifecycleCreateAllowed: 0,
    lifecycleDisposeRequired: 0,
  };

  for (const item of assessments) {
    switch (item.workspaceState) {
      case 'READY':
        summary.readyWorkspaces += 1;
        break;
      case 'READY_WITH_WARNINGS':
        summary.warningWorkspaces += 1;
        break;
      case 'BLOCKED':
        summary.blockedWorkspaces += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceWorkspaces += 1;
        break;
      case 'NOT_CREATED':
        summary.notCreatedWorkspaces += 1;
        break;
      default:
        break;
    }

    if (item.lifecycleAssessment.decision === 'CREATE_ALLOWED') {
      summary.lifecycleCreateAllowed += 1;
    }
    if (item.lifecycleAssessment.decision === 'DISPOSE_REQUIRED') {
      summary.lifecycleDisposeRequired += 1;
    }
  }

  return summary;
}

export function countWorld2WorkspaceState(
  state: World2WorkspaceState,
  assessments: readonly World2DisposableWorkspaceAssessment[] = history,
): number {
  return assessments.filter((item) => item.workspaceState === state).length;
}
