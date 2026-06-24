/**
 * AFLA Trust Calibration V1 — composite trust score.
 */

import { VERDICT_STABILITY_MAX_VARIANCE } from './afla-trust-calibration-bounds.js';
import type {
  ConfidenceCalibrationReport,
  ReviewerAlignmentReport,
  VerdictStabilityReport,
} from './afla-trust-calibration-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeAflaTrustScore(input: {
  verdictStability: VerdictStabilityReport;
  falsePositiveCount: number;
  falseNegativeCount: number;
  confidenceCalibration: ConfidenceCalibrationReport;
  reviewerAlignment: ReviewerAlignmentReport;
}): number {
  let score = 100;

  if (!input.verdictStability.verdictStable) score -= 25;
  if (!input.verdictStability.scoreStable) {
    score -= Math.min(20, input.verdictStability.scoreVariance * 2);
  }
  if (!input.verdictStability.confidenceStable) {
    score -= Math.min(15, input.verdictStability.confidenceVariance * 2);
  }

  score -= input.falsePositiveCount * 15;
  score -= input.falseNegativeCount * 10;

  if (input.confidenceCalibration.inflated) score -= 12;
  if (input.confidenceCalibration.tooConservative) score -= 8;
  if (input.confidenceCalibration.aligned) score += 5;

  if (input.reviewerAlignment.extremeDisagreement) score -= 15;

  const stabilityBonus =
    input.verdictStability.verdictStable &&
    input.verdictStability.scoreVariance <= VERDICT_STABILITY_MAX_VARIANCE
      ? 5
      : 0;

  return clamp(score + stabilityBonus);
}

export function deriveVerdictQuality(trustScore: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (trustScore >= 80) return 'HIGH';
  if (trustScore >= 60) return 'MEDIUM';
  return 'LOW';
}
