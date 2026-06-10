/**
 * Founder Confidence Engine — confidence roadmap builder.
 */

import type { FounderConfidenceRoadmap, ConfidenceGap, ConfidenceGapAnalysis } from './founder-confidence-types.js';
import { CONFIDENCE_ROADMAP_PASS } from './founder-confidence-types.js';
import { getCachedConfidenceRoadmap, setCachedConfidenceRoadmap } from './founder-confidence-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: ConfidenceGap[], max: number): ConfidenceGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: ConfidenceGap[]): ConfidenceGap[] {
  const rank = { CRITICAL: 1, MAJOR: 2, MINOR: 3 };
  return [...gaps].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function buildFounderConfidenceRoadmap(requestId: string, gapAnalysis: ConfidenceGapAnalysis): FounderConfidenceRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, gapAnalysis.criticalConfidenceGaps.length].join('|');
  const cached = getCachedConfidenceRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const sorted = sortBySeverity(gapAnalysis.gaps);
  const seen = new Set<string>();

  const criticalConfidenceFixes = takeBounded(gapAnalysis.criticalConfidenceGaps, 12);
  for (const g of criticalConfidenceFixes) seen.add(g.gapId);

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

  const futureConfidenceOptimization = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MINOR'),
    12,
  );

  const result: FounderConfidenceRoadmap = {
    criticalConfidenceFixes,
    highPriorityImprovements,
    mediumImprovements,
    futureConfidenceOptimization,
    passToken: CONFIDENCE_ROADMAP_PASS,
  };
  setCachedConfidenceRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetConfidenceRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
