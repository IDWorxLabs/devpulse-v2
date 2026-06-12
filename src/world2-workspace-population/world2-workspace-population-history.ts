/**
 * World 2 Workspace Population — bounded assessment history.
 */

import { MAX_POPULATION_HISTORY } from './world2-workspace-population-registry.js';
import type {
  World2PopulationReadinessState,
  World2WorkspacePopulationHistorySummary,
  WorkspacePopulationAssessment,
} from './world2-workspace-population-types.js';

const history: WorkspacePopulationAssessment[] = [];

export function resetWorld2WorkspacePopulationHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2WorkspacePopulationAssessment(
  assessment: WorkspacePopulationAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_POPULATION_HISTORY) {
    history.shift();
  }
}

export function getWorld2WorkspacePopulationHistorySize(): number {
  return history.length;
}

export function getLatestWorld2WorkspacePopulationAssessment(): WorkspacePopulationAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2WorkspacePopulationHistory(): readonly WorkspacePopulationAssessment[] {
  return history;
}

export function buildWorld2WorkspacePopulationHistorySummary(
  assessments: readonly WorkspacePopulationAssessment[] = history,
): World2WorkspacePopulationHistorySummary {
  const summary: World2WorkspacePopulationHistorySummary = {
    totalAssessments: assessments.length,
    readyPopulations: 0,
    warningPopulations: 0,
    blockedPopulations: 0,
    insufficientEvidencePopulations: 0,
  };

  for (const item of assessments) {
    switch (item.readinessState) {
      case 'READY':
        summary.readyPopulations += 1;
        break;
      case 'READY_WITH_WARNINGS':
        summary.warningPopulations += 1;
        break;
      case 'BLOCKED':
        summary.blockedPopulations += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidencePopulations += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2PopulationReadinessState(
  state: World2PopulationReadinessState,
  assessments: readonly WorkspacePopulationAssessment[] = history,
): number {
  return assessments.filter((item) => item.readinessState === state).length;
}
