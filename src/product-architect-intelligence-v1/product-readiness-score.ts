/**
 * Product Architect Intelligence V1 — readiness and architecture scores.
 */

import {
  CRITICAL_PRODUCT_GAP_PENALTY,
  PRODUCT_READINESS_COMPLETE_THRESHOLD,
  PRODUCT_READINESS_LAUNCH_READY_THRESHOLD,
  PRODUCT_READINESS_REFINEMENT_THRESHOLD,
  WARNING_PRODUCT_GAP_PENALTY,
} from './product-architect-intelligence-bounds.js';
import { resolveProductPattern } from './product-pattern-registry.js';
import type {
  MissingScreenFinding,
  ProductArchitectDomain,
  ProductArchitectureScores,
  ProductGapReport,
  ProductReadinessLabel,
  UserJourneyFinding,
  WorkflowCompletenessFinding,
} from './product-architect-intelligence-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function deriveReadinessLabel(score: number): ProductReadinessLabel {
  if (score >= PRODUCT_READINESS_COMPLETE_THRESHOLD) return 'Architecturally Complete';
  if (score >= PRODUCT_READINESS_LAUNCH_READY_THRESHOLD) return 'Launch Ready';
  if (score >= PRODUCT_READINESS_REFINEMENT_THRESHOLD) return 'Needs Product Refinement';
  return 'Architecturally Incomplete';
}

export function computeProductArchitectureScores(input: {
  domain: ProductArchitectDomain;
  missingScreens: readonly MissingScreenFinding[];
  workflowAnalysis: readonly WorkflowCompletenessFinding[];
  journeyAnalysis: readonly UserJourneyFinding[];
  gapReport: ProductGapReport;
}): ProductArchitectureScores {
  const pattern = resolveProductPattern(input.domain);
  const expectedScreens = pattern?.expectedScreens.length ?? 0;
  const foundScreens =
    expectedScreens === 0
      ? 0
      : expectedScreens - input.missingScreens.length;
  const screenCoverageScore =
    expectedScreens === 0 ? 50 : clamp((foundScreens / expectedScreens) * 100);

  const workflowTotal = input.workflowAnalysis.length;
  const workflowComplete = input.workflowAnalysis.filter((item) => item.complete).length;
  const workflowCompletenessScore =
    workflowTotal === 0 ? 50 : clamp((workflowComplete / workflowTotal) * 100);

  const journeyTotal = input.journeyAnalysis.length;
  const journeyComplete = input.journeyAnalysis.filter((item) => item.complete).length;
  const userJourneyScore =
    journeyTotal === 0 ? 50 : clamp((journeyComplete / journeyTotal) * 100);

  const productCompletenessScore = clamp(
    screenCoverageScore * 0.45 + workflowCompletenessScore * 0.35 + userJourneyScore * 0.2,
  );

  const architectureScore = clamp(
    productCompletenessScore * 0.4 +
      screenCoverageScore * 0.25 +
      workflowCompletenessScore * 0.2 +
      userJourneyScore * 0.15,
  );

  const gapPenalty =
    input.gapReport.criticalGapCount * CRITICAL_PRODUCT_GAP_PENALTY +
    input.gapReport.warningGapCount * WARNING_PRODUCT_GAP_PENALTY;

  const overallProductScore = clamp(architectureScore - Math.min(40, gapPenalty * 0.5));
  const productReadinessScore = clamp(overallProductScore);

  return {
    readOnly: true,
    productCompletenessScore,
    workflowCompletenessScore,
    screenCoverageScore,
    userJourneyScore,
    architectureScore,
    overallProductScore,
    productReadinessScore,
    readinessLabel: deriveReadinessLabel(productReadinessScore),
  };
}

export function buildProductArchitectureRecommendations(input: {
  scores: ProductArchitectureScores;
  gapReport: ProductGapReport;
}): string[] {
  const recommendations: string[] = [];
  if (input.scores.screenCoverageScore < 75) {
    recommendations.push('Add missing core screens before verification and launch review.');
  }
  if (input.scores.workflowCompletenessScore < 80) {
    recommendations.push('Complete primary user workflows end-to-end, including confirmation and recovery paths.');
  }
  if (input.scores.userJourneyScore < 80) {
    recommendations.push('Review first-time, returning, power user, and admin journeys for dead ends.');
  }
  if (input.gapReport.criticalGapCount > 0) {
    recommendations.push(
      `Resolve ${input.gapReport.criticalGapCount} critical product gap(s) flagged in the Product Gap Report.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Product architecture appears complete — proceed to verification with confidence.');
  }
  return recommendations.slice(0, 6);
}
