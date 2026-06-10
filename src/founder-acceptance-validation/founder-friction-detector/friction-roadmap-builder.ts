/**
 * Founder Friction Detector — friction roadmap builder.
 */

import type { FounderFrictionRoadmap, FrictionGap, FrictionGapAnalysis } from './founder-friction-types.js';
import { FRICTION_ROADMAP_PASS } from './founder-friction-types.js';
import { getCachedFrictionRoadmap, setCachedFrictionRoadmap } from './founder-friction-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: FrictionGap[], max: number): FrictionGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: FrictionGap[]): FrictionGap[] {
  const rank = { CRITICAL: 1, MAJOR: 2, MINOR: 3 };
  return [...gaps].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function buildFounderFrictionRoadmap(requestId: string, gapAnalysis: FrictionGapAnalysis): FounderFrictionRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, gapAnalysis.criticalFrictionGaps.length].join('|');
  const cached = getCachedFrictionRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const sorted = sortBySeverity(gapAnalysis.gaps);
  const seen = new Set<string>();

  const criticalFrictionRemoval = takeBounded(gapAnalysis.criticalFrictionGaps, 12);
  for (const g of criticalFrictionRemoval) seen.add(g.gapId);

  const highPriorityImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MAJOR'),
    12,
  );
  for (const g of highPriorityImprovements) seen.add(g.gapId);

  const mediumImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MAJOR'),
    12,
  );
  for (const g of mediumImprovements) seen.add(g.gapId);

  const futureOptimization = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MINOR'),
    12,
  );

  const result: FounderFrictionRoadmap = {
    criticalFrictionRemoval,
    highPriorityImprovements,
    mediumImprovements,
    futureOptimization,
    passToken: FRICTION_ROADMAP_PASS,
  };
  setCachedFrictionRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetFrictionRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
