/**
 * Autonomous Completion Engine — completion confidence analysis.
 */

import type { CompletionEvidenceAnalysis, CompletionInput } from './autonomous-completion-engine-types.js';

export function analyzeCompletionConfidence(
  input: CompletionInput,
  evidence: CompletionEvidenceAnalysis,
  riskScore: number,
): number {
  let confidence = evidence.evidenceQualityScore;

  confidence = (confidence + input.trustScore) / 2;

  if ((input.verificationConfidence ?? 0) >= 60) {
    confidence = (confidence + input.verificationConfidence!) / 2;
  }

  if ((input.testingConfidence ?? 0) >= 60) {
    confidence = (confidence + input.testingConfidence!) / 2;
  }

  if ((input.fixingConfidence ?? 0) >= 55) {
    confidence = (confidence + input.fixingConfidence!) / 2;
  }

  if (input.testResultStatus === 'SIMULATED_PASS') {
    confidence += 8;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    confidence -= 12;
  }

  if (input.verificationDecision === 'VERIFIED') {
    confidence += 10;
  }

  confidence -= riskScore * 0.15;

  return Math.min(100, Math.max(0, Math.round(confidence)));
}
