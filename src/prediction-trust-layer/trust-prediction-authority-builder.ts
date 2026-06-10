/**
 * Prediction Trust Layer — unified prediction trust authority builder.
 */

import type {
  PredictionTrustDecision,
  PredictionTrustRiskLevel,
  TrustFailurePrediction,
  TrustRecoveryRecommendation,
  TrustRiskPrediction,
  TrustTrendAnalysis,
  TrustVolatilityAnalysis,
  UnifiedPredictionTrustAuthority,
} from './prediction-trust-types.js';
import { getCachedPredictionAuthority, setCachedPredictionAuthority } from './prediction-trust-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedPredictionTrustAuthority(
  requestId: string,
  trend: TrustTrendAnalysis,
  risk: TrustRiskPrediction,
  failures: TrustFailurePrediction,
  volatility: TrustVolatilityAnalysis,
  recovery: TrustRecoveryRecommendation,
  trustScore: number,
): UnifiedPredictionTrustAuthority {
  const cacheKey = [requestId, risk.predictedRiskScore, recovery.action].join('|');
  const cached = getCachedPredictionAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const predictedTrustScore = Math.max(0, Math.min(100, Math.round(
    trustScore - risk.predictedRiskScore * 0.3 + volatility.stabilityScore * 0.1,
  )));

  const confidence = Math.min(100, Math.round(
    (trend.trendConfidence + failures.failureConfidence + volatility.stabilityScore) / 3,
  ));

  const authority: UnifiedPredictionTrustAuthority = {
    authorityId: `prediction-trust-authority-${authorityCounter}`,
    riskLevel: risk.predictedRiskLevel,
    decision: recovery.action,
    predictedTrustScore,
    predictedRiskScore: risk.predictedRiskScore,
    confidence,
    createdAt: Date.now(),
  };

  setCachedPredictionAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetTrustPredictionAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
