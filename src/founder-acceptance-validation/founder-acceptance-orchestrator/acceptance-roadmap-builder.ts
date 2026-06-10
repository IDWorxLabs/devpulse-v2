/**
 * Founder Acceptance Orchestrator — acceptance roadmap builder.
 */

import type {
  FounderAcceptanceRoadmap,
  AcceptanceGap,
  AcceptanceGapAnalysis,
  AcceptanceBlockerAnalysis,
} from './founder-acceptance-orchestrator-types.js';
import { ACCEPTANCE_ROADMAP_PASS } from './founder-acceptance-orchestrator-types.js';
import { createAcceptanceGap } from './acceptance-gap-model.js';
import { getCachedAcceptanceRoadmap, setCachedAcceptanceRoadmap } from './founder-acceptance-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: AcceptanceGap[], max: number): AcceptanceGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: AcceptanceGap[]): AcceptanceGap[] {
  const rank = { CRITICAL: 1, MAJOR: 2, MINOR: 3 };
  return [...gaps].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function blockersToGaps(blockers: AcceptanceBlockerAnalysis): AcceptanceGap[] {
  return blockers.criticalAcceptanceBlockers.map((b) => createAcceptanceGap({
    title: b.title,
    description: b.description,
    severity: b.severity,
    analysisCode: b.blockerCode,
    sourceAnalyzer: b.sourceAnalyzer,
  }));
}

export function buildFounderAcceptanceRoadmap(
  requestId: string,
  gapAnalysis: AcceptanceGapAnalysis,
  blockers: AcceptanceBlockerAnalysis,
): FounderAcceptanceRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, blockers.blockers.length].join('|');
  const cached = getCachedAcceptanceRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const blockerGaps = blockersToGaps(blockers);
  const sorted = sortBySeverity([...gapAnalysis.gaps, ...blockerGaps]);
  const seen = new Set<string>();

  const criticalAcceptanceFixes = takeBounded(
    [...gapAnalysis.criticalAcceptanceGaps, ...blockerGaps.filter((g) => g.severity === 'CRITICAL')],
    12,
  );
  for (const g of criticalAcceptanceFixes) seen.add(g.gapId);

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

  const futureAcceptanceOptimization = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MINOR'),
    12,
  );
  for (const g of futureAcceptanceOptimization) seen.add(g.gapId);

  const launchAcceptanceTasks = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && (
      g.analysisCode.includes('LAUNCH')
      || g.analysisCode.includes('READINESS')
      || g.analysisCode.includes('ADOPTION')
    )),
    12,
  );

  const result: FounderAcceptanceRoadmap = {
    criticalAcceptanceFixes,
    highPriorityImprovements,
    mediumImprovements,
    futureAcceptanceOptimization,
    launchAcceptanceTasks,
    passToken: ACCEPTANCE_ROADMAP_PASS,
  };
  setCachedAcceptanceRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetAcceptanceRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
