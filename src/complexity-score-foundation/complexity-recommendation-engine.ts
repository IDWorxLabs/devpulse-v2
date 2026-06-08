/**
 * Complexity recommendation engine — creates review recommendations.
 * Recommendations only. No auto-fix or refactoring.
 */

import type { ComplexityAnalysisInput, ComplexityRiskBand, FactorScore } from './types.js';

export interface ComplexityRecommendationResult {
  reviewRecommendation: string;
  recommendations: string[];
  reviewRecommendationCount: number;
}

export function complexityRecommendationKey(riskBand: ComplexityRiskBand, score: number): string {
  return `${riskBand}|${score}`;
}

export function createComplexityRecommendations(
  input: ComplexityAnalysisInput,
  score: number,
  riskBand: ComplexityRiskBand,
  topFactors: FactorScore[],
  blocked: boolean,
): ComplexityRecommendationResult {
  if (blocked) {
    return {
      reviewRecommendation: 'Complexity analysis blocked — no recommendations generated',
      recommendations: ['Complexity scoring measurement only — no auto-fix performed'],
      reviewRecommendationCount: 0,
    };
  }

  const topFactor = topFactors[0]?.factorType.replace(/_/g, ' ').toLowerCase() ?? 'system signals';
  let reviewRecommendation: string;

  switch (riskBand) {
    case 'LOW':
      reviewRecommendation = `Low complexity (${score}/100) — periodic review of ${input.systemArea} recommended`;
      break;
    case 'MEDIUM':
      reviewRecommendation = `Medium complexity (${score}/100) — review ${topFactor} before maintenance burden increases`;
      break;
    case 'HIGH':
      reviewRecommendation = `High complexity (${score}/100) — founder review of ${input.systemArea} recommended before instability`;
      break;
    case 'CRITICAL':
      reviewRecommendation = `Critical complexity (${score}/100) — immediate founder review of ${input.systemArea} required`;
      break;
  }

  const recommendations = [
    `Complexity score ${score}/100 for ${input.systemArea} from ${input.analysisSource}`,
    reviewRecommendation,
    'No architecture modification, registry change, or auto-fix performed',
    'Complexity scoring is measurement only — not a drift detector or source of truth',
  ];

  if (input.driftSignals?.length) {
    recommendations.push('Architecture drift signals used as input — drift detection not replaced');
  }

  if (riskBand === 'CRITICAL' || riskBand === 'HIGH') {
    recommendations.push('Consider simplifying dependencies, reducing gate counts, or consolidating ownership');
  }

  return {
    reviewRecommendation,
    recommendations,
    reviewRecommendationCount: topFactors.length || 1,
  };
}
