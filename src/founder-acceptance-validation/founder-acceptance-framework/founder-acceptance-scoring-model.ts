/**
 * Founder Acceptance Framework — founder acceptance scoring model.
 */

import type {
  CategoryRegistry,
  DimensionRegistry,
  FounderAcceptanceScoreModel,
} from './founder-acceptance-types.js';
import { SCORING_MODEL_PASS } from './founder-acceptance-types.js';
import { getCachedScoringModel, setCachedScoringModel } from './founder-acceptance-cache.js';

let scoringModelBuilds = 0;

const DIMENSION_WEIGHTS: Record<string, number> = {
  FOUNDER_CLARITY: 10,
  FOUNDER_CONFIDENCE: 10,
  FOUNDER_PRODUCTIVITY: 10,
  FOUNDER_TRUST: 12,
  FOUNDER_CONTROL: 8,
  FOUNDER_VISIBILITY: 8,
  FOUNDER_UNDERSTANDING: 10,
  FOUNDER_RELIABILITY: 10,
  FOUNDER_CONTINUITY: 12,
  FOUNDER_ACCEPTANCE: 10,
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  WORKFLOW_ACCEPTANCE: 15,
  TRUST_ACCEPTANCE: 15,
  PRODUCT_ACCEPTANCE: 15,
  PRODUCTIVITY_ACCEPTANCE: 12,
  RELIABILITY_ACCEPTANCE: 12,
  VISIBILITY_ACCEPTANCE: 12,
  LAUNCH_ACCEPTANCE: 19,
};

export function buildFounderAcceptanceScoreModel(
  requestId: string,
  dimensions: DimensionRegistry,
  categories: CategoryRegistry,
): FounderAcceptanceScoreModel {
  const cacheKey = `scoring-${requestId}-${dimensions.dimensions.length}-${categories.categories.length}`;
  const cached = getCachedScoringModel(cacheKey);
  if (cached) return cached;

  scoringModelBuilds += 1;
  const result: FounderAcceptanceScoreModel = {
    dimensionScoreSlots: dimensions.dimensions.map((d) => ({
      dimensionId: d.dimensionId,
      scorePlaceholder: null,
      weight: DIMENSION_WEIGHTS[d.dimensionId] ?? 10,
    })),
    categoryScoreSlots: categories.categories.map((c) => ({
      categoryId: c.categoryId,
      scorePlaceholder: null,
      weight: CATEGORY_WEIGHTS[c.categoryId] ?? 10,
    })),
    overallScorePlaceholder: null,
    weightingStrategy: 'BLENDED',
    supportsFutureInputs: true,
    passToken: SCORING_MODEL_PASS,
  };
  setCachedScoringModel(cacheKey, result);
  return result;
}

export function getScoringModelBuilds(): number {
  return scoringModelBuilds;
}

export function resetFounderAcceptanceScoringModelForTests(): void {
  scoringModelBuilds = 0;
}
