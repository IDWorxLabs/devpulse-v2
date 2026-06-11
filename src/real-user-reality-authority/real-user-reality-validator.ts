/**
 * Real User Reality Authority Validator — bounded integrity checks.
 */

import {
  REAL_USER_CONFUSION_BLOCK_SCORE,
  REAL_USER_SUCCESS_BLOCK_SCORE,
} from './real-user-reality-bounds.js';
import { MAX_REAL_USER_CATEGORIES } from './real-user-reality-scenarios.js';
import type { RealUserRealityAssessment } from './real-user-reality-types.js';

const ALLOWED_EVIDENCE_TYPES = ['REAL_USER', 'FOUNDER_USER', 'SIMULATED_USER', 'NO_EVIDENCE'] as const;

export function validateRealUserCategoryCount(): { passed: boolean; detail: string } {
  return { passed: MAX_REAL_USER_CATEGORIES === 5, detail: `count=${MAX_REAL_USER_CATEGORIES}` };
}

export function validateEvidenceClassification(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  const invalid = assessment.evidenceItems.filter(
    (item) => !ALLOWED_EVIDENCE_TYPES.includes(item.evidenceType),
  );
  const hasFounder = assessment.evidenceItems.some((item) => item.evidenceType === 'FOUNDER_USER');
  return {
    passed: invalid.length === 0 && hasFounder,
    detail: `items=${assessment.evidenceItems.length}; founder=${hasFounder}`,
  };
}

export function validateNoRealUserDetection(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  const expected = assessment.realUserEvidenceCount === 0;
  return {
    passed: assessment.noRealUserEvidence === expected,
    detail: `noRealUser=${assessment.noRealUserEvidence}; count=${assessment.realUserEvidenceCount}`,
  };
}

export function validateRetentionScoring(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.userRetentionScore >= 0 && assessment.userRetentionScore <= 100,
    detail: String(assessment.userRetentionScore),
  };
}

export function validateConfusionScoring(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.userConfusionScore >= 0 && assessment.userConfusionScore <= 100,
    detail: String(assessment.userConfusionScore),
  };
}

export function validateRealUserLaunchBlocking(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.userSuccessScore < REAL_USER_SUCCESS_BLOCK_SCORE ||
    assessment.userConfusionScore > REAL_USER_CONFUSION_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateRealUserDeterministicScoring(
  first: RealUserRealityAssessment,
  second: RealUserRealityAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.realUserRealityScore === second.realUserRealityScore &&
      first.userEvidenceScore === second.userEvidenceScore &&
      first.noRealUserEvidence === second.noRealUserEvidence,
    detail: `${first.realUserRealityScore}:${first.userEvidenceScore}`,
  };
}

export function validateRealUserRecommendationGeneration(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0 && assessment.findings.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateRealUserAdvisoryOnly(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}

export function validateFounderEvidenceSeparation(assessment: RealUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  const realUserItems = assessment.evidenceItems.filter((item) => item.evidenceType === 'REAL_USER');
  return {
    passed: realUserItems.length === assessment.realUserEvidenceCount,
    detail: `real=${assessment.realUserEvidenceCount}; founder=${assessment.founderOnlyEvidenceCount}`,
  };
}
