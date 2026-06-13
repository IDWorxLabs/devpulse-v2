/**
 * Verification Evidence Analyzer — verify results are backed by evidence artifacts.
 */

import type {
  VerificationEvidenceAssessment,
  VerificationEvidenceFixture,
  VerificationEvidenceState,
} from './connected-verification-execution-proof-types.js';

export function analyzeVerificationEvidence(input: {
  fixture?: VerificationEvidenceFixture;
  resultsObserved: boolean;
}): VerificationEvidenceAssessment {
  const f = input.fixture;
  const paths = f?.evidencePaths ?? [];
  const types = f?.evidenceTypes ?? [];
  const logCount = f?.testLogs?.length ?? 0;
  const totalCount = paths.length + (logCount > 0 ? 1 : 0);

  if (!input.resultsObserved || totalCount === 0) {
    return {
      readOnly: true,
      evidenceState: 'NOT_OBSERVED',
      evidenceObserved: false,
      evidenceTypes: [],
      evidencePaths: [],
      evidenceCount: 0,
      confidence: 0,
    };
  }

  const inferredTypes = [...types];
  if (logCount > 0 && !inferredTypes.includes('test_logs')) inferredTypes.push('test_logs');
  if (paths.some((p) => p.includes('screenshot'))) inferredTypes.push('screenshots');
  if (paths.some((p) => p.includes('dom'))) inferredTypes.push('dom_snapshots');

  let evidenceState: VerificationEvidenceState = 'PARTIAL';
  if (paths.length >= 1 || (logCount > 0 && input.resultsObserved)) {
    evidenceState = 'EVIDENCED';
  } else if (paths.length >= 1 || logCount > 0) {
    evidenceState = 'PARTIAL';
  }

  const evidenceObserved = paths.length >= 1 || logCount > 0;

  return {
    readOnly: true,
    evidenceState,
    evidenceObserved,
    evidenceTypes: inferredTypes,
    evidencePaths: paths,
    evidenceCount: totalCount,
    confidence: evidenceState === 'EVIDENCED' ? 90 : 65,
  };
}

export function isEvidenceSufficient(assessment: VerificationEvidenceAssessment): boolean {
  return assessment.evidenceObserved && assessment.evidenceCount > 0;
}
