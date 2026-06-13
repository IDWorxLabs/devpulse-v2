/**
 * Verification Run Analyzer — verify a verification run actually occurred.
 */

import type {
  VerificationEvidenceFixture,
  VerificationRunAssessment,
  VerificationRunState,
} from './connected-verification-execution-proof-types.js';

export function analyzeVerificationRun(input: {
  fixture?: VerificationEvidenceFixture;
}): VerificationRunAssessment {
  const f = input.fixture;
  if (!f?.verificationRunId && f?.runStatus !== 'STARTED' && f?.runStatus !== 'COMPLETED' && f?.runStatus !== 'FAILED') {
    return {
      readOnly: true,
      runState: 'NOT_OBSERVED',
      runObserved: false,
      runId: null,
      status: null,
      startedAt: null,
      completedAt: null,
      executor: null,
      command: null,
      scope: null,
      confidence: 0,
    };
  }

  const runState: VerificationRunState = f.runStatus ?? (f.completedAt ? 'COMPLETED' : 'STARTED');
  const runObserved = runState !== 'NOT_OBSERVED';

  return {
    readOnly: true,
    runState,
    runObserved,
    runId: f.verificationRunId ?? null,
    status: runState,
    startedAt: f.startedAt ?? null,
    completedAt: f.completedAt ?? null,
    executor: f.executor ?? null,
    command: f.command ?? null,
    scope: f.scope ?? null,
    confidence: runState === 'COMPLETED' ? 90 : runState === 'STARTED' ? 65 : 50,
  };
}

export function isRunCompleted(assessment: VerificationRunAssessment): boolean {
  return assessment.runState === 'COMPLETED' || assessment.runState === 'FAILED';
}
