/**
 * Product Architect Intelligence V1 — AFLA confidence integration.
 */

import {
  AFLA_PRODUCT_ARCHITECTURE_MAX_PENALTY,
  PRODUCT_READINESS_REFINEMENT_THRESHOLD,
} from './product-architect-intelligence-bounds.js';
import type { ProductArchitectureAssessment } from './product-architect-intelligence-types.js';
import { getLastProductArchitectureAssessment } from './product-architect-intelligence-history.js';

export function computeProductArchitectureAflaPenalty(
  assessment?: ProductArchitectureAssessment | null,
): {
  penalty: number;
  architecturallyIncomplete: boolean;
  reason: string | null;
  productReadinessScore: number;
  criticalGapCount: number;
} {
  const data = assessment ?? getLastProductArchitectureAssessment();
  if (!data) {
    return {
      penalty: 0,
      architecturallyIncomplete: false,
      reason: null,
      productReadinessScore: 0,
      criticalGapCount: 0,
    };
  }

  let penalty = 0;
  if (data.scores.productReadinessScore < PRODUCT_READINESS_REFINEMENT_THRESHOLD) {
    penalty += Math.round((PRODUCT_READINESS_REFINEMENT_THRESHOLD - data.scores.productReadinessScore) * 0.35);
  }
  if (data.gapReport.criticalGapCount > 0) {
    penalty += data.gapReport.criticalGapCount * 4;
  }
  if (data.scores.workflowCompletenessScore < 70) {
    penalty += 5;
  }

  const architecturallyIncomplete =
    data.scores.productReadinessScore < PRODUCT_READINESS_REFINEMENT_THRESHOLD ||
    data.gapReport.criticalGapCount > 2;

  const reason =
    penalty > 0
      ? `Product architecture gaps detected (readiness ${data.scores.productReadinessScore}/100, ${data.gapReport.criticalGapCount} critical gap(s))`
      : null;

  return {
    penalty: Math.min(AFLA_PRODUCT_ARCHITECTURE_MAX_PENALTY, penalty),
    architecturallyIncomplete,
    reason,
    productReadinessScore: data.scores.productReadinessScore,
    criticalGapCount: data.gapReport.criticalGapCount,
  };
}
