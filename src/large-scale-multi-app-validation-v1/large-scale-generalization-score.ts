/**
 * Large-Scale Multi-App Validation V1 — AiDevEngine Generalization Score.
 */

import type {
  LargeScaleCrossAppConsistency,
  LargeScalePassRates,
} from './large-scale-multi-app-validation-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeGeneralizationScore(input: {
  passRates: LargeScalePassRates;
  crossAppConsistency: LargeScaleCrossAppConsistency;
  categoriesTested: number;
  pipelineCompletionRate: number;
  weakestCategoryPenalty: number;
}): number {
  const breadthScore = clamp((input.categoriesTested / 50) * 15);
  const generationAdaptation = input.passRates.generationSuccessRate * 0.25;
  const pipelineScore = input.pipelineCompletionRate * 0.2;
  const consistencyScore = input.crossAppConsistency.overallConsistency * 0.25;
  const verificationBreadth = input.passRates.blueprintSuccessRate * 0.1 + input.passRates.featureRealitySuccessRate * 0.05;
  const aflaBreadth = input.passRates.aflaSuccessRate * 0.1;

  const raw =
    breadthScore +
    generationAdaptation +
    pipelineScore +
    consistencyScore +
    verificationBreadth +
    aflaBreadth -
    input.weakestCategoryPenalty;

  return clamp(raw);
}

export function computeWeakestCategoryPenalty(
  weakestCategories: readonly string[],
  totalCategories: number,
): number {
  if (totalCategories === 0) return 0;
  const ratio = weakestCategories.length / totalCategories;
  return clamp(ratio * 30);
}
