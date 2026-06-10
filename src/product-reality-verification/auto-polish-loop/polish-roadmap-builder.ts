/**
 * Auto-Polish Loop — polish roadmap builder.
 */

import type { PolishOpportunity, PolishPriorityAnalysis, PolishRoadmap } from './auto-polish-types.js';
import { POLISH_ROADMAP_PASS } from './auto-polish-types.js';
import { getCachedPolishRoadmap, setCachedPolishRoadmap } from './auto-polish-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: PolishOpportunity[], max: number): PolishOpportunity[] {
  return list.slice(0, max);
}

export function buildPolishRoadmap(requestId: string, priority: PolishPriorityAnalysis): PolishRoadmap {
  const cacheKey = [requestId, priority.launchBlockers.length, priority.priority1.length].join('|');
  const cached = getCachedPolishRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;

  const criticalBeforeLaunch = takeBounded(
    [...priority.launchBlockers, ...priority.priority1.filter((o) => o.impactLevel === 'CRITICAL')],
    12,
  );
  const seen = new Set(criticalBeforeLaunch.map((o) => o.opportunityId));

  const highImpactImprovements = takeBounded(
    priority.priority1.filter((o) => !seen.has(o.opportunityId))
      .concat(priority.priority2.filter((o) => o.impactLevel === 'HIGH')),
    12,
  );
  for (const o of highImpactImprovements) seen.add(o.opportunityId);

  const qualityImprovements = takeBounded(
    priority.priority2.filter((o) => !seen.has(o.opportunityId))
      .concat(priority.priority3),
    12,
  );
  for (const o of qualityImprovements) seen.add(o.opportunityId);

  const optionalFutureImprovements = takeBounded(
    priority.priority4.filter((o) => !seen.has(o.opportunityId)),
    12,
  );

  const result: PolishRoadmap = {
    criticalBeforeLaunch,
    highImpactImprovements,
    qualityImprovements,
    optionalFutureImprovements,
    passToken: POLISH_ROADMAP_PASS,
  };
  setCachedPolishRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetPolishRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
