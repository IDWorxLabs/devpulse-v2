/**
 * Prediction Trust Layer — trust risk predictor.
 */

import type {
  PredictionTrustInput,
  PredictionTrustRiskLevel,
  TrustRiskPrediction,
} from './prediction-trust-types.js';
import { getCachedRiskPrediction, setCachedRiskPrediction } from './prediction-trust-cache.js';

let riskPredictionCount = 0;

function resolveRiskLevel(score: number): PredictionTrustRiskLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export function predictTrustRisk(input: PredictionTrustInput): TrustRiskPrediction {
  const cacheKey = [
    input.trustScore ?? 0,
    input.evidenceQuality ?? 0,
    input.realityConfidence ?? 0,
    input.completionTruthScore ?? 0,
    input.governanceStable,
    input.monitoringHealthy,
  ].join('|');

  const cached = getCachedRiskPrediction(cacheKey);
  if (cached) return cached;

  riskPredictionCount += 1;

  const trust = input.trustScore ?? 50;
  const evidence = input.evidenceQuality ?? 50;
  const reality = input.realityConfidence ?? 50;
  const completion = input.completionTruthScore ?? 50;

  const futureTrustLoss = Math.max(0, Math.min(100, Math.round(100 - trust + (100 - evidence) * 0.2)));
  const verificationRisk = Math.max(0, Math.min(100, Math.round(100 - reality + (100 - evidence) * 0.15)));
  const completionRisk = Math.max(0, Math.min(100, Math.round(100 - completion + futureTrustLoss * 0.2)));
  const governanceRisk = input.governanceStable === false ? 70 : 15;
  const multiProjectRisk = (input.monitoringHealthy === false ? 50 : 10)
    + (input.resourceContention === true ? 35 : 0);

  const predictedRiskScore = Math.round(
    (futureTrustLoss + verificationRisk + completionRisk + governanceRisk + multiProjectRisk) / 5,
  );

  const result: TrustRiskPrediction = {
    predictedRiskScore,
    predictedRiskLevel: resolveRiskLevel(predictedRiskScore),
    verificationRisk,
    completionRisk,
    governanceRisk,
    multiProjectRisk,
  };

  setCachedRiskPrediction(cacheKey, result);
  return result;
}

export function getRiskPredictionCount(): number {
  return riskPredictionCount;
}

export function resetTrustRiskPredictorForTests(): void {
  riskPredictionCount = 0;
}
