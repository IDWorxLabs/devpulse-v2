/**
 * Self Evolution Governance — approval evaluator.
 */

import type {
  GovernanceApprovalEvaluation,
  GovernanceRiskEvaluation,
  SelfEvolutionGovernanceDecision,
  SelfEvolutionGovernanceInput,
} from './self-evolution-governance-types.js';

let approvalReviewCount = 0;

export function evaluateGovernanceApproval(
  input: SelfEvolutionGovernanceInput,
  risk: GovernanceRiskEvaluation,
): GovernanceApprovalEvaluation {
  approvalReviewCount += 1;

  const reasons: string[] = [];
  let requirement: GovernanceApprovalEvaluation['requirement'] = 'APPROVED';

  if (input.world2Impact || risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL') {
    requirement = 'FOUNDER_REVIEW_REQUIRED';
    if (input.world2Impact) reasons.push('world2_impact');
    if (risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL') reasons.push('high_risk');
  } else if (input.trustImpact) {
    requirement = 'TRUST_REVIEW_REQUIRED';
    reasons.push('trust_impact');
  }

  return { requirement, reasons };
}

export function getApprovalReviewCount(): number {
  return approvalReviewCount;
}

export function resetApprovalEvaluatorForTests(): void {
  approvalReviewCount = 0;
}
