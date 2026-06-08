/**
 * Trust recommendation engine — creates founder-readable trust recommendations.
 * Recommendations only. No auto-fix or execution.
 */

import type { TrustAssessmentInput, TrustFactorScore, TrustLevel, TrustRiskLevel } from './types.js';

export interface TrustRecommendationResult {
  primaryRecommendation: string;
  trustRecommendations: string[];
  recommendationCount: number;
}

export function trustRecommendationKey(level: TrustLevel, score: number): string {
  return `${level}|${score}`;
}

export function createTrustRecommendations(
  input: TrustAssessmentInput,
  score: number,
  level: TrustLevel,
  riskLevel: TrustRiskLevel,
  topFactors: TrustFactorScore[],
  blocked: boolean,
): TrustRecommendationResult {
  if (blocked) {
    return {
      primaryRecommendation: 'Trust assessment blocked — no recommendations generated',
      trustRecommendations: ['Trust aggregation only — no auto-fix or execution performed'],
      recommendationCount: 0,
    };
  }

  const topFactor = topFactors[0]?.factorType.replace(/_/g, ' ').toLowerCase() ?? 'trust signals';
  let primaryRecommendation: string;

  switch (level) {
    case 'VERY_HIGH':
      primaryRecommendation = `Very high trust (${score}/100) — ${input.assessmentTarget} from ${input.assessmentSource} appears well-supported`;
      break;
    case 'HIGH':
      primaryRecommendation = `High trust (${score}/100) — review ${topFactor} before final founder decision`;
      break;
    case 'MEDIUM':
      primaryRecommendation = `Medium trust (${score}/100) — strengthen evidence and verification before proceeding`;
      break;
    case 'LOW':
      primaryRecommendation = `Low trust (${score}/100) — founder review of ${input.assessmentTarget} recommended`;
      break;
    case 'VERY_LOW':
      primaryRecommendation = `Very low trust (${score}/100) — do not rely on this result without source system review`;
      break;
  }

  const trustRecommendations = [
    `Trust score ${score}/100 for ${input.assessmentTarget} (${input.assessmentSource})`,
    primaryRecommendation,
    'Trust Engine aggregates signals — does not replace verification, evidence ledger, or completion verifier',
    'No execution, deployment, file modification, or auto-fix performed',
  ];

  if (input.evidenceSignals?.length) {
    trustRecommendations.push('Evidence ledger signals reused — evidence ledger remains source of truth');
  }
  if (input.verificationSignals?.length) {
    trustRecommendations.push('Verification gated apply signals reused — verification system not replaced');
  }
  if (input.completionSignals?.length) {
    trustRecommendations.push('Completion verifier signals reused — completion truth not duplicated');
  }
  if (input.predictionSignals?.length) {
    trustRecommendations.push('Future prediction signals used as risk input — prediction system not replaced');
  }

  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    trustRecommendations.push('Review source systems directly before trusting aggregated score');
  }

  return {
    primaryRecommendation,
    trustRecommendations,
    recommendationCount: trustRecommendations.length,
  };
}
