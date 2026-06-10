/**
 * Autonomous Fixing — fix confidence analysis.
 */

import type { FixPlanInput, RepairCandidate } from './autonomous-fixing-types.js';
import type { RootCauseAnalysis } from './autonomous-fixing-types.js';

export function analyzeFixConfidence(
  input: FixPlanInput,
  rootCause: RootCauseAnalysis,
  repairs: RepairCandidate[],
): number {
  let confidence = rootCause.confidence;

  if (repairs.length > 0) {
    const avgRepair = repairs.reduce((sum, r) => sum + r.estimatedConfidence, 0) / repairs.length;
    confidence = (confidence + avgRepair) / 2;
  } else {
    confidence -= 25;
  }

  const verificationConfidence = input.verificationConfidence ?? 70;
  confidence = (confidence + verificationConfidence) / 2;

  const testingConfidence = input.testingConfidence ?? 70;
  if (input.testResultStatus === 'SIMULATED_PASS') {
    confidence = (confidence + testingConfidence) / 2;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    confidence -= 5;
  }

  if (input.trustScore >= 70) confidence += 8;
  else if (input.trustScore < 40) confidence -= 15;

  if (input.failureSignals.length >= 2) confidence += 5;

  return Math.min(100, Math.max(0, Math.round(confidence)));
}
