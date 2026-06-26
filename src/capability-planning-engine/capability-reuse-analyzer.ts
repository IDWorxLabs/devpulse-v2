/**
 * Capability Planning Engine Era 3 — capability reuse analysis.
 */

import type { CapabilityGap, ExistingCapabilitySearchResult } from './capability-planning-types.js';

export interface CapabilityReuseSummary {
  readOnly: true;
  reuseCount: number;
  composeCount: number;
  generateCount: number;
  humanReviewCount: number;
  blockedCount: number;
  averageMatchConfidence: number;
}

export function analyzeCapabilityReuse(
  searchResults: readonly ExistingCapabilitySearchResult[],
  gaps: readonly CapabilityGap[],
): CapabilityReuseSummary {
  const reuseCount = gaps.filter((g) => g.decision === 'REUSE_EXISTING').length;
  const composeCount = gaps.filter((g) => g.decision === 'COMPOSE_FROM_EXISTING').length;
  const generateCount = gaps.filter((g) => g.decision === 'GENERATE_MISSING').length;
  const humanReviewCount = gaps.filter((g) => g.decision === 'NEEDS_HUMAN_REVIEW').length;
  const blockedCount = gaps.filter((g) => g.decision === 'BLOCK_BUILD').length;
  const averageMatchConfidence =
    searchResults.length === 0
      ? 0
      : Math.round((searchResults.reduce((sum, r) => sum + r.matchConfidence, 0) / searchResults.length) * 100) / 100;

  return {
    readOnly: true,
    reuseCount,
    composeCount,
    generateCount,
    humanReviewCount,
    blockedCount,
    averageMatchConfidence,
  };
}
