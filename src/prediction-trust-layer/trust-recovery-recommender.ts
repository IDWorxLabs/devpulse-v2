/**
 * Prediction Trust Layer — trust recovery recommender.
 */

import type {
  PredictionTrustDecision,
  TrustFailurePrediction,
  TrustRecoveryRecommendation,
  TrustRiskPrediction,
  TrustTrendAnalysis,
} from './prediction-trust-types.js';

let recoveryRecommendationCount = 0;

export function recommendTrustRecovery(
  trend: TrustTrendAnalysis,
  risk: TrustRiskPrediction,
  failures: TrustFailurePrediction,
): TrustRecoveryRecommendation {
  recoveryRecommendationCount += 1;
  const recommendations: string[] = [];
  let action: PredictionTrustDecision = 'TRUST_STABLE';

  if (risk.predictedRiskLevel === 'CRITICAL' || failures.likelyFailures.includes('governance_block')) {
    action = 'BLOCKED';
    recommendations.push('Block completion until governance stabilizes');
    recommendations.push('Require founder review');
  } else if (failures.likelyFailures.includes('trust_collapse') || trend.trendDirection === 'DEGRADING') {
    action = 'TRUST_RECOVERY_RECOMMENDED';
    recommendations.push('Require trust recovery');
    recommendations.push('Run deeper verification');
  } else if (risk.predictedRiskLevel === 'HIGH' || failures.likelyFailures.includes('verification_failure')) {
    action = 'TRUST_FAILURE_LIKELY';
    recommendations.push('Run deeper verification');
    recommendations.push('Request more evidence');
  } else if (failures.likelyFailures.includes('evidence_contradiction') || failures.likelyFailures.includes('false_completion')) {
    action = 'TRUST_DEGRADING';
    recommendations.push('Request more evidence');
    recommendations.push('Block completion until reality validation improves');
  } else if (risk.predictedRiskLevel === 'MEDIUM' || trend.trendDirection === 'VOLATILE') {
    action = 'TRUST_WATCH';
    recommendations.push('Continue monitoring');
    recommendations.push('Watch trust volatility');
  } else {
    action = 'TRUST_STABLE';
    recommendations.push('Continue monitoring');
  }

  if (failures.likelyFailures.includes('stalled_progress')) {
    recommendations.push('Escalate stall governance review');
  }
  if (failures.likelyFailures.includes('resource_contention')) {
    recommendations.push('Review multi-project resource allocation');
  }

  return { action, recommendations: [...new Set(recommendations)] };
}

export function getRecoveryRecommendationCount(): number {
  return recoveryRecommendationCount;
}

export function resetTrustRecoveryRecommenderForTests(): void {
  recoveryRecommendationCount = 0;
}
