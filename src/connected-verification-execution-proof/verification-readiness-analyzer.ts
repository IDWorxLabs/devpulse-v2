/**
 * Verification Readiness Analyzer — founder-readable verification readiness.
 */

import type {
  VerificationFailureAnalysis,
  VerificationReadinessAssessment,
  VerificationReadinessState,
  VerificationResultAssessment,
  VerificationRunAssessment,
} from './connected-verification-execution-proof-types.js';
import { isRunCompleted } from './verification-run-analyzer.js';
import { areResultsObserved } from './verification-result-analyzer.js';

export function analyzeVerificationReadiness(input: {
  run: VerificationRunAssessment;
  results: VerificationResultAssessment;
  failures: VerificationFailureAnalysis;
  proofLevel: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
}): VerificationReadinessAssessment {
  if (!input.run.runObserved || !isRunCompleted(input.run)) {
    return {
      readOnly: true,
      readinessState: 'VERIFICATION_NOT_RUN',
      founderSummary: 'Verification has not completed against the generated application.',
      canProceed: false,
      blockingReasons: ['Verification run not completed'],
      nextActions: ['Run verification against preview/runtime output with evidence capture.'],
    };
  }

  if (!areResultsObserved(input.results)) {
    return {
      readOnly: true,
      readinessState: 'VERIFICATION_PARTIAL',
      founderSummary: 'Verification ran but results are not fully observed.',
      canProceed: false,
      blockingReasons: ['Verification results not observed'],
      nextActions: ['Capture and link verification result artifacts.'],
    };
  }

  if (input.results.resultState === 'FAIL' || input.results.failCount > 0) {
    const blocking = input.failures.failures.map((f) => f.message).slice(0, 5);
    return {
      readOnly: true,
      readinessState: 'VERIFICATION_FAILED',
      founderSummary: `Verification completed with ${input.results.failCount} failure(s) — evidence exists but app did not pass.`,
      canProceed: false,
      blockingReasons: blocking.length ? blocking : [`${input.results.failCount} check(s) failed`],
      nextActions: input.failures.failures.map((f) => f.recommendedFix).slice(0, 3),
    };
  }

  if (input.results.resultState === 'PARTIAL' || input.proofLevel === 'PARTIAL') {
    return {
      readOnly: true,
      readinessState: 'VERIFICATION_PARTIAL',
      founderSummary: 'Verification partially passed — some checks incomplete or warnings remain.',
      canProceed: false,
      blockingReasons: ['Partial verification coverage'],
      nextActions: ['Complete remaining verification checks with evidence.'],
    };
  }

  return {
    readOnly: true,
    readinessState: 'VERIFICATION_PASSED',
    founderSummary: `Verification passed — ${input.results.passCount} check(s) with evidence-backed results.`,
    canProceed: true,
    blockingReasons: [],
    nextActions: ['Proceed to launch readiness assessment.'],
  };
}
