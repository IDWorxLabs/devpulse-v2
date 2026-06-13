/**
 * Orchestration Proof History — bounded proof history (max 16).
 */

import { MAX_ORCHESTRATION_PROOF_HISTORY } from './orchestration-proof-registry.js';
import type { OrchestrationProofAnalysis, OrchestrationProofHistoryEntry } from './orchestration-proof-types.js';

const history: OrchestrationProofHistoryEntry[] = [];
const analyses: OrchestrationProofAnalysis[] = [];

export function resetOrchestrationProofHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordOrchestrationProofAnalysis(analysis: OrchestrationProofAnalysis): void {
  const entry: OrchestrationProofHistoryEntry = {
    proofId: analysis.proofId,
    timestamp: analysis.analyzedAt,
    orchestrationProofScore: analysis.orchestrationProofScore,
    orchestrationProofCategory: analysis.orchestrationProofCategory,
    failureCount: analysis.orchestrationFailures.length,
    scenarioCount: analysis.chainConsistencyResults.length,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_ORCHESTRATION_PROOF_HISTORY) {
    history.length = MAX_ORCHESTRATION_PROOF_HISTORY;
  }
  if (analyses.length > MAX_ORCHESTRATION_PROOF_HISTORY) {
    analyses.length = MAX_ORCHESTRATION_PROOF_HISTORY;
  }
}

export function getOrchestrationProofHistorySize(): number {
  return history.length;
}

export function getOrchestrationProofHistory(): readonly OrchestrationProofHistoryEntry[] {
  return [...history];
}

export function getOrchestrationProofAnalyses(): readonly OrchestrationProofAnalysis[] {
  return [...analyses];
}

export function getLatestOrchestrationProofAnalysis(): OrchestrationProofAnalysis | null {
  return analyses[0] ?? null;
}
