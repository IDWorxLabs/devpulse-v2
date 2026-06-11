/**
 * Adoption Prediction Authority Validator — bounded integrity checks.
 */

import {
  ADOPTION_ABANDONMENT_BLOCK_SCORE,
  ADOPTION_PREDICTION_BLOCK_SCORE,
} from './adoption-prediction-bounds.js';
import { MAX_ADOPTION_CATEGORIES } from './adoption-prediction-scenarios.js';
import type { AdoptionPredictionAssessment } from './adoption-prediction-types.js';

export function validateAdoptionCategoryCount(): { passed: boolean; detail: string } {
  return { passed: MAX_ADOPTION_CATEGORIES === 5, detail: `count=${MAX_ADOPTION_CATEGORIES}` };
}

export function validateRetentionPrediction(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.retentionPredictionScore >= 0 && assessment.retentionPredictionScore <= 100,
    detail: String(assessment.retentionPredictionScore),
  };
}

export function validateRecommendationPrediction(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.recommendationPredictionScore >= 0 && assessment.recommendationPredictionScore <= 100,
    detail: String(assessment.recommendationPredictionScore),
  };
}

export function validateAbandonmentPrediction(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.abandonmentRiskScore >= 0 && assessment.abandonmentRiskScore <= 100,
    detail: String(assessment.abandonmentRiskScore),
  };
}

export function validateEvidenceConfidenceCalculation(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.evidenceConfidenceScore >= 0 && assessment.evidenceConfidenceScore <= 100,
    detail: String(assessment.evidenceConfidenceScore),
  };
}

export function validateAdoptionLaunchBlocking(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.adoptionPredictionScore < ADOPTION_PREDICTION_BLOCK_SCORE ||
    assessment.retentionPredictionScore < ADOPTION_PREDICTION_BLOCK_SCORE ||
    assessment.abandonmentRiskScore > ADOPTION_ABANDONMENT_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateAdoptionDeterministicScoring(
  first: AdoptionPredictionAssessment,
  second: AdoptionPredictionAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.adoptionPredictionScore === second.adoptionPredictionScore &&
      first.retentionPredictionScore === second.retentionPredictionScore &&
      first.abandonmentRiskScore === second.abandonmentRiskScore &&
      first.evidenceConfidenceScore === second.evidenceConfidenceScore,
    detail: `${first.adoptionPredictionScore}:${first.retentionPredictionScore}`,
  };
}

export function validateAdoptionRecommendationGeneration(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0 && assessment.findings.length >= 5,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateAdoptionAdvisoryOnly(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}

export function validateLowConfidenceNotPresentedAsFact(assessment: AdoptionPredictionAssessment): {
  passed: boolean;
  detail: string;
} {
  const mentionsPrediction = assessment.findings.some((finding) =>
    finding.toLowerCase().includes('prediction'),
  );
  const mentionsConfidence = assessment.findings.some((finding) =>
    finding.toLowerCase().includes('confidence'),
  );
  return {
    passed: mentionsPrediction && mentionsConfidence,
    detail: `confidence=${assessment.evidenceConfidenceScore}`,
  };
}
