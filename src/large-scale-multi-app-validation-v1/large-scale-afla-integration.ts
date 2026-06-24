/**
 * Large-Scale Multi-App Validation V1 — AFLA trust calibration integration.
 */

import { getLastLargeScaleValidationAssessment } from './large-scale-validation-history.js';

export function computeLargeScaleTrustAdjustment(): {
  penalty: number;
  weakestCategories: readonly string[];
  generalizationScore: number;
  reason: string | null;
} {
  const assessment = getLastLargeScaleValidationAssessment();
  if (!assessment) {
    return {
      penalty: 0,
      weakestCategories: [],
      generalizationScore: 0,
      reason: null,
    };
  }

  let penalty = 0;
  if (assessment.generalizationScore < 70) {
    penalty += Math.round((70 - assessment.generalizationScore) * 0.4);
  }
  if (assessment.weakestCategories.length > 5) {
    penalty += 5;
  }
  if (assessment.passRates.aflaSuccessRate < 20 && assessment.categoriesTested > 10) {
    penalty += 3;
  }

  const reason =
    penalty > 0
      ? `Large-scale validation exposed weaknesses (generalization ${assessment.generalizationScore}/100, ${assessment.weakestCategories.length} weak categories)`
      : null;

  return {
    penalty: Math.min(25, penalty),
    weakestCategories: assessment.weakestCategories,
    generalizationScore: assessment.generalizationScore,
    reason,
  };
}
