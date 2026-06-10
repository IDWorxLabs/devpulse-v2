/**
 * Parallel Build Orchestration — schedule building (planning only).
 */

import type { OrchestrationProjectInput } from './orchestration-types.js';
import type { DependencyBuildResult } from './orchestration-dependency-manager.js';
import { getPriorityScore } from './orchestration-readiness-evaluator.js';
import { getCachedSchedule, setCachedSchedule } from './orchestration-cache.js';

export function buildOrchestrationSchedule(
  planId: string,
  projects: OrchestrationProjectInput[],
  dependencyResult: DependencyBuildResult,
  executionGroups: string[][],
): string[][] {
  const cached = getCachedSchedule(planId);
  if (cached) return cached;

  const orderedGroups: string[][] = [];

  for (const group of executionGroups) {
    const sorted = [...group].sort((a, b) => {
      const pa = projects.find((p) => p.projectId === a);
      const pb = projects.find((p) => p.projectId === b);
      const depthA = getDependencyDepth(a, projects);
      const depthB = getDependencyDepth(b, projects);
      if (depthA !== depthB) return depthA - depthB;
      return getPriorityScore(pb?.priority ?? 'NORMAL') - getPriorityScore(pa?.priority ?? 'NORMAL');
    });
    orderedGroups.push(sorted);
  }

  if (orderedGroups.length === 0 && projects.length > 0) {
    const fallback = projects
      .filter((p) => !(p.dependsOn?.length))
      .map((p) => p.projectId)
      .sort((a, b) => getPriorityScore(
        projects.find((p) => p.projectId === b)?.priority ?? 'NORMAL',
      ) - getPriorityScore(
        projects.find((p) => p.projectId === a)?.priority ?? 'NORMAL',
      ));

    if (fallback.length > 0) {
      orderedGroups.push(fallback);
    }
  }

  setCachedSchedule(planId, orderedGroups);
  return orderedGroups;
}

function getDependencyDepth(projectId: string, projects: OrchestrationProjectInput[]): number {
  const project = projects.find((p) => p.projectId === projectId);
  if (!project || !(project.dependsOn?.length)) return 0;
  return 1 + Math.max(...project.dependsOn.map((d) => getDependencyDepth(d, projects)));
}
