/**
 * Autonomous Completion Engine — completion evidence analysis.
 */

import type { CompletionEvidenceAnalysis, CompletionInput } from './autonomous-completion-engine-types.js';

export function analyzeCompletionEvidence(input: CompletionInput): CompletionEvidenceAnalysis {
  const evidenceSummary: string[] = [];
  const missingEvidence: string[] = [];
  let evidenceQualityScore = 35;

  if ((input.buildConfidence ?? 0) >= 55) {
    evidenceSummary.push(`Build strategy evidence: ${input.buildConfidence}`);
    evidenceQualityScore += 12;
  } else {
    missingEvidence.push('build evidence');
  }

  if (
    (input.testingConfidence ?? 0) >= 55 ||
    input.testResultStatus === 'SIMULATED_PASS'
  ) {
    evidenceSummary.push(`Testing evidence: ${input.testResultStatus ?? 'planned'}`);
    evidenceQualityScore += 12;
  } else {
    missingEvidence.push('testing evidence');
  }

  if (
    (input.fixingConfidence ?? 0) >= 50 ||
    input.fixReadiness === 'READY'
  ) {
    evidenceSummary.push(`Fixing evidence: ${input.fixStrategy ?? 'none'}`);
    evidenceQualityScore += 10;
  } else if (input.unresolvedFailures || input.testResultStatus === 'SIMULATED_FAIL') {
    missingEvidence.push('fixing evidence');
  }

  if (
    (input.verificationConfidence ?? 0) >= 55 ||
    input.verificationDecision === 'VERIFIED'
  ) {
    evidenceSummary.push(`Verification evidence: ${input.verificationDecision ?? 'pending'}`);
    evidenceQualityScore += 12;
  } else {
    missingEvidence.push('verification evidence');
  }

  if (input.trustScore >= 65) {
    evidenceSummary.push(`Trust evidence score: ${input.trustScore}`);
    evidenceQualityScore += 10;
  } else {
    missingEvidence.push('trust evidence');
  }

  if (input.world2Active) {
    evidenceSummary.push('World 2 completion context present');
    evidenceQualityScore += 5;
  }

  if (input.evidenceSignals && input.evidenceSignals.length > 0) {
    evidenceSummary.push(...input.evidenceSignals.map((s) => `completion signal: ${s}`));
    evidenceQualityScore += Math.min(12, input.evidenceSignals.length * 4);
  } else {
    missingEvidence.push('completion evidence');
  }

  if (input.verificationEvidenceSufficient === false) {
    missingEvidence.push('verification completion evidence');
    evidenceQualityScore -= 8;
  }

  return {
    evidenceSummary,
    missingEvidence,
    evidenceQualityScore: Math.min(100, Math.max(0, evidenceQualityScore)),
  };
}
