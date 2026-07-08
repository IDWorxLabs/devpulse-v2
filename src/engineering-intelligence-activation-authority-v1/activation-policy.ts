/**
 * Engineering Intelligence Activation Authority V1 — activation policy.
 *
 * The eight checks that must ALL pass before autonomous capability generation may ever be
 * considered. Every check is a pure, deterministic function of the evidence — nothing here reads
 * a clock, a random number, or any product-specific signal.
 */

import {
  EIAA_DEFAULT_POLICY_CONFIG,
  EIAA_POLICY_CHECK_IDS,
} from './engineering-intelligence-activation-types.js';
import type {
  EiaaActivationEvidence,
  EiaaActivationPolicyConfig,
  EiaaPolicyCheckId,
  EiaaPolicyCheckResult,
} from './engineering-intelligence-activation-types.js';

function checkMissingCapabilityPositivelyIdentified(evidence: EiaaActivationEvidence): EiaaPolicyCheckResult {
  const passed = Boolean(evidence.missingCapabilityId) && Boolean(evidence.missingCapabilityName);
  return {
    readOnly: true,
    checkId: 'MISSING_CAPABILITY_POSITIVELY_IDENTIFIED',
    passed,
    detail: passed
      ? `Missing capability positively identified: ${evidence.missingCapabilityId}.`
      : 'No missing capability has been positively identified.',
  };
}

function checkExistingRepairCapabilitiesInsufficient(evidence: EiaaActivationEvidence): EiaaPolicyCheckResult {
  const allEvaluatedRejected = evidence.existingCapabilitiesEvaluated.every((id) =>
    evidence.capabilitiesRejected.some((r) => r.capabilityId === id),
  );
  return {
    readOnly: true,
    checkId: 'EXISTING_REPAIR_CAPABILITIES_INSUFFICIENT',
    passed: allEvaluatedRejected,
    detail: allEvaluatedRejected
      ? `All ${evidence.existingCapabilitiesEvaluated.length} evaluated repair capability(ies) were rejected as insufficient.`
      : `${evidence.existingCapabilitiesEvaluated.length - evidence.capabilitiesRejected.length} evaluated repair capability(ies) remain viable — existing repair has not been ruled out.`,
  };
}

function checkFailureConfidenceAboveThreshold(
  evidence: EiaaActivationEvidence,
  config: EiaaActivationPolicyConfig,
): EiaaPolicyCheckResult {
  const passed = evidence.confidence >= config.confidenceThreshold;
  return {
    readOnly: true,
    checkId: 'FAILURE_CONFIDENCE_ABOVE_THRESHOLD',
    passed,
    detail: `Confidence ${evidence.confidence} ${passed ? '>=' : '<'} threshold ${config.confidenceThreshold}.`,
  };
}

function checkFailureIsDeterministic(evidence: EiaaActivationEvidence): EiaaPolicyCheckResult {
  return {
    readOnly: true,
    checkId: 'FAILURE_IS_DETERMINISTIC',
    passed: evidence.isDeterministicFailure,
    detail: evidence.isDeterministicFailure
      ? 'Failure evidence is deterministic — the same input reproduces the same failure.'
      : 'Failure evidence is not confirmed deterministic — generating a capability for a non-reproducible failure is unsafe.',
  };
}

function checkRetryAttemptsExhausted(evidence: EiaaActivationEvidence): EiaaPolicyCheckResult {
  return {
    readOnly: true,
    checkId: 'RETRY_ATTEMPTS_EXHAUSTED',
    passed: evidence.repairsExhausted,
    detail: evidence.repairsExhausted
      ? `Retry/repair attempts exhausted after ${evidence.repairAttempts} attempt(s).`
      : `Retry/repair attempts are not exhausted yet (${evidence.repairAttempts} attempt(s) so far) — a pending repair path still exists.`,
  };
}

function checkCapabilityRequestWellDefined(evidence: EiaaActivationEvidence): EiaaPolicyCheckResult {
  const passed = evidence.requiredInputs.length > 0 && evidence.requiredOutputs.length > 0;
  return {
    readOnly: true,
    checkId: 'CAPABILITY_REQUEST_WELL_DEFINED',
    passed,
    detail: passed
      ? `Capability request declares ${evidence.requiredInputs.length} required input(s) and ${evidence.requiredOutputs.length} required output(s).`
      : 'Capability request is not well-defined — required inputs and/or outputs are missing.',
  };
}

function checkTargetIntegrationPointKnown(evidence: EiaaActivationEvidence): EiaaPolicyCheckResult {
  const passed = Boolean(evidence.expectedIntegrationPoint && evidence.expectedIntegrationPoint.trim().length > 0);
  return {
    readOnly: true,
    checkId: 'TARGET_INTEGRATION_POINT_KNOWN',
    passed,
    detail: passed
      ? `Target integration point known: ${evidence.expectedIntegrationPoint}.`
      : 'Target integration point for the generated capability is unknown.',
  };
}

function checkValidationStrategyExists(evidence: EiaaActivationEvidence): EiaaPolicyCheckResult {
  const passed = evidence.validationPlan.length > 0;
  return {
    readOnly: true,
    checkId: 'VALIDATION_STRATEGY_EXISTS',
    passed,
    detail: passed
      ? `Validation strategy declared (${evidence.validationPlan.length} item(s)).`
      : 'No validation strategy exists for the capability that would be generated.',
  };
}

const CHECK_FUNCTIONS: Record<
  EiaaPolicyCheckId,
  (evidence: EiaaActivationEvidence, config: EiaaActivationPolicyConfig) => EiaaPolicyCheckResult
> = {
  MISSING_CAPABILITY_POSITIVELY_IDENTIFIED: checkMissingCapabilityPositivelyIdentified,
  EXISTING_REPAIR_CAPABILITIES_INSUFFICIENT: checkExistingRepairCapabilitiesInsufficient,
  FAILURE_CONFIDENCE_ABOVE_THRESHOLD: checkFailureConfidenceAboveThreshold,
  FAILURE_IS_DETERMINISTIC: checkFailureIsDeterministic,
  RETRY_ATTEMPTS_EXHAUSTED: checkRetryAttemptsExhausted,
  CAPABILITY_REQUEST_WELL_DEFINED: checkCapabilityRequestWellDefined,
  TARGET_INTEGRATION_POINT_KNOWN: checkTargetIntegrationPointKnown,
  VALIDATION_STRATEGY_EXISTS: checkValidationStrategyExists,
};

export interface EiaaPolicyEvaluationResult {
  readOnly: true;
  checks: EiaaPolicyCheckResult[];
  satisfiedChecks: EiaaPolicyCheckResult[];
  failedChecks: EiaaPolicyCheckResult[];
  allSatisfied: boolean;
}

/** Evaluate every policy check deterministically, in a fixed order, against the given evidence. */
export function evaluateActivationPolicy(
  evidence: EiaaActivationEvidence,
  config: EiaaActivationPolicyConfig = EIAA_DEFAULT_POLICY_CONFIG,
): EiaaPolicyEvaluationResult {
  const checks = EIAA_POLICY_CHECK_IDS.map((id) => CHECK_FUNCTIONS[id](evidence, config));
  const satisfiedChecks = checks.filter((c) => c.passed);
  const failedChecks = checks.filter((c) => !c.passed);
  return {
    readOnly: true,
    checks,
    satisfiedChecks,
    failedChecks,
    allSatisfied: failedChecks.length === 0,
  };
}
