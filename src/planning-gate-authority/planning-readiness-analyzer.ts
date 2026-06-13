/**
 * Planning Readiness Analyzer — planning readiness scoring (V1).
 */

import type {
  EvidenceSufficiencyResult,
  PlanningGateEvidenceSnapshot,
  PlanningReadinessCategory,
  PlanningReadinessResult,
  PlanningRiskAnalysis,
} from './planning-gate-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapPlanningReadinessCategory(score: number): PlanningReadinessCategory {
  if (score >= 90) return 'READY_FOR_PLANNING';
  if (score >= 70) return 'READY_WITH_GAPS';
  if (score >= 40) return 'NEEDS_CLARIFICATION';
  return 'NOT_READY';
}

export function analyzePlanningReadiness(input: {
  snapshot: PlanningGateEvidenceSnapshot;
  evidenceSufficiency: EvidenceSufficiencyResult;
  planningRiskAnalysis: PlanningRiskAnalysis;
}): PlanningReadinessResult {
  let score = input.evidenceSufficiency.evidenceSufficiencyScore * 0.55;
  score += input.snapshot.intakeReadinessScore * 0.25;
  score += (input.snapshot.completenessScore ?? input.snapshot.intakeReadinessScore) * 0.2;

  score -= input.planningRiskAnalysis.risks.filter((r) => r.severity === 'CRITICAL').length * 12;
  score -= input.planningRiskAnalysis.risks.filter((r) => r.severity === 'HIGH').length * 6;
  score -= input.snapshot.conflictCount * 5;

  if (input.snapshot.sources.length >= 4) score += 4;

  const planningReadinessScore = clamp(score);
  return {
    readOnly: true,
    planningReadinessScore,
    planningReadinessCategory: mapPlanningReadinessCategory(planningReadinessScore),
  };
}
