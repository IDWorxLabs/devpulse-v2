/**
 * Completion Truth Engine — completion truth reporting.
 */

import type {
  CompletionGap,
  CompletionTruthEvaluation,
  CompletionTruthRecord,
  CompletionTruthReport,
} from './completion-truth-types.js';
import { getCompletionTruthCacheStats } from './completion-truth-cache.js';
import { getCompletionTruthHistorySize } from './completion-truth-history.js';

let reportCount = 0;

export function generateCompletionTruthReport(
  record: CompletionTruthRecord,
  evaluation: CompletionTruthEvaluation,
  blockers: string[] = [],
): CompletionTruthReport {
  reportCount += 1;
  const cache = getCompletionTruthCacheStats();

  return {
    truthScore: record.authority.completionTruthScore,
    confidence: evaluation.completionConfidence,
    falseCompletionRisk: record.authority.falseCompletionRisk,
    missingProof: [...record.gaps],
    blockers: [...blockers, ...record.falseCompletion.reasons],
    recommendedAction: record.authority.decision,
    evaluation,
    historySize: getCompletionTruthHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetCompletionTruthReportingForTests(): void {
  reportCount = 0;
}
