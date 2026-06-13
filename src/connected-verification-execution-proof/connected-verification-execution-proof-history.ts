/**
 * Connected Verification Execution Proof — bounded history.
 */

import { MAX_VERIFICATION_EXECUTION_PROOF_HISTORY } from './connected-verification-execution-proof-registry.js';
import type {
  VerificationExecutionProofAssessment,
  VerificationExecutionProofHistoryEntry,
  VerificationExecutionProofHistorySummary,
} from './connected-verification-execution-proof-types.js';

const history: VerificationExecutionProofHistoryEntry[] = [];

export function resetVerificationExecutionProofHistoryForTests(): void {
  history.length = 0;
}

export function recordVerificationExecutionProofAssessment(
  assessment: VerificationExecutionProofAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    verificationProofLevel: report.verificationProofLevel,
    verificationState: report.verificationState,
    verificationExecutionConnected: report.verificationExecutionConnected,
    verificationLinkageConnected: report.linkage.verificationLinkageConnected,
  });
  if (history.length > MAX_VERIFICATION_EXECUTION_PROOF_HISTORY) {
    history.length = MAX_VERIFICATION_EXECUTION_PROOF_HISTORY;
  }
}

export function getVerificationExecutionProofHistorySize(): number {
  return history.length;
}

export function buildVerificationExecutionProofHistorySummary(
  entries: readonly VerificationExecutionProofHistoryEntry[] = history,
): VerificationExecutionProofHistorySummary {
  return {
    totalAssessments: entries.length,
    provenVerifications: entries.filter((e) => e.verificationProofLevel === 'PROVEN').length,
    partialVerifications: entries.filter((e) => e.verificationProofLevel === 'PARTIAL').length,
    notProvenVerifications: entries.filter((e) => e.verificationProofLevel === 'NOT_PROVEN').length,
  };
}
