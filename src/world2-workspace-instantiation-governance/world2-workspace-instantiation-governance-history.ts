/**
 * World 2 Workspace Instantiation Governance — bounded assessment history.
 */

import { MAX_INSTANTIATION_GOVERNANCE_HISTORY } from './world2-workspace-instantiation-governance-registry.js';
import type {
  World2InstantiationApprovalState,
  World2InstantiationGovernanceAssessment,
  World2InstantiationGovernanceHistorySummary,
} from './world2-workspace-instantiation-governance-types.js';

const history: World2InstantiationGovernanceAssessment[] = [];

export function resetWorld2InstantiationGovernanceHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2InstantiationGovernanceAssessment(
  assessment: World2InstantiationGovernanceAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_INSTANTIATION_GOVERNANCE_HISTORY) {
    history.shift();
  }
}

export function getWorld2InstantiationGovernanceHistorySize(): number {
  return history.length;
}

export function getLatestWorld2InstantiationGovernanceAssessment(): World2InstantiationGovernanceAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2InstantiationGovernanceHistory(): readonly World2InstantiationGovernanceAssessment[] {
  return history;
}

export function buildWorld2InstantiationGovernanceHistorySummary(
  assessments: readonly World2InstantiationGovernanceAssessment[] = history,
): World2InstantiationGovernanceHistorySummary {
  const summary: World2InstantiationGovernanceHistorySummary = {
    totalAssessments: assessments.length,
    approvedInstantiations: 0,
    restrictedInstantiations: 0,
    blockedInstantiations: 0,
    insufficientEvidenceInstantiations: 0,
    notReadyInstantiations: 0,
  };

  for (const item of assessments) {
    switch (item.approvalState) {
      case 'APPROVED':
        summary.approvedInstantiations += 1;
        break;
      case 'APPROVED_WITH_RESTRICTIONS':
        summary.restrictedInstantiations += 1;
        break;
      case 'BLOCKED':
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

export function countWorld2InstantiationApprovalState(
  state: World2InstantiationApprovalState,
  assessments: readonly World2InstantiationGovernanceAssessment[] = history,
): number {
  return assessments.filter((item) => item.approvalState === state).length;
}
