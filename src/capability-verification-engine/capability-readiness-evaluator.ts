/**
 * Capability Verification Engine — readiness evaluator.
 */

import type {
  CapabilityDuplicateValidation,
  CapabilityReadinessEvaluation,
  CapabilityRequirementValidation,
  CapabilityRiskValidation,
  CapabilityRolloutValidation,
  CapabilityStallProtectionValidation,
  CapabilityTrustValidation,
  CapabilityVerificationInput,
} from './capability-verification-types.js';
import { getCachedReadinessEvaluation, setCachedReadinessEvaluation } from './capability-verification-cache.js';

let readinessEvaluationCount = 0;

/** Stall & progress protection — integrates with Phase 21.1 Missing Capability Escalation. */
export function validateCapabilityStallProtection(input: CapabilityVerificationInput): CapabilityStallProtectionValidation {
  const progressMonitoringPresent = input.hasProgressMonitoring === true
    || (input.signals ?? []).includes('progress:monitoring')
    || (input.integrationPoints ?? []).includes('missing_capability_escalation');

  const stallHandlingPresent = input.hasStallHandling === true
    || (input.signals ?? []).includes('stall:handling')
    || (input.integrationPoints ?? []).includes('missing_capability_escalation');

  const bottleneckHandlingPresent = input.hasBottleneckRecovery === true
    || (input.signals ?? []).includes('bottleneck:recovery')
    || (input.integrationPoints ?? []).includes('missing_capability_escalation');

  const escalationIntegrated = (input.integrationPoints ?? []).includes('missing_capability_escalation')
    || (input.signals ?? []).includes('escalation:integrated');

  const complete = progressMonitoringPresent && stallHandlingPresent && bottleneckHandlingPresent;

  return {
    progressMonitoringPresent,
    stallHandlingPresent,
    bottleneckHandlingPresent,
    escalationIntegrated,
    complete,
  };
}

export function evaluateCapabilityReadiness(
  input: CapabilityVerificationInput,
  requirements: CapabilityRequirementValidation,
  duplicates: CapabilityDuplicateValidation,
  risk: CapabilityRiskValidation,
  rollout: CapabilityRolloutValidation,
  trust: CapabilityTrustValidation,
  stallProtection: CapabilityStallProtectionValidation,
): CapabilityReadinessEvaluation {
  const cacheKey = [
    input.proposedCapability,
    requirements.complete,
    duplicates.isDuplicate,
    risk.riskLevel,
    rollout.valid,
    trust.requiresReview,
    stallProtection.complete,
  ].join('|');

  const cached = getCachedReadinessEvaluation(cacheKey);
  if (cached) return cached;

  readinessEvaluationCount += 1;

  const reasons: string[] = [];
  let state: CapabilityReadinessEvaluation['state'] = 'READY';
  let canProceed = true;

  if (duplicates.isDuplicate) {
    state = 'BLOCKED';
    canProceed = false;
    reasons.push('duplicate_capability');
  } else if (risk.riskLevel === 'CRITICAL') {
    state = 'BLOCKED';
    canProceed = false;
    reasons.push('critical_risk');
  } else if (!requirements.complete || !stallProtection.complete) {
    state = 'NOT_READY';
    canProceed = false;
    if (!requirements.complete) reasons.push('incomplete_requirements');
    if (!stallProtection.complete) reasons.push('missing_stall_protection');
  } else if (trust.requiresReview || risk.riskLevel === 'HIGH' || !rollout.valid) {
    state = 'REQUIRES_REVIEW';
    canProceed = false;
    if (trust.requiresReview) reasons.push('trust_review');
    if (risk.riskLevel === 'HIGH') reasons.push('high_risk');
    if (!rollout.valid) reasons.push('invalid_rollout');
  }

  const result: CapabilityReadinessEvaluation = { state, canProceed, reasons };
  setCachedReadinessEvaluation(cacheKey, result);
  return result;
}

export function getReadinessEvaluationCount(): number {
  return readinessEvaluationCount;
}

export function resetReadinessEvaluatorForTests(): void {
  readinessEvaluationCount = 0;
}
