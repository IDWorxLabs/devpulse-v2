/**
 * Prediction Trust Layer — trust failure predictor.
 */

import type {
  LikelyFailureMode,
  PredictionTrustInput,
  TrustFailurePrediction,
  TrustRiskPrediction,
  TrustTrendAnalysis,
} from './prediction-trust-types.js';
import { getCachedFailurePrediction, setCachedFailurePrediction } from './prediction-trust-cache.js';

let failurePredictionCount = 0;

export function predictTrustFailures(
  input: PredictionTrustInput,
  trend: TrustTrendAnalysis,
  risk: TrustRiskPrediction,
): TrustFailurePrediction {
  const cacheKey = [trend.trendDirection, risk.predictedRiskScore, input.stallRisk, input.resourceContention].join('|');
  const cached = getCachedFailurePrediction(cacheKey);
  if (cached) return cached;

  failurePredictionCount += 1;
  const likelyFailures: LikelyFailureMode[] = [];

  if (trend.trendDirection === 'DEGRADING' || risk.predictedRiskScore >= 60) {
    likelyFailures.push('trust_collapse');
  }
  if (risk.verificationRisk >= 55) likelyFailures.push('verification_failure');
  if ((input.evidenceQuality ?? 50) < 40 || trend.trendDirection === 'VOLATILE') {
    likelyFailures.push('evidence_contradiction');
  }
  if (risk.completionRisk >= 55 || (input.completionTruthScore ?? 100) < 45) {
    likelyFailures.push('false_completion');
  }
  if (input.governanceStable === false || risk.governanceRisk >= 50) {
    likelyFailures.push('governance_block');
  }
  if (input.stallRisk === true) likelyFailures.push('stalled_progress');
  if (input.resourceContention === true) likelyFailures.push('resource_contention');

  const failureConfidence = Math.min(100, Math.round(
    likelyFailures.length * 12 + risk.predictedRiskScore * 0.4 + trend.volatilityScore * 0.2,
  ));

  const result: TrustFailurePrediction = {
    likelyFailures: [...new Set(likelyFailures)],
    failureConfidence,
  };

  setCachedFailurePrediction(cacheKey, result);
  return result;
}

export function getFailurePredictionCount(): number {
  return failurePredictionCount;
}

export function resetTrustFailurePredictorForTests(): void {
  failurePredictionCount = 0;
}
