/**
 * Founder Readiness Authority — authority builder.
 */

import type {
  FounderReadinessAuthority,
  FounderReadinessResult,
  FounderReadinessStatus,
  FounderReadinessRoadmap,
  FounderReadinessAuthorityInput,
  WorkflowReadinessAnalysis,
  ConfidenceReadinessAnalysis,
  TrustReadinessAnalysis,
  ProductivityReadinessAnalysis,
  FrictionReadinessAnalysis,
  ReadinessBlockerAnalysis,
  ReadinessGapAnalysis,
} from './founder-readiness-types.js';
import { resolveFounderReadinessResult, resolveFounderReadinessStatus } from './founder-readiness-types.js';
import { countCriticalGaps } from './readiness-gap-model.js';
import { getCachedFounderReadinessAuthority, setCachedFounderReadinessAuthority } from './founder-readiness-cache.js';

const ANALYZER_WEIGHT = 1 / 5;
const FRICTION_WEIGHT_MODIFIER = 0.85;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildFounderReadinessAuthority(
  requestId: string,
  workflowReadiness: WorkflowReadinessAnalysis,
  confidenceReadiness: ConfidenceReadinessAnalysis,
  trustReadiness: TrustReadinessAnalysis,
  productivityReadiness: ProductivityReadinessAnalysis,
  frictionReadiness: FrictionReadinessAnalysis,
  readinessBlockers: ReadinessBlockerAnalysis,
  gapAnalysis: ReadinessGapAnalysis,
  roadmap: FounderReadinessRoadmap,
  input: FounderReadinessAuthorityInput,
  launchBlockerCount: number,
): FounderReadinessAuthority {
  const cacheKey = [
    requestId,
    workflowReadiness.score, confidenceReadiness.score, trustReadiness.score,
    productivityReadiness.score, frictionReadiness.score,
  ].join('|');
  const cached = getCachedFounderReadinessAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderReadinessScore = Math.round(
    workflowReadiness.score * ANALYZER_WEIGHT
      + confidenceReadiness.score * ANALYZER_WEIGHT
      + trustReadiness.score * ANALYZER_WEIGHT
      + productivityReadiness.score * ANALYZER_WEIGHT
      + frictionReadiness.score * ANALYZER_WEIGHT * FRICTION_WEIGHT_MODIFIER,
  );

  const criticalGaps = countCriticalGaps(gapAnalysis.gaps);
  const majorGaps = gapAnalysis.majorReadinessGaps.length;
  const warningCount = majorGaps + gapAnalysis.minorReadinessGaps.length;
  const criticalBlockers = readinessBlockers.criticalReadinessBlockers.length;

  const founderReadinessResult: FounderReadinessResult = resolveFounderReadinessResult(
    founderReadinessScore,
    criticalGaps + criticalBlockers,
    warningCount,
    input.governanceBlocked,
  );

  const founderReadinessStatus: FounderReadinessStatus = resolveFounderReadinessStatus(
    founderReadinessScore,
    criticalGaps + criticalBlockers,
    majorGaps,
    launchBlockerCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (founderReadinessScore + workflowReadiness.score + trustReadiness.score) / 3
      - (criticalGaps + criticalBlockers) * 6,
  ));

  const authority: FounderReadinessAuthority = {
    authorityId: `founder-readiness-authority-${authorityCounter}`,
    workflowReadiness,
    confidenceReadiness,
    trustReadiness,
    productivityReadiness,
    frictionReadiness,
    readinessBlockers,
    gapAnalysis,
    roadmap,
    founderReadinessScore: Math.max(0, founderReadinessScore),
    founderReadinessResult,
    founderReadinessStatus,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
  };

  setCachedFounderReadinessAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderReadinessAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
