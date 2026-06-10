/**
 * Autonomous Verification — risk analysis.
 */

import type { EvidenceAnalysis, VerificationInput } from './autonomous-verification-types.js';

export function analyzeVerificationRisk(
  input: VerificationInput,
  evidence: EvidenceAnalysis,
  trustScore: number,
): number {
  let risk = 20;

  if (input.criticalSubsystem) risk += 25;
  if (input.blastRadius === 'PLATFORM') risk += 30;
  else if (input.blastRadius === 'SYSTEM') risk += 20;
  else if (input.blastRadius === 'MODULE') risk += 10;

  if (trustScore < 40) risk += 20;
  else if (trustScore < 60) risk += 10;

  if ((input.testingConfidence ?? 70) < 50) risk += 12;
  if ((input.fixingConfidence ?? 70) < 50) risk += 10;

  risk += evidence.missingEvidence.length * 6;

  if (input.regressionDetected) risk += 15;
  if (input.world2Active) risk += 8;
  if (input.cloudTouched) risk += 8;
  if (input.missingDependencies) risk += 25;

  return Math.min(100, Math.max(0, risk));
}
