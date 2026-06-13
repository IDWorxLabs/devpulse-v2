/**
 * Planning Brief Validator — confidence, quality, and readiness scoring (V1).
 */

import type { PlanningGateDecision } from '../planning-gate-authority/planning-gate-types.js';
import { capReadinessToGatePermission } from '../planning-gate-authority/readiness-permission-matrix.js';
import type { PlanningBrief, PlanningBriefQuality, PlanningBriefReadiness } from './planning-brief-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapPlanningBriefQuality(score: number, sectionCount: number, totalSections: number): PlanningBriefQuality {
  const coverageRatio = sectionCount / totalSections;
  if (score >= 85 && coverageRatio >= 1) return 'HIGH_CONFIDENCE';
  if (coverageRatio >= 0.85 && score >= 65) return 'COMPLETE';
  if (coverageRatio >= 0.5 || score >= 40) return 'PARTIAL';
  return 'INSUFFICIENT';
}

export function mapPlanningBriefReadiness(input: {
  gateDecision: PlanningGateDecision;
  quality: PlanningBriefQuality;
  confidence: number;
  gapCount: number;
}): PlanningBriefReadiness {
  if (input.gateDecision === 'REJECT_PLANNING') return 'NOT_READY';
  if (
    input.gateDecision === 'ALLOW_FULL_PLANNING' &&
    input.confidence >= 70 &&
    (input.quality === 'COMPLETE' || input.quality === 'HIGH_CONFIDENCE')
  ) {
    return 'PLANNING_READY';
  }
  if (input.gateDecision === 'REQUEST_CLARIFICATION' || input.gateDecision === 'ALLOW_LIMITED_PLANNING') {
    return 'DRAFT_READY';
  }
  if (input.gapCount > 3 && input.confidence < 60) return 'DRAFT_READY';
  if (input.gateDecision === 'ALLOW_FULL_PLANNING') return 'PLANNING_READY';
  return 'DRAFT_READY';
}

export function validatePlanningBrief(input: {
  brief: PlanningBrief;
  gateDecision: PlanningGateDecision;
  gateConfidence: number;
  intakeConfidence: number;
}): {
  planningBriefConfidence: number;
  planningBriefQuality: PlanningBriefQuality;
  planningBriefReadiness: PlanningBriefReadiness;
} {
  const { brief } = input;

  let sectionCount = 0;
  const totalSections = 7;
  if (brief.projectSummary.objective.length > 0) sectionCount += 1;
  if (brief.platformTargets.length > 0) sectionCount += 1;
  if (brief.screenInventory.length > 0) sectionCount += 1;
  if (brief.workflowInventory.length > 0) sectionCount += 1;
  if (brief.userRoles.length > 0) sectionCount += 1;
  if (brief.businessRules.length > 0 || brief.integrations.length > 0) sectionCount += 1;
  if (brief.evidenceSources.length > 0) sectionCount += 1;

  let confidence = input.intakeConfidence * 0.45 + input.gateConfidence * 0.35;
  confidence += (sectionCount / totalSections) * 20;
  confidence -= brief.knownGaps.filter((g) => g.category === 'UNRESOLVED_CONFLICT').length * 8;
  confidence -= brief.knownGaps.filter((g) => g.category === 'CLARIFICATION_REQUEST').length * 3;

  const planningBriefConfidence = clamp(confidence);
  const planningBriefQuality = mapPlanningBriefQuality(planningBriefConfidence, sectionCount, totalSections);
  const planningBriefReadiness = capReadinessToGatePermission(
    input.gateDecision,
    'PLANNING_BRIEF',
    mapPlanningBriefReadiness({
      gateDecision: input.gateDecision,
      quality: planningBriefQuality,
      confidence: planningBriefConfidence,
      gapCount: brief.knownGaps.length,
    }),
  );

  return { planningBriefConfidence, planningBriefQuality, planningBriefReadiness };
}

export function isPlanningBriefStructurallyValid(brief: PlanningBrief): boolean {
  return (
    brief.briefId.length > 0 &&
    brief.projectSummary.productType.length > 0 &&
    brief.evidenceSources.length > 0 &&
    brief.planningBriefConfidence >= 0 &&
    brief.planningBriefConfidence <= 100
  );
}
