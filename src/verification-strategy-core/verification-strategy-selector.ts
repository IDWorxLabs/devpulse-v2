/**
 * Verification Strategy Core — strategy selection rules.
 */

import type {
  VerificationStrategy,
  VerificationStrategyDecision,
  VerificationStrategyInput,
} from './verification-strategy-types.js';
import {
  getExpectedValidatorsForStrategy,
  getMinimumConfidenceForStrategy,
} from './verification-strategy-registry.js';
import { evaluateVerificationRequirements } from './verification-requirement-evaluator.js';
import { calculateVerificationConfidence } from './verification-confidence-policy.js';
import { shouldEscalateVerification } from './verification-escalation-policy.js';

function isMinimalCandidate(input: VerificationStrategyInput): boolean {
  return (
    input.taskType === 'READ_ONLY' ||
    input.taskType === 'DOCUMENTATION' ||
    input.taskType === 'PLANNING' ||
    input.taskType === 'SUMMARY' ||
    (input.executionMode === 'NONE' && input.changeScope === 'TINY')
  );
}

function isStandardCandidate(input: VerificationStrategyInput): boolean {
  return (
    input.taskType === 'FEATURE' ||
    input.taskType === 'CODE_CHANGE' ||
    input.taskType === 'UI_CHANGE' ||
    input.taskType === 'UNKNOWN'
  );
}

function isDeepCandidate(input: VerificationStrategyInput): boolean {
  return (
    input.taskType === 'ARCHITECTURE' ||
    input.taskType === 'INFRASTRUCTURE' ||
    input.taskType === 'BRAIN' ||
    input.taskType === 'ROUTING' ||
    input.taskType === 'DATA_MODEL' ||
    input.brainChanged ||
    input.routingChanged ||
    input.dataModelChanged ||
    input.changeScope === 'MAJOR' ||
    input.changeScope === 'LARGE'
  );
}

function isReleaseCandidate(input: VerificationStrategyInput): boolean {
  return input.taskType === 'RELEASE' || input.releaseReady === true;
}

function isCloudCandidate(input: VerificationStrategyInput): boolean {
  return (
    input.cloudRuntimeTouched ||
    input.executionMode === 'CLOUD' ||
    input.executionMode === 'REMOTE' ||
    input.executionMode === 'API' ||
    input.taskType === 'CLOUD'
  );
}

function isWorld2Candidate(input: VerificationStrategyInput): boolean {
  return (
    input.world2ExecutionActive ||
    input.executionMode === 'WORLD2' ||
    input.executionMode === 'AUTONOMOUS' ||
    input.taskType === 'WORLD2' ||
    input.taskType === 'AUTONOMOUS' ||
    input.taskType === 'BUILDER'
  );
}

function isTrustRecoveryCandidate(input: VerificationStrategyInput): boolean {
  return (
    input.trustScore < 50 ||
    input.repeatFailuresDetected === true ||
    input.verificationDisagreement === true ||
    (input.historicalFailures ?? 0) >= 3 ||
    input.riskLevel === 'CRITICAL'
  );
}

export function pickVerificationStrategy(input: VerificationStrategyInput): {
  strategy: VerificationStrategy;
  reason: string[];
} {
  const reason: string[] = [];

  if (isTrustRecoveryCandidate(input)) {
    reason.push('Trust recovery required — low trust, repeated failures, or verification disagreement');
    return { strategy: 'TRUST_RECOVERY', reason };
  }

  if (isWorld2Candidate(input)) {
    reason.push('World 2 or autonomous execution involved');
    return { strategy: 'WORLD2', reason };
  }

  if (isCloudCandidate(input)) {
    reason.push('Cloud, worker, remote, or API execution touched');
    return { strategy: 'CLOUD', reason };
  }

  if (isReleaseCandidate(input)) {
    reason.push('Release-ready or production packaging candidate');
    return { strategy: 'RELEASE', reason };
  }

  if (isDeepCandidate(input)) {
    reason.push('Major architecture, infrastructure, brain, routing, or data model change');
    return { strategy: 'DEEP', reason };
  }

  if (isMinimalCandidate(input)) {
    reason.push('Small read-only, documentation, planning, or summary operation');
    return { strategy: 'MINIMAL', reason };
  }

  if (isStandardCandidate(input)) {
    reason.push('Normal feature, code, or UI work');
    return { strategy: 'STANDARD', reason };
  }

  reason.push('Defaulting to STANDARD verification strategy');
  return { strategy: 'STANDARD', reason };
}

export function selectVerificationStrategy(
  input: VerificationStrategyInput,
): VerificationStrategyDecision {
  const requirements = evaluateVerificationRequirements(input);
  const confidence = calculateVerificationConfidence(input);
  const { strategy, reason } = pickVerificationStrategy(input);
  const escalationRequired = shouldEscalateVerification(input, confidence, strategy);

  const registryValidators = getExpectedValidatorsForStrategy(strategy);
  const requiredValidators = [
    ...new Set([...requirements.requiredValidators, ...registryValidators]),
  ];
  const optionalValidators = requirements.optionalValidators.filter(
    (v) => !requiredValidators.includes(v),
  );

  if (escalationRequired && strategy !== 'TRUST_RECOVERY') {
    reason.push('Escalation required — confidence or trust below threshold');
  }

  const minConfidence = getMinimumConfidenceForStrategy(strategy);
  if (confidence < minConfidence) {
    reason.push(`Confidence ${confidence} below strategy minimum ${minConfidence}`);
  }

  return {
    strategy,
    confidence,
    escalationRequired,
    reason,
    requiredValidators,
    optionalValidators,
    generatedAt: Date.now(),
  };
}
