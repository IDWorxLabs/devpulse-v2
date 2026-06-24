/**
 * Product Architect Intelligence V1 — large-scale validation integration.
 */

import { assessProductArchitecture } from './product-architecture-assessor.js';
import { getLastProductArchitectureAssessment } from './product-architect-intelligence-history.js';
import { PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS } from './product-architect-intelligence-suite-registry.js';
import type { LargeScaleCategoryDefinition } from '../large-scale-multi-app-validation-v1/large-scale-multi-app-validation-types.js';

export interface LargeScaleProductArchitectureMetrics {
  readOnly: true;
  productReadinessScore: number;
  architectureScore: number;
  workflowCoverage: number;
  screenCoverage: number;
  journeyCoverage: number;
  criticalProductGapCount: number;
  architectureConsistent: boolean;
}

export function measureProductArchitectureForCategory(
  category: Pick<LargeScaleCategoryDefinition, 'prompt' | 'profile' | 'productName'>,
): LargeScaleProductArchitectureMetrics {
  const assessment = assessProductArchitecture({
    profile: category.profile,
    productPrompt: category.prompt,
    productName: category.productName,
  });

  return {
    readOnly: true,
    productReadinessScore: assessment.scores.productReadinessScore,
    architectureScore: assessment.scores.architectureScore,
    workflowCoverage: assessment.scores.workflowCompletenessScore,
    screenCoverage: assessment.scores.screenCoverageScore,
    journeyCoverage: assessment.scores.userJourneyScore,
    criticalProductGapCount: assessment.gapReport.criticalGapCount,
    architectureConsistent: assessment.gapReport.criticalGapCount <= 2,
  };
}

export function buildLargeScaleProductArchitectureSummary(): {
  readOnly: true;
  categoriesAssessed: number;
  averageProductReadiness: number;
  averageWorkflowCoverage: number;
  averageArchitectureConsistency: number;
  weakestDomains: readonly string[];
} {
  const assessments = PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS.map((app) =>
    assessProductArchitecture({
      profile: app.profile,
      productPrompt: app.prompt,
      productName: app.productName,
    }),
  );

  const count = assessments.length;
  const average = (values: number[]) =>
    count === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / count);

  const weakestDomains = assessments
    .filter((item) => item.scores.productReadinessScore < 70 || item.gapReport.criticalGapCount > 2)
    .map((item) => item.productName);

  return {
    readOnly: true,
    categoriesAssessed: count,
    averageProductReadiness: average(assessments.map((item) => item.scores.productReadinessScore)),
    averageWorkflowCoverage: average(assessments.map((item) => item.scores.workflowCompletenessScore)),
    averageArchitectureConsistency: average(
      assessments.map((item) => (item.gapReport.criticalGapCount <= 2 ? 100 : 50)),
    ),
    weakestDomains,
  };
}

export function getLastLargeScaleProductArchitectureMetrics(): LargeScaleProductArchitectureMetrics | null {
  const last = getLastProductArchitectureAssessment();
  if (!last) return null;
  return {
    readOnly: true,
    productReadinessScore: last.scores.productReadinessScore,
    architectureScore: last.scores.architectureScore,
    workflowCoverage: last.scores.workflowCompletenessScore,
    screenCoverage: last.scores.screenCoverageScore,
    journeyCoverage: last.scores.userJourneyScore,
    criticalProductGapCount: last.gapReport.criticalGapCount,
    architectureConsistent: last.gapReport.criticalGapCount <= 2,
  };
}
