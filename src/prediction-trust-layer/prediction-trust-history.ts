/**
 * Prediction Trust Layer — bounded history.
 */

import type { PredictionTrustHistoryEntry, PredictionTrustRecord } from './prediction-trust-types.js';
import { DEFAULT_MAX_PREDICTION_TRUST_HISTORY_SIZE } from './prediction-trust-types.js';

const history: PredictionTrustHistoryEntry[] = [];

export function recordPredictionTrustHistory(record: PredictionTrustRecord): void {
  history.push({
    predictionId: record.predictionId,
    riskLevel: record.riskLevel,
    decision: record.decision,
    predictedTrustScore: record.predictedTrustScore,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_PREDICTION_TRUST_HISTORY_SIZE) {
    history.shift();
  }
}

export function getPredictionTrustHistory(): readonly PredictionTrustHistoryEntry[] {
  return [...history];
}

export function getPredictionTrustHistorySize(): number {
  return history.length;
}

export function clearPredictionTrustHistory(): void {
  history.length = 0;
}

export function resetPredictionTrustHistoryForTests(): void {
  clearPredictionTrustHistory();
}
