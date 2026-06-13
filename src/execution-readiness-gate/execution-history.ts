/**
 * Execution History — bounded assessment history (max 16).
 */

import { MAX_EXECUTION_READINESS_HISTORY } from './execution-readiness-registry.js';
import type { ExecutionReadinessAnalysis, ExecutionReadinessHistoryEntry } from './execution-readiness-types.js';

const history: ExecutionReadinessHistoryEntry[] = [];
const analyses: ExecutionReadinessAnalysis[] = [];

export function resetExecutionReadinessHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordExecutionReadinessAnalysis(analysis: ExecutionReadinessAnalysis): void {
  const entry: ExecutionReadinessHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    executionReadinessScore: analysis.readinessScore.executionReadinessScore,
    executionGateDecision: analysis.executionGateDecision,
    safeToProceed: analysis.safeToProceed,
    criticalBlockerCount: analysis.blockerSummary.unresolvedCriticalCount,
    riskCount: analysis.riskAnalysis.riskCount,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_EXECUTION_READINESS_HISTORY) {
    history.length = MAX_EXECUTION_READINESS_HISTORY;
  }
  if (analyses.length > MAX_EXECUTION_READINESS_HISTORY) {
    analyses.length = MAX_EXECUTION_READINESS_HISTORY;
  }
}

export function getExecutionReadinessHistorySize(): number {
  return history.length;
}

export function getExecutionReadinessHistory(): readonly ExecutionReadinessHistoryEntry[] {
  return [...history];
}

export function getExecutionReadinessAnalyses(): readonly ExecutionReadinessAnalysis[] {
  return [...analyses];
}

export function getLatestExecutionReadinessAnalysis(): ExecutionReadinessAnalysis | null {
  return analyses[0] ?? null;
}
