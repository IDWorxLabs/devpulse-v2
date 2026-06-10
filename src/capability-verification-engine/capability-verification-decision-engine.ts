/**
 * Capability Verification Engine — decision pipeline.
 */

import type {
  CapabilityVerificationDecision,
  CapabilityVerificationInput,
  CapabilityVerificationRecord,
  CapabilityVerificationResult,
} from './capability-verification-types.js';
import { validateCapabilityRequirements } from './capability-requirement-validator.js';
import { validateCapabilityDuplicates } from './capability-duplicate-validator.js';
import { validateCapabilityRisk } from './capability-risk-validator.js';
import { validateCapabilityRollout } from './capability-rollout-validator.js';
import { validateCapabilityTrust } from './capability-trust-validator.js';
import { evaluateCapabilityReadiness, validateCapabilityStallProtection } from './capability-readiness-evaluator.js';
import { registerCapabilityVerification } from './capability-verification-registry.js';
import { generateCapabilityVerificationReport } from './capability-verification-reporting.js';
import { recordCapabilityVerificationHistory } from './capability-verification-history.js';

let verificationCounter = 0;
let verificationDecisionCount = 0;

export function buildCapabilityVerificationDecision(input: CapabilityVerificationInput): CapabilityVerificationResult {
  const requirements = validateCapabilityRequirements(input);
  const duplicates = validateCapabilityDuplicates(input);
  const risk = validateCapabilityRisk(input);
  const rollout = validateCapabilityRollout(input);
  const trust = validateCapabilityTrust(input);
  const stallProtection = validateCapabilityStallProtection(input);
  const readiness = evaluateCapabilityReadiness(input, requirements, duplicates, risk, rollout, trust, stallProtection);

  let decision: CapabilityVerificationDecision = 'VERIFIED';

  if (duplicates.isDuplicate) {
    decision = 'DUPLICATE_RISK';
  } else if (risk.riskLevel === 'CRITICAL' || input.signals?.includes('blocked:true')) {
    decision = 'BLOCKED';
  } else if (rollout.missingRollback && !rollout.valid) {
    decision = 'ROLLBACK_REQUIRED';
  } else if (trust.requiresReview) {
    decision = 'TRUST_REVIEW_REQUIRED';
  } else if (!requirements.complete || !stallProtection.complete) {
    decision = 'NEEDS_REVISION';
  } else if (readiness.state === 'REQUIRES_REVIEW') {
    decision = 'TRUST_REVIEW_REQUIRED';
  } else if (readiness.state === 'NOT_READY') {
    decision = 'NEEDS_REVISION';
  } else if (readiness.state === 'BLOCKED') {
    decision = 'BLOCKED';
  }

  verificationCounter += 1;
  verificationDecisionCount += 1;

  const confidence = Math.round(
    (requirements.coverageScore + trust.trustScore + (100 - duplicates.duplicateScore)) / 3,
  );

  const record: CapabilityVerificationRecord = {
    verificationId: `verification-${verificationCounter}`,
    decision,
    confidence,
    duplicateRisk: duplicates.duplicateScore,
    trustScore: trust.trustScore,
    createdAt: Date.now(),
  };

  registerCapabilityVerification(record);
  const report = generateCapabilityVerificationReport(record, {
    requirements,
    duplicates,
    risk,
    rollout,
    trust,
    stallProtection,
    readiness,
  });
  recordCapabilityVerificationHistory(record, readiness);

  return { record, report };
}

export function getVerificationDecisionCount(): number {
  return verificationDecisionCount;
}

export function resetVerificationDecisionEngineForTests(): void {
  verificationCounter = 0;
  verificationDecisionCount = 0;
}
