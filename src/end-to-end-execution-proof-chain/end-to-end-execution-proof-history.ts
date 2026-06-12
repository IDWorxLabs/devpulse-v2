/**
 * End-to-End Execution Proof Chain — bounded history (max 16).
 */

import { MAX_END_TO_END_EXECUTION_PROOF_HISTORY } from './end-to-end-execution-proof-registry.js';
import type {
  EndToEndExecutionProofAssessment,
  EndToEndExecutionProofHistoryEntry,
  EndToEndExecutionProofHistorySummary,
  EndToEndProofState,
} from './end-to-end-execution-proof-types.js';

const history: EndToEndExecutionProofHistoryEntry[] = [];

export function resetEndToEndExecutionProofHistoryForTests(): void {
  history.length = 0;
}

export function recordEndToEndExecutionProofAssessment(
  assessment: EndToEndExecutionProofAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    proofChainId: report.proofChainId,
    connectedExecutionScore: report.connectedExecutionScore,
    proofState: report.proofState,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_END_TO_END_EXECUTION_PROOF_HISTORY) {
    history.length = MAX_END_TO_END_EXECUTION_PROOF_HISTORY;
  }
}

export function getEndToEndExecutionProofHistorySize(): number {
  return history.length;
}

export function getLatestEndToEndExecutionProofHistoryEntry(): EndToEndExecutionProofHistoryEntry | null {
  return history[0] ?? null;
}

export function getEndToEndExecutionProofHistory(): readonly EndToEndExecutionProofHistoryEntry[] {
  return [...history];
}

export function countEndToEndProofState(
  state: EndToEndProofState,
  entries: readonly EndToEndExecutionProofHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.proofState === state).length;
}

export function buildEndToEndExecutionProofHistorySummary(
  entries: readonly EndToEndExecutionProofHistoryEntry[] = history,
): EndToEndExecutionProofHistorySummary {
  return {
    totalAssessments: entries.length,
    provenChains: countEndToEndProofState('END_TO_END_PROVEN', entries),
    partiallyProvenChains: countEndToEndProofState('END_TO_END_PARTIALLY_PROVEN', entries),
    notProvenChains: countEndToEndProofState('END_TO_END_NOT_PROVEN', entries),
    blockedChains: countEndToEndProofState('END_TO_END_BLOCKED', entries),
    insufficientEvidenceChains: countEndToEndProofState('INSUFFICIENT_EVIDENCE', entries),
  };
}
