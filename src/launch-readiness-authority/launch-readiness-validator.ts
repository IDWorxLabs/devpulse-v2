/**
 * Launch Readiness Authority Validator — bounded integrity checks.
 */

import {
  assertAuthorityWeightIntegrity,
  AUTHORITY_WEIGHTS,
  CONFIDENCE_INTERNAL_USE,
  CONFIDENCE_PUBLIC_BETA,
  CONFIDENCE_PUBLIC_LAUNCH,
  CONFIDENCE_PRIVATE_BETA,
} from './launch-readiness-thresholds.js';
import type { LaunchReadinessAuthorityAssessment } from './launch-readiness-types.js';

export function validateAuthorityWeighting(): { passed: boolean; detail: string } {
  const total = Object.values(AUTHORITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  return {
    passed: assertAuthorityWeightIntegrity(),
    detail: `authorities=${Object.keys(AUTHORITY_WEIGHTS).length}; total=${total}`,
  };
}

export function validateRecommendationGeneration(assessment: LaunchReadinessAuthorityAssessment): {
  passed: boolean;
  detail: string;
} {
  const allowed = [
    'READY_FOR_PUBLIC_LAUNCH',
    'READY_FOR_PUBLIC_BETA',
    'READY_FOR_PRIVATE_BETA',
    'READY_FOR_INTERNAL_USE',
    'NOT_READY_FOR_LAUNCH',
  ] as const;
  return {
    passed:
      allowed.includes(assessment.recommendation) &&
      assessment.recommendation === assessment.decision.recommendation,
    detail: assessment.recommendation,
  };
}

export function validateConfidenceScoring(assessment: LaunchReadinessAuthorityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.launchConfidenceScore >= 0 &&
      assessment.launchConfidenceScore <= 100 &&
      assessment.launchReadinessAuthorityScore === assessment.launchConfidenceScore,
    detail: String(assessment.launchConfidenceScore),
  };
}

export function validateBlockerDetection(assessment: LaunchReadinessAuthorityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.blockingAuthorityCount === assessment.blockers.length &&
      assessment.blockingAuthorityCount === assessment.decision.blockingAuthorities.length,
    detail: `blockers=${assessment.blockingAuthorityCount}`,
  };
}

export function validateLaunchReadinessLaunchBlocking(assessment: LaunchReadinessAuthorityAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock = assessment.recommendation === 'NOT_READY_FOR_LAUNCH';
  return {
    passed: assessment.readinessState === 'BLOCKED' ? shouldBlock : true,
    detail: `state=${assessment.readinessState}; recommendation=${assessment.recommendation}`,
  };
}

export function validateLaunchReadinessDeterministicScoring(
  first: LaunchReadinessAuthorityAssessment,
  second: LaunchReadinessAuthorityAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.recommendation === second.recommendation &&
      first.launchConfidenceScore === second.launchConfidenceScore &&
      first.blockingAuthorityCount === second.blockingAuthorityCount &&
      first.supportingAuthorityCount === second.supportingAuthorityCount,
    detail: `${first.recommendation}:${first.launchConfidenceScore}`,
  };
}

export function validateLaunchReadinessRecommendationGeneration(assessment: LaunchReadinessAuthorityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0 && assessment.rationale.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateLaunchReadinessAdvisoryOnly(assessment: LaunchReadinessAuthorityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}

export function validateConfidenceThresholds(): { passed: boolean; detail: string } {
  return {
    passed:
      CONFIDENCE_PUBLIC_LAUNCH === 90 &&
      CONFIDENCE_PUBLIC_BETA === 80 &&
      CONFIDENCE_PRIVATE_BETA === 70 &&
      CONFIDENCE_INTERNAL_USE === 60,
    detail: `${CONFIDENCE_PUBLIC_LAUNCH}/${CONFIDENCE_PUBLIC_BETA}/${CONFIDENCE_PRIVATE_BETA}/${CONFIDENCE_INTERNAL_USE}`,
  };
}

export function validateEvidenceBreakdown(assessment: LaunchReadinessAuthorityAssessment): {
  passed: boolean;
  detail: string;
} {
  const invalid = assessment.evidenceBreakdown.filter(
    (entry) => entry.weightPercent <= 0 || entry.weightPercent > 100,
  );
  return {
    passed: invalid.length === 0 && assessment.evidenceBreakdown.length > 0,
    detail: `entries=${assessment.evidenceBreakdown.length}`,
  };
}
