/**
 * Product Experience Verification Engine — experience roadmap builder.
 */

import type { ExperienceGap, ExperienceGapAnalysis, ProductExperienceRoadmap } from './product-experience-types.js';
import { EXPERIENCE_ROADMAP_PASS } from './product-experience-types.js';
import { severityToRank } from './product-experience-types.js';
import { getCachedExperienceRoadmap, setCachedExperienceRoadmap } from './product-experience-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: ExperienceGap[], max: number): ExperienceGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: ExperienceGap[]): ExperienceGap[] {
  return [...gaps].sort((a, b) => severityToRank(a.severity) - severityToRank(b.severity));
}

const COHERENCE_CODES = new Set(['PRODUCT_FRAGMENTATION', 'DISCONNECTED_EXPERIENCE', 'DUPLICATED_CONCEPTS', 'PRODUCT_IDENTITY_DRIFT', 'GENERIC_TOOL_FEEL']);
const LAUNCH_CODES = new Set(['LAUNCH_CONTINUITY_RISK', 'READINESS_MISMATCH']);

export function buildExperienceRoadmap(requestId: string, gapAnalysis: ExperienceGapAnalysis): ProductExperienceRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, gapAnalysis.criticalGaps.length].join('|');
  const cached = getCachedExperienceRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const sorted = sortBySeverity(gapAnalysis.gaps);
  const seen = new Set<string>();

  const criticalExperienceFixes = takeBounded(
    sorted.filter((g) => g.severity === 'CRITICAL' || gapAnalysis.criticalGaps.includes(g)),
    12,
  );
  for (const g of criticalExperienceFixes) seen.add(g.gapId);

  const highImpactImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && (g.severity === 'HIGH' || g.severity === 'CRITICAL')),
    12,
  );
  for (const g of highImpactImprovements) seen.add(g.gapId);

  const productCoherenceImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && COHERENCE_CODES.has(g.detectionCode)),
    12,
  );
  for (const g of productCoherenceImprovements) seen.add(g.gapId);

  const launchReadinessImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && LAUNCH_CODES.has(g.detectionCode)),
    12,
  );
  for (const g of launchReadinessImprovements) seen.add(g.gapId);

  const futureEnhancements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && (g.severity === 'LOW' || g.severity === 'MEDIUM')),
    12,
  );

  const result: ProductExperienceRoadmap = {
    criticalExperienceFixes,
    highImpactImprovements,
    productCoherenceImprovements,
    launchReadinessImprovements,
    futureEnhancements,
    passToken: EXPERIENCE_ROADMAP_PASS,
  };
  setCachedExperienceRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetExperienceRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
