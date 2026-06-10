/**
 * Founder Workflow Validation — workflow roadmap builder.
 */

import type { FounderWorkflowRoadmap, WorkflowGap, WorkflowGapAnalysis } from './founder-workflow-types.js';
import { WORKFLOW_ROADMAP_PASS } from './founder-workflow-types.js';
import { getCachedWorkflowRoadmap, setCachedWorkflowRoadmap } from './founder-workflow-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: WorkflowGap[], max: number): WorkflowGap[] {
  return list.slice(0, max);
}

function sortBySeverity(gaps: WorkflowGap[]): WorkflowGap[] {
  const rank = { CRITICAL: 1, MAJOR: 2, MINOR: 3 };
  return [...gaps].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function buildFounderWorkflowRoadmap(requestId: string, gapAnalysis: WorkflowGapAnalysis): FounderWorkflowRoadmap {
  const cacheKey = [requestId, gapAnalysis.gaps.length, gapAnalysis.criticalWorkflowGaps.length].join('|');
  const cached = getCachedWorkflowRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const sorted = sortBySeverity(gapAnalysis.gaps);
  const seen = new Set<string>();

  const criticalWorkflowFixes = takeBounded(gapAnalysis.criticalWorkflowGaps, 12);
  for (const g of criticalWorkflowFixes) seen.add(g.gapId);

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

  const futureWorkflowOptimization = takeBounded(
    sorted.filter((g) => !seen.has(g.gapId) && g.severity === 'MINOR'),
    12,
  );

  const result: FounderWorkflowRoadmap = {
    criticalWorkflowFixes,
    highPriorityImprovements,
    mediumImprovements,
    futureWorkflowOptimization,
    passToken: WORKFLOW_ROADMAP_PASS,
  };
  setCachedWorkflowRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetWorkflowRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
