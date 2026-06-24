/**
 * Large-Scale Multi-App Validation V1 — UVL cross-category summary.
 */

import { getLastLargeScaleValidationAssessment } from './large-scale-validation-history.js';
import type { LargeScaleMultiAppValidationAssessment } from './large-scale-multi-app-validation-types.js';

export interface UvlCrossCategoryValidationSummary {
  readOnly: true;
  categoriesTested: number;
  mostReliableCategories: readonly string[];
  weakestCategories: readonly string[];
  untestedCategories: readonly string[];
  averageVerificationCoverage: number;
  averageVerificationConfidence: number;
}

export function buildUvlCrossCategoryValidationSummary(
  assessment?: LargeScaleMultiAppValidationAssessment | null,
): UvlCrossCategoryValidationSummary {
  const data = assessment ?? getLastLargeScaleValidationAssessment();
  if (!data) {
    return {
      readOnly: true,
      categoriesTested: 0,
      mostReliableCategories: [],
      weakestCategories: [],
      untestedCategories: [],
      averageVerificationCoverage: 0,
      averageVerificationConfidence: 0,
    };
  }

  const coverageSum = data.categoryResults.reduce((sum, r) => sum + r.metrics.verificationCoverage, 0);
  const confidenceSum = data.categoryResults.reduce((sum, r) => sum + r.metrics.verificationConfidence, 0);
  const count = data.categoryResults.length;

  return {
    readOnly: true,
    categoriesTested: data.categoriesTested,
    mostReliableCategories: data.strongestCategories,
    weakestCategories: data.weakestCategories,
    untestedCategories: data.untestedCategories,
    averageVerificationCoverage: count === 0 ? 0 : Math.round(coverageSum / count),
    averageVerificationConfidence: count === 0 ? 0 : Math.round(confidenceSum / count),
  };
}
