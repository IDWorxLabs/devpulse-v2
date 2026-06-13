/**
 * Verification Result Analyzer — analyze verification results.
 */

import type {
  VerificationEvidenceFixture,
  VerificationResultAssessment,
  VerificationResultState,
} from './connected-verification-execution-proof-types.js';

export function analyzeVerificationResults(input: {
  fixture?: VerificationEvidenceFixture;
  runCompleted: boolean;
}): VerificationResultAssessment {
  const f = input.fixture;

  if (!input.runCompleted || f?.passCount === undefined && f?.failCount === undefined && !f?.resultStatus) {
    return {
      readOnly: true,
      resultState: 'NOT_OBSERVED',
      resultsObserved: false,
      passCount: 0,
      failCount: 0,
      warningCount: 0,
      skippedCount: 0,
      status: null,
      score: null,
      summary: null,
      confidence: 0,
    };
  }

  const passCount = f.passCount ?? 0;
  const failCount = f.failCount ?? 0;
  const warningCount = f.warningCount ?? 0;
  const skippedCount = f.skippedCount ?? 0;

  let resultState: VerificationResultState = f.resultStatus ?? 'UNKNOWN';
  if (!f.resultStatus) {
    if (failCount > 0 && passCount === 0) resultState = 'FAIL';
    else if (failCount > 0 && passCount > 0) resultState = 'PARTIAL';
    else if (passCount > 0 && failCount === 0) resultState = 'PASS';
  }

  return {
    readOnly: true,
    resultState,
    resultsObserved: true,
    passCount,
    failCount,
    warningCount,
    skippedCount,
    status: resultState,
    score: f.score ?? null,
    summary: f.summary ?? null,
    confidence: 85,
  };
}

export function areResultsObserved(assessment: VerificationResultAssessment): boolean {
  return assessment.resultsObserved && assessment.resultState !== 'NOT_OBSERVED';
}
