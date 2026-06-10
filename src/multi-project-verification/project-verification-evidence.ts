/**
 * Multi Project Verification — evidence analysis.
 */

import type { ProjectVerificationEvidence, ProjectVerificationInput } from './multi-project-verification-types.js';

export function analyzeProjectVerificationEvidence(input: ProjectVerificationInput): ProjectVerificationEvidence {
  const evidenceSummary: string[] = [];
  const missingEvidence: string[] = [];
  let evidenceQualityScore = 35;

  if ((input.verificationConfidence ?? 0) >= 50 || input.verificationDecision === 'VERIFIED') {
    evidenceSummary.push(`Verification output: ${input.verificationDecision ?? 'planned'}`);
    evidenceQualityScore += 15;
  } else {
    missingEvidence.push('verification output');
  }

  if ((input.testingConfidence ?? 0) >= 50 || input.testResultStatus === 'SIMULATED_PASS') {
    evidenceSummary.push(`Testing output: ${input.testResultStatus ?? 'planned'}`);
    evidenceQualityScore += 15;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    evidenceSummary.push('Testing output indicates failure');
    evidenceQualityScore += 5;
    missingEvidence.push('passing test evidence');
  } else {
    missingEvidence.push('testing output');
  }

  if ((input.fixingConfidence ?? 0) >= 50 || (input.repairCandidates?.length ?? 0) > 0) {
    evidenceSummary.push(`Fixing output: ${input.fixStrategy ?? 'none'}`);
    evidenceQualityScore += 12;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    missingEvidence.push('fixing output');
  }

  if ((input.completionConfidence ?? 0) >= 50) {
    evidenceSummary.push(`Completion output confidence: ${input.completionConfidence}`);
    evidenceQualityScore += 10;
  } else {
    missingEvidence.push('completion output');
  }

  if ((input.trustScore ?? 0) >= 60) {
    evidenceSummary.push(`Trust score: ${input.trustScore}`);
    evidenceQualityScore += 10;
  } else if ((input.trustScore ?? 100) < 40) {
    missingEvidence.push('trust recovery evidence');
  }

  if (input.world2Active) {
    evidenceSummary.push('World 2 workspace evidence present');
    evidenceQualityScore += 5;
  }

  if (input.orchestrationReady) {
    evidenceSummary.push('Orchestration plan ready');
    evidenceQualityScore += 5;
  }

  if (input.isolationOk === false) {
    missingEvidence.push('workspace isolation evidence');
    evidenceQualityScore -= 10;
  }

  if (input.evidenceSignals && input.evidenceSignals.length > 0) {
    evidenceSummary.push(...input.evidenceSignals.map((s) => `signal: ${s}`));
    evidenceQualityScore += Math.min(12, input.evidenceSignals.length * 4);
  }

  return {
    evidenceSummary,
    missingEvidence,
    evidenceQualityScore: Math.min(100, Math.max(0, Math.round(evidenceQualityScore))),
  };
}
