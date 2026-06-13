/**
 * Connected Runtime Activation Proof — bounded history.
 */

import { MAX_RUNTIME_ACTIVATION_PROOF_HISTORY } from './connected-runtime-activation-proof-registry.js';
import type {
  RuntimeActivationProofAssessment,
  RuntimeActivationProofHistoryEntry,
  RuntimeActivationProofHistorySummary,
} from './connected-runtime-activation-proof-types.js';

const history: RuntimeActivationProofHistoryEntry[] = [];

export function resetRuntimeActivationProofHistoryForTests(): void {
  history.length = 0;
}

export function recordRuntimeActivationProofAssessment(
  assessment: RuntimeActivationProofAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    runtimeProofLevel: report.runtimeProofLevel,
    runtimeActivationState: report.runtimeActivationState,
    runtimeLinkageConnected: report.linkage.runtimeLinkageConnected,
  });
  if (history.length > MAX_RUNTIME_ACTIVATION_PROOF_HISTORY) {
    history.length = MAX_RUNTIME_ACTIVATION_PROOF_HISTORY;
  }
}

export function getRuntimeActivationProofHistorySize(): number {
  return history.length;
}

export function buildRuntimeActivationProofHistorySummary(
  entries: readonly RuntimeActivationProofHistoryEntry[] = history,
): RuntimeActivationProofHistorySummary {
  return {
    totalAssessments: entries.length,
    provenRuntimes: entries.filter((e) => e.runtimeProofLevel === 'PROVEN').length,
    partialRuntimes: entries.filter((e) => e.runtimeProofLevel === 'PARTIAL').length,
    notProvenRuntimes: entries.filter((e) => e.runtimeProofLevel === 'NOT_PROVEN').length,
  };
}
