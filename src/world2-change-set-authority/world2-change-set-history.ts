/**
 * World 2 Change Set Authority — bounded assessment history.
 */

import { MAX_CHANGE_SET_HISTORY } from './world2-change-set-registry.js';
import type {
  World2ChangeSetAssessment,
  World2ChangeSetEligibilityState,
  World2ChangeSetHistorySummary,
} from './world2-change-set-types.js';

const history: World2ChangeSetAssessment[] = [];

export function resetWorld2ChangeSetHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2ChangeSetAssessment(assessment: World2ChangeSetAssessment): void {
  history.push(assessment);
  while (history.length > MAX_CHANGE_SET_HISTORY) {
    history.shift();
  }
}

export function getWorld2ChangeSetHistorySize(): number {
  return history.length;
}

export function getLatestWorld2ChangeSetAssessment(): World2ChangeSetAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2ChangeSetHistory(): readonly World2ChangeSetAssessment[] {
  return history;
}

export function buildWorld2ChangeSetHistorySummary(
  assessments: readonly World2ChangeSetAssessment[] = history,
): World2ChangeSetHistorySummary {
  const summary: World2ChangeSetHistorySummary = {
    totalAssessments: assessments.length,
    changeSetsGenerated: 0,
    blockedOperationsCount: 0,
    warningChangeSets: 0,
    criticalChangeSets: 0,
  };

  for (const item of assessments) {
    if (item.changeSet) {
      summary.changeSetsGenerated += 1;
    }
    summary.blockedOperationsCount += item.blockedOperations.length;
    if (item.eligibilityState === 'READY_WITH_WARNINGS') {
      summary.warningChangeSets += 1;
    }
    if (item.changeSet?.estimatedImpact === 'CRITICAL') {
      summary.criticalChangeSets += 1;
    }
  }

  return summary;
}

export function countWorld2ChangeSetEligibilityState(
  state: World2ChangeSetEligibilityState,
  assessments: readonly World2ChangeSetAssessment[] = history,
): number {
  return assessments.filter((item) => item.eligibilityState === state).length;
}
