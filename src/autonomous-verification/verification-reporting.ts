/**
 * Autonomous Verification — report generation.
 */

import { analyzeVerificationEvidence } from './evidence-analyzer.js';
import { evaluateVerificationReadiness } from './verification-readiness-evaluator.js';
import type {
  AutonomousVerificationResult,
  VerificationInput,
  VerificationReport,
} from './autonomous-verification-types.js';

let reportCounter = 0;

export function generateVerificationReport(
  result: AutonomousVerificationResult,
  input?: VerificationInput,
): VerificationReport {
  reportCounter += 1;

  const evidence = input ? analyzeVerificationEvidence(input) : {
    evidenceSummary: result.evidenceSummary,
    missingEvidence: [] as string[],
  };

  const readiness = input
    ? evaluateVerificationReadiness(
        input,
        result.decision,
        analyzeVerificationEvidence(input),
        result.trustScore,
        result.riskScore,
        result.confidence,
      )
    : 'NEEDS_MORE_EVIDENCE';

  return {
    reportId: `verification-report-${reportCounter}`,
    resultId: result.id,
    decision: result.decision,
    trustScore: result.trustScore,
    confidence: result.confidence,
    riskScore: result.riskScore,
    readiness,
    evidenceSummary: [...result.evidenceSummary],
    missingEvidence: 'missingEvidence' in evidence ? [...evidence.missingEvidence] : [],
    reasoning: [...result.reasoning],
    generatedAt: Date.now(),
  };
}

export function resetVerificationReportCounterForTests(): void {
  reportCounter = 0;
}
