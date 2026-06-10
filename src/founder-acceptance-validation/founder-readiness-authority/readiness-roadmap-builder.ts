/**
 * Founder Readiness Authority — readiness roadmap builder.
 */

import type {
  FounderReadinessRoadmap,
  ReadinessGap,
  ReadinessGapAnalysis,
  ReadinessBlockerAnalysis,
} from './founder-readiness-types.js';
import { READINESS_ROADMAP_PASS } from './founder-readiness-types.js';
import { createReadinessGap } from './readiness-gap-model.js';
import { getCachedReadinessRoadmap, setCachedReadinessRoadmap } from './founder-readiness-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: ReadinessGap[], max: number): ReadinessGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: ReadinessGap[]): ReadinessGap[] {
  const rank = { CRITICAL: 1, MAJOR: 2, MINOR: 3 };
  return [...gaps].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function blockersToGaps(blockers: ReadinessBlockerAnalysis): ReadinessGap[] {
  return blockers.criticalReadinessBlockers.map((b) => createReadinessGap({
    title: b.title,
    description: b.description,
    severity: b.severity,
    analysisCode: b.blockerCode,
    sourceAnalyzer: b.sourceAnalyzer,
    readinessContext: 'LAUNCH_READINESS',
  }));
}

export function buildFounderReadinessRoadmap(
  requestId: string,
  gapAnalysis: ReadinessGapAnalysis,
  readinessBlockers: ReadinessBlockerAnalysis,
): FounderReadinessRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, readinessBlockers.blockers.length].join('|');
  const cached = getCachedReadinessRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const blockerGaps = blockersToGaps(readinessBlockers);
  const sorted = sortBySeverity([...gapAnalysis.gaps, ...blockerGaps]);
  const seen = new Set<string>();

  const criticalReadinessFixes = takeBounded(
    [...gapAnalysis.criticalReadinessGaps, ...blockerGaps.filter((g) => g.severity === 'CRITICAL')],
    12,
  );
  for (const g of criticalReadinessFixes) seen.add(g.gapId);

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

  const futureReadinessOptimization = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MINOR'),
    12,
  );
  for (const g of futureReadinessOptimization) seen.add(g.gapId);

  const launchPreparation = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && (
      g.readinessContext === 'LAUNCH_READINESS'
      || g.analysisCode.includes('LAUNCH')
      || g.analysisCode.includes('ADOPTION')
    )),
    12,
  );

  const result: FounderReadinessRoadmap = {
    criticalReadinessFixes,
    highPriorityImprovements,
    mediumImprovements,
    futureReadinessOptimization,
    launchPreparation,
    passToken: READINESS_ROADMAP_PASS,
  };
  setCachedReadinessRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetReadinessRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
