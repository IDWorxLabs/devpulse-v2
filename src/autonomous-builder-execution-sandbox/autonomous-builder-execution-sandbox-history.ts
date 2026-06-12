/**
 * Autonomous Builder Execution Sandbox — bounded sandbox history.
 */

import { MAX_SANDBOX_HISTORY } from './autonomous-builder-execution-sandbox-registry.js';
import type {
  SandboxEligibilityState,
  SandboxExecutionAssessment,
  SandboxExecutionHistorySummary,
} from './autonomous-builder-execution-sandbox-types.js';

const history: SandboxExecutionAssessment[] = [];

export function resetAutonomousBuilderExecutionSandboxHistoryForTests(): void {
  history.length = 0;
}

export function recordSandboxExecutionAssessment(assessment: SandboxExecutionAssessment): void {
  history.push(assessment);
  while (history.length > MAX_SANDBOX_HISTORY) {
    history.shift();
  }
}

export function getSandboxExecutionHistorySize(): number {
  return history.length;
}

export function getLatestSandboxExecutionAssessment(): SandboxExecutionAssessment | null {
  return history.at(-1) ?? null;
}

export function getSandboxExecutionHistory(): readonly SandboxExecutionAssessment[] {
  return history;
}

export function buildSandboxExecutionHistorySummary(
  assessments: readonly SandboxExecutionAssessment[] = history,
): SandboxExecutionHistorySummary {
  const summary: SandboxExecutionHistorySummary = {
    totalAssessments: assessments.length,
    eligiblePlans: 0,
    warningPlans: 0,
    blockedPlans: 0,
    insufficientEvidencePlans: 0,
    notEligiblePlans: 0,
  };

  for (const item of assessments) {
    switch (item.eligibilityState) {
      case 'ELIGIBLE':
        summary.eligiblePlans += 1;
        break;
      case 'ELIGIBLE_WITH_WARNINGS':
        summary.warningPlans += 1;
        break;
      case 'BLOCKED':
        summary.blockedPlans += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidencePlans += 1;
        break;
      case 'NOT_ELIGIBLE':
        summary.notEligiblePlans += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countSandboxEligibilityState(
  state: SandboxEligibilityState,
  assessments: readonly SandboxExecutionAssessment[] = history,
): number {
  return assessments.filter((item) => item.eligibilityState === state).length;
}
