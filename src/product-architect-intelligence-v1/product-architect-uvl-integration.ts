/**
 * Product Architect Intelligence V1 — UVL integration.
 */

import type { ProductArchitectureAssessment } from './product-architect-intelligence-types.js';
import { getLastProductArchitectureAssessment } from './product-architect-intelligence-history.js';
import { listCriticalProductGaps } from './product-gap-report-builder.js';

export interface UvlProductArchitectureSummary {
  readOnly: true;
  productReadinessScore: number;
  architectureScore: number;
  workflowCompletenessScore: number;
  userJourneyScore: number;
  screenCoverageScore: number;
  readinessLabel: string;
  criticalProductGapCount: number;
  criticalProductGaps: readonly string[];
  productArchitectureCoverage: number;
}

export function buildUvlProductArchitectureSummary(
  assessment?: ProductArchitectureAssessment | null,
): UvlProductArchitectureSummary {
  const data = assessment ?? getLastProductArchitectureAssessment();
  if (!data) {
    return {
      readOnly: true,
      productReadinessScore: 0,
      architectureScore: 0,
      workflowCompletenessScore: 0,
      userJourneyScore: 0,
      screenCoverageScore: 0,
      readinessLabel: 'Architecturally Incomplete',
      criticalProductGapCount: 0,
      criticalProductGaps: [],
      productArchitectureCoverage: 0,
    };
  }

  const criticalGaps = listCriticalProductGaps(data.gapReport);

  return {
    readOnly: true,
    productReadinessScore: data.scores.productReadinessScore,
    architectureScore: data.scores.architectureScore,
    workflowCompletenessScore: data.scores.workflowCompletenessScore,
    userJourneyScore: data.scores.userJourneyScore,
    screenCoverageScore: data.scores.screenCoverageScore,
    readinessLabel: data.scores.readinessLabel,
    criticalProductGapCount: data.gapReport.criticalGapCount,
    criticalProductGaps: criticalGaps.map((gap) => gap.summary),
    productArchitectureCoverage: data.scores.productCompletenessScore,
  };
}
