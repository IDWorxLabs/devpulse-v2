/**
 * AFLA Trust Calibration V1 — confidence calibration analysis.
 */

import type { AutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';
import { CONFIDENCE_ACCURACY_MAX_GAP } from './afla-trust-calibration-bounds.js';
import type { ConfidenceCalibrationReport } from './afla-trust-calibration-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function analyzeConfidenceCalibration(
  assessment: AutonomousFounderLaunchAssessment,
): ConfidenceCalibrationReport {
  const founderReviewer = assessment.reviewers.find((r) => r.role === 'founder');
  const founderConfidence = founderReviewer?.founderConfidence ?? assessment.scores.founderScore;

  const evidenceScores = [
    assessment.evidence.buildReality.score,
    assessment.evidence.blueprintStructure.score,
    assessment.evidence.blueprintVisual.score,
    assessment.evidence.featureReality.score,
    assessment.evidence.universalFeatureContract.score,
    assessment.evidence.engineeringReality.score,
    assessment.evidence.launchReadiness.score,
  ].filter((score) => score > 0);

  const evidenceQualityScore =
    evidenceScores.length === 0
      ? 0
      : clamp(evidenceScores.reduce((sum, score) => sum + score, 0) / evidenceScores.length);

  const verificationConfidence =
    assessment.evidence.verificationHub?.verificationConfidenceScore ?? evidenceQualityScore;

  const blendedEvidence = clamp(evidenceQualityScore * 0.6 + verificationConfidence * 0.4);
  const confidenceGap = founderConfidence - blendedEvidence;
  const inflated = confidenceGap > CONFIDENCE_ACCURACY_MAX_GAP;
  const tooConservative = confidenceGap < -CONFIDENCE_ACCURACY_MAX_GAP;
  const aligned = !inflated && !tooConservative;

  return {
    readOnly: true,
    founderConfidence,
    evidenceQualityScore: blendedEvidence,
    verificationConfidence,
    confidenceGap,
    inflated,
    tooConservative,
    aligned,
  };
}
