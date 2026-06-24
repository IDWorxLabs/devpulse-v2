/**
 * Large-Scale Multi-App Validation V1 — assessment orchestrator.
 */

import {
  LARGE_SCALE_VALIDATION_SUITE,
  resolveLargeScaleCategory,
} from './large-scale-category-suite-registry.js';
import { measureCrossAppConsistency } from './large-scale-cross-app-consistency.js';
import { classifyCategoryFailure, buildFailureDistribution } from './large-scale-failure-classifier.js';
import {
  computeGeneralizationScore,
  computeWeakestCategoryPenalty,
} from './large-scale-generalization-score.js';
import { recordLargeScaleValidationAssessment } from './large-scale-validation-history.js';
import type {
  LargeScaleCategoryLeaderboardEntry,
  LargeScaleCategoryResult,
  LargeScaleMultiAppValidationAssessment,
  RunLargeScaleValidationInput,
} from './large-scale-multi-app-validation-types.js';
import { computePassRates, runCategoryPipelineMetrics } from './large-scale-validation-metrics.js';

export function runLargeScaleMultiAppValidation(
  input: RunLargeScaleValidationInput = {},
): LargeScaleMultiAppValidationAssessment {
  const categories =
    input.profiles
      ? LARGE_SCALE_VALIDATION_SUITE.filter((cat) => input.profiles!.includes(cat.profile))
      : LARGE_SCALE_VALIDATION_SUITE;

  const categoryResults: LargeScaleCategoryResult[] = [];

  for (const category of categories) {
    const pipeline = runCategoryPipelineMetrics(category);
    const { failureClass, failureDetail } = classifyCategoryFailure({
      metrics: pipeline.metrics,
      requirementPoorlyUnderstood: pipeline.requirementPoorlyUnderstood,
      questioningRequired: pipeline.questioningRequired,
      verificationIncomplete: pipeline.verificationIncomplete,
      aflaPassed: pipeline.aflaPassed,
      aflaVerdict: pipeline.aflaVerdict,
    });

    const passed = pipeline.metrics.pipelineCompleted && pipeline.metrics.generationSuccess;

    categoryResults.push({
      readOnly: true,
      profile: category.profile,
      domain: category.domain,
      productName: category.productName,
      categoryGroup: category.categoryGroup,
      prompt: category.prompt,
      passed: pipeline.metrics.pipelineCompleted && pipeline.metrics.generationSuccess,
      metrics: pipeline.metrics,
      failureClass,
      failureDetail,
      aflaVerdict: pipeline.aflaVerdict,
      cqiDomain: pipeline.cqiDomain,
    });
  }

  const passRates = {
    readOnly: true as const,
    ...computePassRates(categoryResults),
  };

  const crossAppConsistency = {
    readOnly: true as const,
    ...measureCrossAppConsistency(categoryResults),
  };

  const leaderboard: LargeScaleCategoryLeaderboardEntry[] = categoryResults
    .map((result) => ({
      readOnly: true as const,
      profile: result.profile,
      productName: result.productName,
      categoryGroup: result.categoryGroup,
      score: Math.round(
        (result.metrics.requirementConfidence +
          result.metrics.verificationConfidence +
          result.metrics.aflaOverallScore) /
          3,
      ),
      passed: result.passed,
    }))
    .sort((a, b) => b.score - a.score);

  const weakestCategories = leaderboard
    .filter((entry) => !entry.passed || entry.score < 40)
    .slice(-8)
    .map((entry) => entry.productName);

  const strongestCategories = leaderboard
    .filter((entry) => entry.passed)
    .slice(0, 8)
    .map((entry) => entry.productName);

  const pipelineCompletionRate =
    categoryResults.length === 0
      ? 0
      : Math.round(
          (categoryResults.filter((r) => r.metrics.pipelineCompleted).length / categoryResults.length) * 100,
        );

  const weakestPenalty = computeWeakestCategoryPenalty(weakestCategories, categoryResults.length);

  const generalizationScore = computeGeneralizationScore({
    passRates,
    crossAppConsistency,
    categoriesTested: categoryResults.length,
    pipelineCompletionRate,
    weakestCategoryPenalty: weakestPenalty,
  });

  const assessment: LargeScaleMultiAppValidationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'AiDevEngine Large-Scale Validation',
    categoriesTested: categoryResults.length,
    categoriesPassed: categoryResults.filter((r) => r.passed).length,
    passRates,
    failureDistribution: buildFailureDistribution(categoryResults),
    generalizationScore,
    crossAppConsistency,
    categoryResults,
    categoryLeaderboard: leaderboard,
    weakestCategories,
    strongestCategories,
    untestedCategories: [],
    generatedAt: new Date().toISOString(),
  };

  recordLargeScaleValidationAssessment(assessment);
  return assessment;
}

export function assessLargeScaleCategory(profile: string): LargeScaleCategoryResult {
  const category = resolveLargeScaleCategory(profile);
  const pipeline = runCategoryPipelineMetrics(category);
  const { failureClass, failureDetail } = classifyCategoryFailure({
    metrics: pipeline.metrics,
    requirementPoorlyUnderstood: pipeline.requirementPoorlyUnderstood,
    questioningRequired: pipeline.questioningRequired,
    verificationIncomplete: pipeline.verificationIncomplete,
    aflaPassed: pipeline.aflaPassed,
    aflaVerdict: pipeline.aflaVerdict,
  });

  return {
    readOnly: true,
    profile: category.profile,
    domain: category.domain,
    productName: category.productName,
    categoryGroup: category.categoryGroup,
    prompt: category.prompt,
    passed: pipeline.metrics.pipelineCompleted && pipeline.metrics.generationSuccess,
    metrics: pipeline.metrics,
    failureClass,
    failureDetail,
    aflaVerdict: pipeline.aflaVerdict,
    cqiDomain: pipeline.cqiDomain,
  };
}
