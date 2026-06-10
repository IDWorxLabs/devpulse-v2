/**
 * Founder Acceptance Orchestrator — acceptance aggregation builder.
 */

import type { FounderAcceptanceAggregate } from './founder-acceptance-orchestrator-types.js';
import { ACCEPTANCE_AGGREGATION_PASS, clampScore } from './founder-acceptance-orchestrator-types.js';
import { getCachedAcceptanceAggregate, setCachedAcceptanceAggregate } from './founder-acceptance-cache.js';

export interface AcceptanceAggregationUpstream {
  workflowScore: number;
  confidenceScore: number;
  trustScore: number;
  productivityScore: number;
  frictionScore: number;
  readinessScore: number;
  criticalGapCount: number;
  majorGapCount: number;
  minorGapCount: number;
  criticalBlockerCount: number;
}

const DIMENSION_WEIGHT = 1 / 6;
const FRICTION_WEIGHT_MODIFIER = 0.85;

let aggregateBuildCount = 0;

export function buildFounderAcceptanceAggregate(
  requestId: string,
  upstream: AcceptanceAggregationUpstream,
): FounderAcceptanceAggregate {
  const cacheKey = [
    requestId,
    upstream.workflowScore,
    upstream.confidenceScore,
    upstream.trustScore,
    upstream.productivityScore,
    upstream.frictionScore,
    upstream.readinessScore,
  ].join('|');
  const cached = getCachedAcceptanceAggregate(cacheKey);
  if (cached) return cached;

  aggregateBuildCount += 1;

  const overallAcceptanceScore = clampScore(Math.round(
    upstream.workflowScore * DIMENSION_WEIGHT
      + upstream.confidenceScore * DIMENSION_WEIGHT
      + upstream.trustScore * DIMENSION_WEIGHT
      + upstream.productivityScore * DIMENSION_WEIGHT
      + upstream.frictionScore * DIMENSION_WEIGHT * FRICTION_WEIGHT_MODIFIER
      + upstream.readinessScore * DIMENSION_WEIGHT,
  ));

  const result: FounderAcceptanceAggregate = {
    workflowScore: upstream.workflowScore,
    confidenceScore: upstream.confidenceScore,
    trustScore: upstream.trustScore,
    productivityScore: upstream.productivityScore,
    frictionScore: upstream.frictionScore,
    readinessScore: upstream.readinessScore,
    overallAcceptanceScore,
    criticalGapCount: upstream.criticalGapCount,
    majorGapCount: upstream.majorGapCount,
    minorGapCount: upstream.minorGapCount,
    criticalBlockerCount: upstream.criticalBlockerCount,
    passToken: ACCEPTANCE_AGGREGATION_PASS,
  };

  setCachedAcceptanceAggregate(cacheKey, result);
  return result;
}

export function getAggregateBuildCount(): number {
  return aggregateBuildCount;
}

export function resetAcceptanceAggregationBuilderForTests(): void {
  aggregateBuildCount = 0;
}
