/**
 * Drift recommendation engine — creates review recommendations.
 * Recommendations only. No auto-fix or architecture modification.
 */

import type { DriftAnalysisInput, DriftFinding, DriftType, OverallDriftRisk } from './types.js';

export interface DriftRecommendationResult {
  recommendedReview: string;
  recommendedAction: string;
  recommendations: string[];
  reviewRecommendationCount: number;
}

export function driftRecommendationKey(driftType: DriftType, risk: OverallDriftRisk): string {
  return `${driftType}|${risk}`;
}

const REVIEW_BY_TYPE: Record<DriftType, string> = {
  DUPLICATE_OWNERSHIP_DRIFT: 'Review ownership registry for competing domain owners',
  DUPLICATE_SOURCE_OF_TRUTH_DRIFT: 'Review source-of-truth map for duplicate writers',
  PHASE_ORDER_DRIFT: 'Review phase gate assignments and build order',
  DEPENDENCY_DRIFT: 'Review upstream dependency chain integrity',
  GOVERNANCE_BYPASS_DRIFT: 'Review governance stack for bypass paths',
  WORLD_BOUNDARY_DRIFT: 'Review World 1 / World 2 boundary enforcement',
  MOBILE_STACK_DRIFT: 'Review mobile stack — command surface must not become executor',
  SELF_EVOLUTION_DRIFT: 'Review self-evolution modules for behavior modification',
  CAPABILITY_ACQUISITION_DRIFT: 'Review capability acquisition — planning only, no acquisition',
  LEARNING_OVERLAP_DRIFT: 'Review self_learning_engine vs world2_learning_loop separation',
  EXECUTION_AUTHORITY_DRIFT: 'Review execution authority claims — non-execution modules must not execute',
  UNKNOWN: 'General architecture review recommended',
};

export function createDriftRecommendations(
  input: DriftAnalysisInput,
  findings: DriftFinding[],
  primaryDriftType: DriftType,
  overallRisk: OverallDriftRisk,
  blocked: boolean,
): DriftRecommendationResult {
  if (blocked) {
    return {
      recommendedReview: 'Drift analysis blocked — no review recommendations generated',
      recommendedAction: 'Resolve blocked inputs before re-running drift analysis',
      recommendations: ['Drift detection observer only — no auto-fix performed'],
      reviewRecommendationCount: 0,
    };
  }

  if (findings.length === 0) {
    return {
      recommendedReview: 'No architectural drift detected — periodic review still recommended',
      recommendedAction: 'Continue monitoring — no immediate action required',
      recommendations: [
        'Architecture appears compliant with expected rules',
        'No execution, file modification, or auto-fix performed',
        'Drift detection observer only — not a source of truth',
      ],
      reviewRecommendationCount: 1,
    };
  }

  const primaryFinding = findings[0];
  const recommendedReview = REVIEW_BY_TYPE[primaryDriftType] ?? REVIEW_BY_TYPE.UNKNOWN;
  const recommendedAction =
    overallRisk === 'CRITICAL' || overallRisk === 'HIGH'
      ? 'Immediate founder architecture review required before proceeding'
      : 'Schedule architecture review — no auto-fix performed';

  const recommendations = [
    `${findings.length} drift finding(s) detected from ${input.analysisSource}`,
    recommendedReview,
    'No architecture modification, registry change, or auto-fix performed',
    'Human review required — drift detection is observer only',
  ];

  if (overallRisk === 'CRITICAL') {
    recommendations.push('CRITICAL drift risk — halt related development until reviewed');
  }

  for (const finding of findings.slice(0, 3)) {
    recommendations.push(`Review: ${finding.recommendedReview}`);
  }

  return {
    recommendedReview: primaryFinding?.recommendedReview ?? recommendedReview,
    recommendedAction,
    recommendations,
    reviewRecommendationCount: findings.length,
  };
}
