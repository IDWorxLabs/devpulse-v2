/**
 * Founder Trust Validation — trust roadmap builder.
 */

import type { FounderTrustRoadmap, TrustGap, TrustGapAnalysis } from './founder-trust-types.js';
import { TRUST_ROADMAP_PASS } from './founder-trust-types.js';
import { getCachedTrustRoadmap, setCachedTrustRoadmap } from './founder-trust-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: TrustGap[], max: number): TrustGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: TrustGap[]): TrustGap[] {
  const rank = { CRITICAL: 1, MAJOR: 2, MINOR: 3 };
  return [...gaps].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function buildFounderTrustRoadmap(requestId: string, gapAnalysis: TrustGapAnalysis): FounderTrustRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, gapAnalysis.criticalTrustGaps.length].join('|');
  const cached = getCachedTrustRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const sorted = sortBySeverity(gapAnalysis.gaps);
  const seen = new Set<string>();

  const criticalTrustFixes = takeBounded(gapAnalysis.criticalTrustGaps, 12);
  for (const g of criticalTrustFixes) seen.add(g.gapId);

  const highPriorityTrustImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MAJOR'),
    12,
  );
  for (const g of highPriorityTrustImprovements) seen.add(g.gapId);

  const mediumImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MAJOR'),
    12,
  );
  for (const g of mediumImprovements) seen.add(g.gapId);

  const futureTrustOptimization = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MINOR'),
    12,
  );

  const result: FounderTrustRoadmap = {
    criticalTrustFixes,
    highPriorityTrustImprovements,
    mediumImprovements,
    futureTrustOptimization,
    passToken: TRUST_ROADMAP_PASS,
  };
  setCachedTrustRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetTrustRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
