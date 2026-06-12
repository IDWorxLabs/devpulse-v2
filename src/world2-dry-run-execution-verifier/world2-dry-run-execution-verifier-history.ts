/**
 * World 2 Dry-Run Execution Verifier — bounded assessment history.
 */

import { MAX_DRY_RUN_VERIFIER_HISTORY } from './world2-dry-run-execution-verifier-registry.js';
import type {
  World2DryRunExecutionVerificationAssessment,
  World2DryRunExecutionVerifierHistorySummary,
  World2DryRunVerificationState,
} from './world2-dry-run-execution-verifier-types.js';

const history: World2DryRunExecutionVerificationAssessment[] = [];

export function resetWorld2DryRunExecutionVerifierHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2DryRunExecutionVerifierAssessment(
  assessment: World2DryRunExecutionVerificationAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_DRY_RUN_VERIFIER_HISTORY) {
    history.shift();
  }
}

export function getWorld2DryRunExecutionVerifierHistorySize(): number {
  return history.length;
}

export function getLatestWorld2DryRunExecutionVerifierAssessment(): World2DryRunExecutionVerificationAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2DryRunExecutionVerifierHistory(): readonly World2DryRunExecutionVerificationAssessment[] {
  return history;
}

export function buildWorld2DryRunExecutionVerifierHistorySummary(
  assessments: readonly World2DryRunExecutionVerificationAssessment[] = history,
): World2DryRunExecutionVerifierHistorySummary {
  const summary: World2DryRunExecutionVerifierHistorySummary = {
    totalAssessments: assessments.length,
    verifiedAssessments: 0,
    verifiedWithWarningsAssessments: 0,
    failedAssessments: 0,
    insufficientEvidenceAssessments: 0,
    notReadyAssessments: 0,
  };

  for (const item of assessments) {
    switch (item.verificationState) {
      case 'VERIFIED':
        summary.verifiedAssessments += 1;
        break;
      case 'VERIFIED_WITH_WARNINGS':
        summary.verifiedWithWarningsAssessments += 1;
        break;
      case 'FAILED':
        summary.failedAssessments += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceAssessments += 1;
        break;
      case 'NOT_READY':
        summary.notReadyAssessments += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2DryRunVerificationState(
  state: World2DryRunVerificationState,
  assessments: readonly World2DryRunExecutionVerificationAssessment[] = history,
): number {
  return assessments.filter((item) => item.verificationState === state).length;
}
