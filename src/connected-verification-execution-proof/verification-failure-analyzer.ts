/**
 * Verification Failure Analyzer — extract actionable verification failures.
 */

import type {
  VerificationEvidenceFixture,
  VerificationFailureAnalysis,
  VerificationFailureEntry,
  VerificationResultAssessment,
} from './connected-verification-execution-proof-types.js';

export function analyzeVerificationFailures(input: {
  fixture?: VerificationEvidenceFixture;
  results: VerificationResultAssessment;
}): VerificationFailureAnalysis {
  const entries: VerificationFailureEntry[] = (input.fixture?.failures ?? []).map((f) => ({
    readOnly: true as const,
    ...f,
  }));

  if (entries.length === 0 && input.results.failCount > 0) {
    entries.push({
      readOnly: true,
      failureId: 'verification-fail-aggregate',
      severity: input.results.failCount >= 3 ? 'CRITICAL' : 'HIGH',
      message: `${input.results.failCount} verification check(s) failed`,
      source: 'verification-result-analyzer',
      affectedStage: 'VERIFY',
      recommendedFix: 'Review failed verification checks and remediate before launch.',
    });
  }

  return {
    readOnly: true,
    failures: entries,
    criticalCount: entries.filter((e) => e.severity === 'CRITICAL').length,
    highCount: entries.filter((e) => e.severity === 'HIGH').length,
  };
}
