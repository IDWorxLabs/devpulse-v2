/**
 * Autonomous Verification — evidence analysis.
 */

import type { EvidenceAnalysis, VerificationEvidenceType, VerificationInput } from './autonomous-verification-types.js';

export function analyzeVerificationEvidence(input: VerificationInput): EvidenceAnalysis {
  const evidenceTypes: VerificationEvidenceType[] = [];
  const evidenceSummary: string[] = [];
  const missingEvidence: string[] = [];
  let evidenceConfidence = 40;

  if ((input.buildConfidence ?? 0) >= 50) {
    evidenceTypes.push('BUILD');
    evidenceSummary.push(`Build evidence confidence: ${input.buildConfidence}`);
    evidenceConfidence += 12;
  } else {
    missingEvidence.push('build evidence');
  }

  if ((input.testingConfidence ?? 0) >= 50 || input.testResultStatus === 'SIMULATED_PASS') {
    evidenceTypes.push('TEST');
    evidenceSummary.push(`Testing evidence: ${input.testResultStatus ?? 'planned'}`);
    evidenceConfidence += 12;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    evidenceTypes.push('TEST');
    evidenceSummary.push('Testing evidence indicates failure');
    evidenceConfidence += 5;
  } else {
    missingEvidence.push('testing evidence');
  }

  if ((input.fixingConfidence ?? 0) >= 50 || (input.repairCandidates?.length ?? 0) > 0) {
    evidenceTypes.push('FIX');
    evidenceSummary.push(`Fixing evidence: ${input.fixStrategy ?? 'none'}`);
    evidenceConfidence += 10;
  } else if (input.testResultStatus === 'SIMULATED_FAIL') {
    missingEvidence.push('fixing evidence');
  }

  if (input.trustScore >= 60) {
    evidenceTypes.push('TRUST');
    evidenceSummary.push(`Trust evidence score: ${input.trustScore}`);
    evidenceConfidence += 10;
  } else {
    missingEvidence.push('trust evidence');
  }

  if ((input.verificationConfidence ?? 0) >= 50) {
    evidenceTypes.push('VERIFICATION');
    evidenceSummary.push(`Verification plan confidence: ${input.verificationConfidence}`);
    evidenceConfidence += 12;
  } else {
    missingEvidence.push('verification evidence');
  }

  if (input.world2Active) {
    evidenceTypes.push('WORLD2');
    evidenceSummary.push('World 2 workspace evidence present');
    evidenceConfidence += 5;
  }

  if (input.cloudTouched) {
    evidenceTypes.push('CLOUD');
    evidenceSummary.push('Cloud runtime evidence present');
    evidenceConfidence += 5;
  }

  if (input.regressionDetected) {
    evidenceTypes.push('REGRESSION');
    evidenceSummary.push('Regression evidence detected');
    evidenceConfidence -= 10;
  }

  if (input.evidenceSignals && input.evidenceSignals.length > 0) {
    evidenceSummary.push(...input.evidenceSignals.map((s) => `signal: ${s}`));
    evidenceConfidence += Math.min(15, input.evidenceSignals.length * 5);
  }

  return {
    evidenceTypes,
    evidenceSummary,
    evidenceConfidence: Math.min(100, Math.max(0, evidenceConfidence)),
    missingEvidence,
  };
}
