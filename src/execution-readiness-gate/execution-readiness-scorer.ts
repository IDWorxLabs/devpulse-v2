/**
 * Execution Readiness Scorer — 0–100 execution readiness scoring (V1).
 */

import type {
  ExecutionBlockerSummary,
  ExecutionEvidenceSnapshot,
  ExecutionReadinessCategory,
  ExecutionReadinessScoreResult,
  ExecutionRiskAnalysis,
} from './execution-readiness-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapExecutionReadinessCategory(score: number): ExecutionReadinessCategory {
  if (score >= 90) return 'EXECUTION_READY';
  if (score >= 70) return 'EXECUTION_CANDIDATE';
  if (score >= 40) return 'NEEDS_WORK';
  return 'NOT_READY';
}

export function scoreExecutionReadiness(input: {
  snapshot: ExecutionEvidenceSnapshot;
  riskAnalysis: ExecutionRiskAnalysis;
  blockerSummary: ExecutionBlockerSummary;
}): ExecutionReadinessScoreResult {
  let score = input.snapshot.averageReadinessScore;

  if (input.snapshot.orchestrationProofScore != null) {
    score = score * 0.55 + input.snapshot.orchestrationProofScore * 0.45;
  }

  if (input.snapshot.founderSimulationReadinessScore != null) {
    score = score * 0.7 + input.snapshot.founderSimulationReadinessScore * 0.3;
  }

  score -= input.blockerSummary.unresolvedCriticalCount * 15;
  score -= input.blockerSummary.highCount * 5;
  score -= input.riskAnalysis.criticalRiskCount * 12;
  score -= Math.min(20, input.riskAnalysis.riskCount * 3);
  score -= Math.min(15, input.snapshot.informationLossCount * 4);
  score -= input.snapshot.readinessEscalationCount * 10;

  if (input.snapshot.planningGateDecision === 'ALLOW_FULL_PLANNING') score += 5;
  if (input.snapshot.planningGateAligned) score += 3;
  if (input.snapshot.orchestrationProofScore != null && input.snapshot.orchestrationProofScore >= 80) score += 5;

  const executionReadinessScore = clamp(score);
  const executionReadinessCategory = mapExecutionReadinessCategory(executionReadinessScore);

  return {
    readOnly: true,
    executionReadinessScore,
    executionReadinessCategory,
  };
}
