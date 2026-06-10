/**
 * Autonomous Verification — trust analysis.
 */

import type { EvidenceAnalysis, VerificationInput } from './autonomous-verification-types.js';

export function analyzeVerificationTrust(
  input: VerificationInput,
  evidence: EvidenceAnalysis,
): number {
  let trust = input.trustScore;

  if (evidence.evidenceTypes.includes('TRUST')) {
    trust += 5;
  }

  if ((input.testingConfidence ?? 0) >= 70) {
    trust = (trust + input.testingConfidence!) / 2;
  }

  if ((input.fixingConfidence ?? 0) >= 60) {
    trust = (trust + input.fixingConfidence!) / 2;
  }

  if (evidence.evidenceConfidence >= 70) {
    trust += 8;
  } else if (evidence.evidenceConfidence < 40) {
    trust -= 15;
  }

  if (input.verificationDisagreement) {
    trust -= 20;
  }

  if ((input.repeatFailures ?? 0) > 2) {
    trust -= 10;
  }

  return Math.min(100, Math.max(0, Math.round(trust)));
}
