/**
 * Large-Scale Multi-App Validation V1 — per-category pipeline metrics.
 */

import { assessCqiMaturity } from '../clarifying-question-intelligence/index.js';
import { buildFounderLaunchAssessmentFromPrompt } from '../afla-trust-calibration-v1/afla-trust-verdict-stability.js';
import { assessUvlMaturity } from '../unified-verification-lab/index.js';
import { measureProductArchitectureForCategory } from '../product-architect-intelligence-v1/product-architect-large-scale-integration.js';
import type { LargeScaleCategoryDefinition, LargeScaleCategoryMetrics } from './large-scale-multi-app-validation-types.js';

export function runCategoryPipelineMetrics(
  category: LargeScaleCategoryDefinition,
): {
  metrics: LargeScaleCategoryMetrics;
  cqiDomain: string;
  questioningRequired: boolean;
  requirementPoorlyUnderstood: boolean;
  verificationIncomplete: boolean;
  aflaVerdict: string;
  aflaPassed: boolean;
} {
  const cqi = assessCqiMaturity({ userPrompt: category.prompt });
  const uvl = assessUvlMaturity({
    profile: category.profile,
    productPrompt: category.prompt,
  });
  const afla = buildFounderLaunchAssessmentFromPrompt({
    productPrompt: category.prompt,
    profile: category.profile,
    productName: category.productName,
  });
  const productArchitecture = measureProductArchitectureForCategory(category);

  const evidence = afla.evidence;

  const metrics: LargeScaleCategoryMetrics = {
    readOnly: true,
    generationSuccess: cqi.productDomain !== 'GENERIC' || cqi.openQuestions.length > 0,
    buildSuccess: evidence.buildReality.available && evidence.buildReality.passed,
    blueprintSuccess:
      (evidence.blueprintStructure.available && evidence.blueprintStructure.passed) ||
      (evidence.blueprintVisual.available && evidence.blueprintVisual.passed),
    featureRealitySuccess:
      evidence.featureReality.passed || evidence.universalFeatureContract.passed,
    engineeringSuccess: evidence.engineeringReality.available && evidence.engineeringReality.passed,
    aflaSuccess: afla.passed,
    requirementConfidence: cqi.requirementConfidenceScore,
    verificationCoverage: uvl.overallCoveragePercent,
    verificationConfidence: uvl.verificationConfidenceScore,
    aflaOverallScore: afla.scores.overallFounderScore,
    productReadinessScore: productArchitecture.productReadinessScore,
    workflowCoverage: productArchitecture.workflowCoverage,
    architectureConsistency: productArchitecture.architectureConsistent,
    pipelineCompleted: Boolean(afla.launchDecisionExplainability?.decisionSummary),
  };

  return {
    metrics,
    cqiDomain: cqi.productDomain,
    questioningRequired: cqi.questioningRequired,
    requirementPoorlyUnderstood:
      cqi.criticalGapCount > 0 || cqi.requirementConfidenceScore < 75,
    verificationIncomplete: uvl.incompleteVerification,
    aflaVerdict: afla.verdict,
    aflaPassed: afla.passed,
  };
}

export function computePassRates(
  results: readonly { metrics: LargeScaleCategoryMetrics; passed: boolean }[],
): {
  generationSuccessRate: number;
  buildSuccessRate: number;
  blueprintSuccessRate: number;
  featureRealitySuccessRate: number;
  engineeringSuccessRate: number;
  aflaSuccessRate: number;
  overallPassRate: number;
} {
  const total = results.length;
  if (total === 0) {
    return {
      generationSuccessRate: 0,
      buildSuccessRate: 0,
      blueprintSuccessRate: 0,
      featureRealitySuccessRate: 0,
      engineeringSuccessRate: 0,
      aflaSuccessRate: 0,
      overallPassRate: 0,
    };
  }

  const rate = (flag: (m: LargeScaleCategoryMetrics) => boolean) =>
    Math.round((results.filter((r) => flag(r.metrics)).length / total) * 100);

  return {
    generationSuccessRate: rate((m) => m.generationSuccess),
    buildSuccessRate: rate((m) => m.buildSuccess),
    blueprintSuccessRate: rate((m) => m.blueprintSuccess),
    featureRealitySuccessRate: rate((m) => m.featureRealitySuccess),
    engineeringSuccessRate: rate((m) => m.engineeringSuccess),
    aflaSuccessRate: rate((m) => m.aflaSuccess),
    overallPassRate: Math.round((results.filter((r) => r.passed).length / total) * 100),
  };
}
