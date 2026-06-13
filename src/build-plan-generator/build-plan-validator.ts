/**
 * Build Plan Validator — complexity, confidence, and readiness scoring (V1).
 */

import type {
  ArchitectureBriefReadiness,
} from '../architecture-brief-generator/architecture-brief-types.js';
import type { PlanningGateDecision } from '../planning-gate-authority/planning-gate-types.js';
import { capReadinessToGatePermission } from '../planning-gate-authority/readiness-permission-matrix.js';
import type {
  BuildComplexityCategory,
  BuildPlan,
  BuildPlanReadiness,
} from './build-plan-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapBuildComplexityCategory(score: number): BuildComplexityCategory {
  if (score >= 80) return 'EXTREME';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export function computeBuildComplexityScore(plan: Pick<BuildPlan, 'milestones' | 'phases' | 'buildPlanRisks' | 'projectSummary'>): number {
  let score = plan.phases.length * 8;
  score += plan.milestones.length * 5;
  score += plan.buildPlanRisks.length * 6;
  if (plan.projectSummary.complexity === 'HIGH') score += 15;
  if (plan.projectSummary.complexity === 'EXTREME') score += 25;
  return clamp(score);
}

export function mapBuildPlanReadiness(input: {
  architectureReadiness: ArchitectureBriefReadiness | string;
  confidence: number;
  riskCount: number;
  criticalDependencyCount: number;
}): BuildPlanReadiness {
  if (input.architectureReadiness === 'NOT_READY') return 'NOT_READY';
  if (
    input.architectureReadiness === 'ARCHITECTURE_READY' &&
    input.confidence >= 70 &&
    input.riskCount <= 3
  ) {
    return 'READY_FOR_EXECUTION_PLANNING';
  }
  if (
    input.architectureReadiness === 'ARCHITECTURE_DRAFT_READY' ||
    input.riskCount > 3 ||
    input.criticalDependencyCount > 2
  ) {
    return 'DRAFT_BUILD_PLAN';
  }
  if (input.architectureReadiness === 'ARCHITECTURE_READY') return 'READY_FOR_EXECUTION_PLANNING';
  return 'DRAFT_BUILD_PLAN';
}

export function validateBuildPlan(input: {
  plan: BuildPlan;
  architectureReadiness: ArchitectureBriefReadiness | string;
  architectureConfidence: number;
  gateDecision?: PlanningGateDecision | null;
}): {
  buildComplexityScore: number;
  buildComplexityCategory: BuildComplexityCategory;
  buildPlanConfidence: number;
  buildPlanReadiness: BuildPlanReadiness;
} {
  const buildComplexityScore = computeBuildComplexityScore(input.plan);
  const buildComplexityCategory = mapBuildComplexityCategory(buildComplexityScore);

  let confidence = input.architectureConfidence * 0.5;
  confidence += (input.plan.phases.length / 7) * 25;
  confidence += (input.plan.milestones.length / 7) * 15;
  confidence -= input.plan.buildPlanRisks.length * 3;
  confidence -= input.plan.dependencyMap.blockedPhases.length * 3;

  const buildPlanConfidence = clamp(confidence);
  const buildPlanReadiness = input.gateDecision
    ? capReadinessToGatePermission(
        input.gateDecision,
        'BUILD_PLAN',
        mapBuildPlanReadiness({
          architectureReadiness: input.architectureReadiness,
          confidence: buildPlanConfidence,
          riskCount: input.plan.buildPlanRisks.length,
          criticalDependencyCount: input.plan.dependencyMap.criticalDependencies.length,
        }),
      )
    : mapBuildPlanReadiness({
        architectureReadiness: input.architectureReadiness,
        confidence: buildPlanConfidence,
        riskCount: input.plan.buildPlanRisks.length,
        criticalDependencyCount: input.plan.dependencyMap.criticalDependencies.length,
      });

  return { buildComplexityScore, buildComplexityCategory, buildPlanConfidence, buildPlanReadiness };
}

export function isBuildPlanStructurallyValid(plan: BuildPlan): boolean {
  return (
    plan.planId.length > 0 &&
    plan.architectureBriefId.length > 0 &&
    plan.phases.length > 0 &&
    plan.milestones.length > 0 &&
    plan.buildPlanConfidence >= 0 &&
    plan.buildPlanConfidence <= 100
  );
}
