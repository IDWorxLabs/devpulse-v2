/**
 * Self Evolution Governance — report generation.
 */

import type {
  GovernanceApprovalEvaluation,
  GovernanceBoundaryValidation,
  GovernanceReadinessEvaluation,
  GovernanceRiskEvaluation,
  GovernanceRollbackValidation,
  GovernanceSelfModificationValidation,
  GovernanceStallValidation,
  GovernanceTrustEvaluation,
  SelfEvolutionGovernanceDecision,
  SelfEvolutionGovernanceRecord,
  SelfEvolutionGovernanceReport,
} from './self-evolution-governance-types.js';

let reportCounter = 0;

const DECISION_ACTIONS: Record<SelfEvolutionGovernanceDecision, string> = {
  APPROVED: 'Self-evolution governance approved for research/planning/verification stage only',
  FOUNDER_REVIEW_REQUIRED: 'Founder review required before self-evolution may proceed',
  TRUST_REVIEW_REQUIRED: 'Trust review required before self-evolution may proceed',
  ROLLBACK_REVIEW_REQUIRED: 'Rollback plan review required before proceeding',
  SELF_MODIFICATION_BLOCKED: 'Self-modification blocked per Phase 21 safety law',
  BLOCKED: 'Self-evolution blocked — governance boundaries or critical risk violated',
};

export function generateGovernanceReport(
  record: SelfEvolutionGovernanceRecord,
  context: {
    boundaries: GovernanceBoundaryValidation;
    risk: GovernanceRiskEvaluation;
    trust: GovernanceTrustEvaluation;
    approval: GovernanceApprovalEvaluation;
    rollback: GovernanceRollbackValidation;
    selfModification: GovernanceSelfModificationValidation;
    stall: GovernanceStallValidation;
    readiness: GovernanceReadinessEvaluation;
  },
): SelfEvolutionGovernanceReport {
  reportCounter += 1;

  return {
    reportId: `governance-report-${reportCounter}`,
    governanceId: record.governanceId,
    decision: record.decision,
    boundaries: context.boundaries,
    risk: context.risk,
    trust: context.trust,
    approval: context.approval,
    rollback: context.rollback,
    selfModification: context.selfModification,
    stallGovernance: context.stall,
    readiness: context.readiness,
    phase21SafetyLaw: {
      researchAllowed: true,
      planningAllowed: true,
      buildPlanningAllowed: true,
      verificationAllowed: true,
      codeModificationAllowed: false,
      deploymentAllowed: false,
      selfEditingAllowed: false,
      productionChangesAllowed: false,
    },
    recommendedAction: DECISION_ACTIONS[record.decision],
    generatedAt: Date.now(),
  };
}

export function resetGovernanceReportCounterForTests(): void {
  reportCounter = 0;
}
