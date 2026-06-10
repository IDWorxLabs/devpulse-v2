/**
 * Product Reality Orchestrator — unified authority builder.
 */

import type {
  BlockerAnalysisResult,
  ConflictDetectionResult,
  FounderPriorityResult,
  ProductRealityAggregate,
  ProductRealityAuthority,
  ProductRealityInput,
  ProductRealityRoadmap,
  ProductRealityVerdict,
  ReleaseReadinessResult,
} from './product-reality-types.js';
import { PRODUCT_REALITY_AUTHORITY_PASS, resolveProductRealityVerdict } from './product-reality-types.js';
import { getCachedProductRealityAuthority, setCachedProductRealityAuthority } from './product-reality-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildProductRealityAuthority(
  requestId: string,
  aggregate: ProductRealityAggregate,
  conflicts: ConflictDetectionResult,
  blockers: BlockerAnalysisResult,
  priorities: FounderPriorityResult,
  roadmap: ProductRealityRoadmap,
  release: ReleaseReadinessResult,
  input: ProductRealityInput,
): ProductRealityAuthority {
  const cacheKey = [
    requestId,
    aggregate.overallExperienceScore,
    blockers.criticalBlockers.length,
    release.releaseReadiness,
  ].join('|');
  const cached = getCachedProductRealityAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const criticalConflicts = conflicts.conflicts.filter(
    (c) => c.conflictSeverity === 'CRITICAL' || c.conflictSeverity === 'HIGH',
  ).length;

  const overallVerdict: ProductRealityVerdict = resolveProductRealityVerdict(
    aggregate.overallExperienceScore,
    blockers.criticalBlockers.length,
    criticalConflicts,
    release.releaseReadiness,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (aggregate.overallExperienceScore + aggregate.trustScore + aggregate.coherenceScore) / 3
      - blockers.criticalBlockers.length * 8
      - criticalConflicts * 4,
  ));

  const authority: ProductRealityAuthority = {
    authorityId: `product-reality-authority-${authorityCounter}`,
    aggregate,
    conflicts: conflicts.conflicts,
    blockers: blockers.blockers,
    founderPriorities: priorities.priorities,
    roadmap,
    releaseReadiness: release.releaseReadiness,
    overallVerdict,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
    passToken: PRODUCT_REALITY_AUTHORITY_PASS,
  };

  setCachedProductRealityAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetProductRealityAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
