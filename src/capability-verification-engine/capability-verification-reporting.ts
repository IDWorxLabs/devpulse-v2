/**
 * Capability Verification Engine — report generation.
 */

import type {
  CapabilityDuplicateValidation,
  CapabilityReadinessEvaluation,
  CapabilityRequirementValidation,
  CapabilityRiskValidation,
  CapabilityRolloutValidation,
  CapabilityStallProtectionValidation,
  CapabilityTrustValidation,
  CapabilityVerificationDecision,
  CapabilityVerificationRecord,
  CapabilityVerificationReport,
} from './capability-verification-types.js';

let reportCounter = 0;

const DECISION_ACTIONS: Record<CapabilityVerificationDecision, string> = {
  VERIFIED: 'Capability verification passed — ready for next governance stage (no execution)',
  NEEDS_REVISION: 'Revise capability plan — missing requirements or stall protection',
  DUPLICATE_RISK: 'Do not proceed — duplicate capability detected',
  TRUST_REVIEW_REQUIRED: 'Founder or trust review required before proceeding',
  ROLLBACK_REQUIRED: 'Add rollback plan before proceeding',
  BLOCKED: 'Capability verification blocked — critical risk or duplicate',
};

export function generateCapabilityVerificationReport(
  record: CapabilityVerificationRecord,
  context: {
    requirements: CapabilityRequirementValidation;
    duplicates: CapabilityDuplicateValidation;
    risk: CapabilityRiskValidation;
    rollout: CapabilityRolloutValidation;
    trust: CapabilityTrustValidation;
    stallProtection: CapabilityStallProtectionValidation;
    readiness: CapabilityReadinessEvaluation;
  },
): CapabilityVerificationReport {
  reportCounter += 1;

  return {
    reportId: `verification-report-${reportCounter}`,
    verificationId: record.verificationId,
    decision: record.decision,
    confidence: record.confidence,
    requirements: context.requirements,
    duplicates: context.duplicates,
    risk: context.risk,
    rollout: context.rollout,
    trust: context.trust,
    stallProtection: context.stallProtection,
    readiness: context.readiness,
    recommendedAction: DECISION_ACTIONS[record.decision],
    generatedAt: Date.now(),
  };
}

export function resetCapabilityVerificationReportCounterForTests(): void {
  reportCounter = 0;
}
