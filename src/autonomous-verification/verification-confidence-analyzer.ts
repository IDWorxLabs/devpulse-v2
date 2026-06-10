/**
 * Autonomous Verification — confidence analysis.
 */

import type { EvidenceAnalysis, VerificationInput } from './autonomous-verification-types.js';

export function analyzeVerificationConfidence(
  input: VerificationInput,
  evidence: EvidenceAnalysis,
  trustScore: number,
  riskScore: number,
): number {
  let confidence = evidence.evidenceConfidence;

  confidence = (confidence + trustScore) / 2;

  if ((input.verificationConfidence ?? 0) >= 60) {
    confidence = (confidence + input.verificationConfidence!) / 2;
  }

  if (input.testResultStatus === 'SIMULATED_PASS') {
    confidence += 10;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    confidence -= 15;
  }

  if (input.fixReadiness === 'READY' && (input.fixingConfidence ?? 0) >= 60) {
    confidence += 8;
  }

  confidence -= riskScore * 0.2;

  if (input.testingCoverageSufficient === false) {
    confidence -= 12;
  }

  return Math.min(100, Math.max(0, Math.round(confidence)));
}
