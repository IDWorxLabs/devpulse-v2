/**
 * Founder Productivity Validation — productivity roadmap builder.
 */

import type { FounderProductivityRoadmap, ProductivityGap, ProductivityGapAnalysis } from './founder-productivity-types.js';
import { PRODUCTIVITY_ROADMAP_PASS } from './founder-productivity-types.js';
import { getCachedProductivityRoadmap, setCachedProductivityRoadmap } from './founder-productivity-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: ProductivityGap[], max: number): ProductivityGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: ProductivityGap[]): ProductivityGap[] {
  const rank = { CRITICAL: 1, MAJOR: 2, MINOR: 3 };
  return [...gaps].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function buildFounderProductivityRoadmap(requestId: string, gapAnalysis: ProductivityGapAnalysis): FounderProductivityRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, gapAnalysis.criticalProductivityGaps.length].join('|');
  const cached = getCachedProductivityRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const sorted = sortBySeverity(gapAnalysis.gaps);
  const seen = new Set<string>();

  const criticalProductivityFixes = takeBounded(gapAnalysis.criticalProductivityGaps, 12);
  for (const g of criticalProductivityFixes) seen.add(g.gapId);

  const highPriorityProductivityImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MAJOR'),
    12,
  );
  for (const g of highPriorityProductivityImprovements) seen.add(g.gapId);

  const mediumImprovements = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MAJOR'),
    12,
  );
  for (const g of mediumImprovements) seen.add(g.gapId);

  const futureProductivityOptimization = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MINOR'),
    12,
  );

  const result: FounderProductivityRoadmap = {
    criticalProductivityFixes,
    highPriorityProductivityImprovements,
    mediumImprovements,
    futureProductivityOptimization,
    passToken: PRODUCTIVITY_ROADMAP_PASS,
  };
  setCachedProductivityRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetProductivityRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
