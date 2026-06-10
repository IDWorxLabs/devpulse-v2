/**
 * Product Reality Orchestrator — release readiness analyzer.
 */

import type {
  BlockerAnalysisResult,
  ConflictDetectionResult,
  ProductRealityAggregate,
  ReleaseReadiness,
  ReleaseReadinessResult,
} from './product-reality-types.js';
import { RELEASE_READINESS_PASS } from './product-reality-types.js';
import { getCachedReleaseReadiness, setCachedReleaseReadiness } from './product-reality-cache.js';

let releaseReadinessCount = 0;

export function analyzeReleaseReadiness(
  requestId: string,
  aggregate: ProductRealityAggregate,
  blockers: BlockerAnalysisResult,
  conflicts: ConflictDetectionResult,
): ReleaseReadinessResult {
  const cacheKey = [
    requestId,
    aggregate.overallExperienceScore,
    blockers.criticalBlockers.length,
    conflicts.conflicts.length,
  ].join('|');
  const cached = getCachedReleaseReadiness(cacheKey);
  if (cached) return cached;

  releaseReadinessCount += 1;

  let releaseReadiness: ReleaseReadiness;
  let readinessExplanation: string;

  if (blockers.criticalBlockers.length > 0 || aggregate.criticalIssueCount > 2 || aggregate.overallExperienceScore < 55) {
    releaseReadiness = 'NOT_READY';
    readinessExplanation = 'Critical blockers or failures prevent release readiness claim';
  } else if (
    aggregate.overallExperienceScore >= 80
    && blockers.blockers.length === 0
    && conflicts.conflicts.filter((c) => c.conflictSeverity === 'CRITICAL' || c.conflictSeverity === 'HIGH').length === 0
  ) {
    releaseReadiness = 'READY';
    readinessExplanation = 'Aggregate authority supports release readiness with no critical blockers or high-severity conflicts';
  } else {
    releaseReadiness = 'PARTIALLY_READY';
    readinessExplanation = 'Product shows progress but blockers, conflicts, or score gaps remain before full release readiness';
  }

  const readinessScore = Math.round(
    aggregate.overallExperienceScore
      - blockers.criticalBlockers.length * 15
      - blockers.blockers.length * 3
      - conflicts.conflicts.length * 2,
  );

  const result: ReleaseReadinessResult = {
    releaseReadiness,
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    readinessExplanation,
    passToken: RELEASE_READINESS_PASS,
  };
  setCachedReleaseReadiness(cacheKey, result);
  return result;
}

export function getReleaseReadinessCount(): number {
  return releaseReadinessCount;
}

export function resetReleaseReadinessAnalyzerForTests(): void {
  releaseReadinessCount = 0;
}
