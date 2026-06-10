/**
 * Capability Planning Engine — approval planner.
 */

import type {
  CapabilityApprovalPlan,
  CapabilityApprovalRequirement,
  CapabilityImpactAnalysis,
  CapabilityPlanningInput,
  CapabilityRiskAnalysis,
} from './capability-planning-types.js';

let approvalDecisionCount = 0;

export function determineCapabilityApproval(
  input: CapabilityPlanningInput,
  impact: CapabilityImpactAnalysis,
  risk: CapabilityRiskAnalysis,
): CapabilityApprovalPlan {
  approvalDecisionCount += 1;

  const reasons: string[] = [];
  let requirement: CapabilityApprovalRequirement = 'NONE';

  if (risk.riskScore >= 70 || risk.riskLevel === 'HIGH') {
    requirement = 'HIGH_RISK_REVIEW';
    reasons.push('high_risk_score');
  } else if (
    input.trustImpact
    || impact.affectedSystems.includes('Trust')
    || input.world2Impact
    || impact.affectedSystems.includes('World2')
  ) {
    requirement = 'FOUNDER_REVIEW';
    if (input.trustImpact || impact.affectedSystems.includes('Trust')) reasons.push('trust_impact');
    if (input.world2Impact || impact.affectedSystems.includes('World2')) reasons.push('world2_impact');
  } else if (risk.riskLevel === 'MEDIUM') {
    requirement = 'FOUNDER_REVIEW';
    reasons.push('medium_risk_precaution');
  }

  return { requirement, reasons };
}

export function getApprovalDecisionCount(): number {
  return approvalDecisionCount;
}

export function resetApprovalPlannerForTests(): void {
  approvalDecisionCount = 0;
}
