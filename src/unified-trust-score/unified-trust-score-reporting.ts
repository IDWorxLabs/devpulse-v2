/**
 * Unified Trust Score — reporting.
 */

import type {
  TrustConsistencyAnalysis,
  TrustWeightContribution,
  UnifiedTrustScoreEvaluation,
  UnifiedTrustScoreRecord,
  UnifiedTrustScoreReport,
} from './unified-trust-score-types.js';
import { getUnifiedTrustScoreCacheStats } from './unified-trust-score-cache.js';
import { getUnifiedTrustScoreHistorySize } from './unified-trust-score-history.js';

let reportCount = 0;

export function generateUnifiedTrustScoreReport(
  record: UnifiedTrustScoreRecord,
  evaluation: UnifiedTrustScoreEvaluation,
  contributionBreakdown: TrustWeightContribution,
  consistencyAnalysis: TrustConsistencyAnalysis,
  missingSignals: string[],
): UnifiedTrustScoreReport {
  reportCount += 1;
  const cache = getUnifiedTrustScoreCacheStats();

  return {
    finalTrustScore: record.trustScore,
    trustLevel: record.trustLevel,
    decision: record.decision,
    confidence: record.confidence,
    contributionBreakdown,
    consistencyAnalysis,
    missingSignals: [...missingSignals],
    stability: evaluation.scoreStability,
    readiness: evaluation.trustReadiness,
    evaluation,
    historySize: getUnifiedTrustScoreHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetUnifiedTrustScoreReportingForTests(): void {
  reportCount = 0;
}
