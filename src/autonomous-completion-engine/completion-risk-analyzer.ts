/**
 * Autonomous Completion Engine — completion risk analysis.
 */

import type { CompletionEvidenceAnalysis, CompletionInput } from './autonomous-completion-engine-types.js';

export function analyzeCompletionRisk(
  input: CompletionInput,
  evidence: CompletionEvidenceAnalysis,
): number {
  let risk = 18;

  if (input.criticalSubsystem) risk += 22;
  if (input.blastRadius === 'PLATFORM') risk += 28;
  else if (input.blastRadius === 'SYSTEM') risk += 18;
  else if (input.blastRadius === 'MODULE') risk += 8;

  if (input.unresolvedFailures || input.testResultStatus === 'SIMULATED_FAIL') {
    risk += 15;
  }

  if (input.trustScore < 40) risk += 18;
  else if (input.trustScore < 60) risk += 8;

  if ((input.verificationConfidence ?? 70) < 50) risk += 10;
  if (input.verificationDisagreement) risk += 12;

  risk += evidence.missingEvidence.length * 5;

  if (input.missingDependencies) risk += 20;
  if ((input.repeatFailures ?? 0) >= 3) risk += 10;

  return Math.min(100, Math.max(0, risk));
}
