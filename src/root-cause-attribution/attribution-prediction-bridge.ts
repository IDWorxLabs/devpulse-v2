/**
 * Failure Prediction bridge — Failure Prediction remains owner; attribution consumes signals.
 */

import { getDevPulseV2FailurePredictionAuthority } from '../failure-prediction/failure-prediction-authority.js';
import { PREDICTION_OWNER_MODULE } from '../failure-prediction/types.js';
import type { PredictionRecord } from '../failure-prediction/types.js';

export interface PredictionAttributionSignals {
  predictions: PredictionRecord[];
  highRiskCount: number;
  highRiskPredictionIds: string[];
  mediumRiskCount: number;
}

export function analyzePredictionSignals(): PredictionAttributionSignals {
  const authority = getDevPulseV2FailurePredictionAuthority();
  let predictions = authority.getPredictionRecords();
  if (predictions.length === 0) {
    predictions = authority.generatePredictionRecords();
  }

  const highRisk = predictions.filter(
    (p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL',
  );

  return {
    predictions,
    highRiskCount: highRisk.length,
    highRiskPredictionIds: highRisk.map((p) => p.predictionId),
    mediumRiskCount: predictions.filter((p) => p.riskLevel === 'MEDIUM').length,
  };
}

export function getPredictionAttributionSummary(): string {
  const signals = analyzePredictionSignals();
  if (signals.predictions.length === 0) {
    return 'No failure prediction signals available for attribution.';
  }
  return `Prediction signals: ${signals.predictions.length} prediction(s), ${signals.highRiskCount} high/critical risk.`;
}

export function assertFailurePredictionOwnershipUnchanged(): boolean {
  const prediction = getDevPulseV2FailurePredictionAuthority();
  return (
    prediction.constructor.name === 'DevPulseV2FailurePredictionAuthority' &&
    typeof prediction.getPredictionRecords === 'function' &&
    typeof (prediction as { generateAttributions?: unknown }).generateAttributions === 'undefined'
  );
}

export function getFailurePredictionOwnerForBridge(): string {
  return PREDICTION_OWNER_MODULE;
}
