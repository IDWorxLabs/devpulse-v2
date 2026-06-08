/**
 * Prevention recommendation engine — generates prevention recommendations.
 * Recommendation only. No auto-fix.
 */

import type {
  OverallFutureRisk,
  PredictionAnalysisInput,
  PredictionType,
  ProblemPrediction,
  RiskLevel,
} from './types.js';

export interface PreventionRecommendationResult {
  preventionRecommendation: string;
  recommendations: string[];
  recommendationCount: number;
}

export function preventionRecommendationKey(risk: OverallFutureRisk, predictionCount: number): string {
  return `${risk}|${predictionCount}`;
}

function riskLabel(risk: RiskLevel | OverallFutureRisk): string {
  return risk.charAt(0) + risk.slice(1).toLowerCase();
}

export function createPreventionRecommendations(
  input: PredictionAnalysisInput,
  predictions: ProblemPrediction[],
  overallFutureRisk: OverallFutureRisk,
  blocked: boolean,
): PreventionRecommendationResult {
  if (blocked) {
    return {
      preventionRecommendation: 'Prediction blocked — no prevention recommendation',
      recommendations: ['Resolve blocked prediction inputs before forecasting future problems'],
      recommendationCount: 1,
    };
  }

  const top = predictions[0];
  const preventionRecommendation = top
    ? `${riskLabel(overallFutureRisk)} future risk (${predictions.length} prediction(s)) — review ${input.systemArea} before ${top.forecastTimeframe.replace(/_/g, ' ').toLowerCase()} timeframe`
    : `Low future risk — periodic review of ${input.systemArea} recommended`;

  const recommendations: string[] = [
    `Review ${input.systemArea} signals before predicted failure window`,
    'Confirm governance gates remain open for affected systems',
    'Validate ownership boundaries for overlapping system areas',
    'Schedule founder review if critical predictions emerge',
  ];

  for (const prediction of predictions.slice(0, 3)) {
    recommendations.push(
      `Prevent ${prediction.predictionType.replace(/_/g, ' ').toLowerCase()}: ${prediction.predictionReason}`,
    );
  }

  if (overallFutureRisk === 'CRITICAL' || overallFutureRisk === 'HIGH') {
    recommendations.push('Immediate architecture and governance review recommended — prediction only, no auto-fix');
  }

  return {
    preventionRecommendation,
    recommendations,
    recommendationCount: recommendations.length,
  };
}

export function recommendationForType(type: PredictionType, riskLevel: RiskLevel): string {
  return `Review ${type.replace(/_/g, ' ').toLowerCase()} before ${riskLevel} risk materializes`;
}
