/**
 * Execution Proof Evolution — bounded proof history and summary counters.
 */

import { emptyVerdictDistribution, MAX_EXECUTION_PROOF_HISTORY } from './execution-proof-registry.js';
import type {
  ExecutionProofAssessment,
  ExecutionProofHistorySummary,
  ExecutionProofVerdict,
} from './execution-proof-types.js';

const history: ExecutionProofAssessment[] = [];

export function resetExecutionProofHistoryForTests(): void {
  history.length = 0;
}

export function recordExecutionProofAssessment(assessment: ExecutionProofAssessment): void {
  history.push(assessment);
  while (history.length > MAX_EXECUTION_PROOF_HISTORY) {
    history.shift();
  }
}

export function getExecutionProofHistorySize(): number {
  return history.length;
}

export function getLatestExecutionProofAssessment(): ExecutionProofAssessment | null {
  return history.at(-1) ?? null;
}

export function getExecutionProofHistory(): readonly ExecutionProofAssessment[] {
  return history;
}

export function countPriorUnprovenAttemptsForProblem(problemId: string): number {
  return history.filter(
    (item) =>
      item.problem.problemId === problemId &&
      item.verdict !== 'PROVEN_FIXED' &&
      item.verdict !== 'PARTIALLY_PROVEN',
  ).length;
}

export function buildExecutionProofHistorySummary(
  assessments: readonly ExecutionProofAssessment[] = history,
): ExecutionProofHistorySummary {
  const summary: ExecutionProofHistorySummary = {
    totalProofAttempts: assessments.length,
    provenFixes: 0,
    partialFixes: 0,
    regressions: 0,
    loopRisks: 0,
    insufficientEvidenceCount: 0,
  };

  for (const item of assessments) {
    switch (item.verdict) {
      case 'PROVEN_FIXED':
        summary.provenFixes += 1;
        break;
      case 'PARTIALLY_PROVEN':
        summary.partialFixes += 1;
        break;
      case 'REGRESSION_DETECTED':
        summary.regressions += 1;
        break;
      case 'LOOP_RISK':
        summary.loopRisks += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceCount += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function buildVerdictDistribution(
  assessments: readonly ExecutionProofAssessment[] = history,
): Record<ExecutionProofVerdict, number> {
  const distribution = emptyVerdictDistribution();
  for (const item of assessments) {
    distribution[item.verdict] += 1;
  }
  return distribution;
}
