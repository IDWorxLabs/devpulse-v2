/**
 * Multi Project Verification — confidence analysis.
 */

import type { ProjectVerificationEvidence, ProjectVerificationInput } from './multi-project-verification-types.js';
import { getCachedConfidence, setCachedConfidence } from './project-verification-cache.js';

export function calculateProjectVerificationConfidence(
  input: ProjectVerificationInput,
  evidence: ProjectVerificationEvidence,
): number {
  const cached = getCachedConfidence(input.projectId);
  if (cached !== undefined) return cached;

  let confidence = evidence.evidenceQualityScore;

  if ((input.trustScore ?? 0) > 0) {
    confidence = (confidence + input.trustScore!) / 2;
  }

  if ((input.verificationConfidence ?? 0) >= 55) {
    confidence = (confidence + input.verificationConfidence!) / 2;
  }

  if ((input.testingConfidence ?? 0) >= 55) {
    confidence = (confidence + input.testingConfidence!) / 2;
  }

  if ((input.fixingConfidence ?? 0) >= 50) {
    confidence = (confidence + input.fixingConfidence!) / 2;
  }

  if ((input.completionConfidence ?? 0) >= 50) {
    confidence = (confidence + input.completionConfidence!) / 2;
  }

  if (input.testResultStatus === 'SIMULATED_PASS') {
    confidence += 8;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    confidence -= 15;
  }

  if (input.verificationDecision === 'VERIFIED') {
    confidence += 10;
  }

  if (input.orchestrationReady) {
    confidence += 5;
  }

  const result = Math.min(100, Math.max(0, Math.round(confidence)));
  setCachedConfidence(input.projectId, result);
  return result;
}
