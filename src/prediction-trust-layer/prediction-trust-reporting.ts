/**
 * Prediction Trust Layer — prediction trust reporting.
 */

import type {
  LikelyFailureMode,
  PredictionTrustEvaluation,
  PredictionTrustRecord,
  PredictionTrustReport,
} from './prediction-trust-types.js';
import { getPredictionTrustCacheStats } from './prediction-trust-cache.js';
import { getPredictionTrustHistorySize } from './prediction-trust-history.js';

let reportCount = 0;

export function generatePredictionTrustReport(
  record: PredictionTrustRecord,
  evaluation: PredictionTrustEvaluation,
  likelyFailures: LikelyFailureMode[],
  recoveryRecommendations: string[],
  volatility: number,
  stability: number,
  missingSignals: string[],
): PredictionTrustReport {
  reportCount += 1;
  const cache = getPredictionTrustCacheStats();

  return {
    predictedTrustScore: record.predictedTrustScore,
    predictedRiskScore: record.predictedRiskScore,
    riskLevel: record.riskLevel,
    decision: record.decision,
    likelyFailureModes: [...likelyFailures],
    recoveryRecommendations: [...recoveryRecommendations],
    confidence: record.confidence,
    volatility,
    stability,
    missingSignals: [...missingSignals],
    evaluation,
    historySize: getPredictionTrustHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetPredictionTrustReportingForTests(): void {
  reportCount = 0;
}
