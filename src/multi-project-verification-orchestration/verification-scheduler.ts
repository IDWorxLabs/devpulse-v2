/**
 * Multi Project Verification Orchestration — schedule building (planning only).
 */

import type { VerificationGroup, VerificationOrchestrationProjectInput } from './verification-orchestration-types.js';
import type { VerificationDependencyBuildResult } from './verification-dependency-manager.js';
import { getVerificationPriorityScore } from './verification-readiness-evaluator.js';
import { getCachedVerificationSchedule, setCachedVerificationSchedule } from './verification-cache.js';

export function buildVerificationSchedule(
  planId: string,
  projects: VerificationOrchestrationProjectInput[],
  dependencyResult: VerificationDependencyBuildResult,
  groups: VerificationGroup[],
): VerificationGroup[] {
  const cached = getCachedVerificationSchedule(planId);
  if (cached) return cached;

  const orderedGroups: VerificationGroup[] = [];

  for (const group of groups) {
    const sorted = [...group.projectIds].sort((a, b) => {
      const depthA = getDependencyDepth(a, projects);
      const depthB = getDependencyDepth(b, projects);
      if (depthA !== depthB) return depthA - depthB;
      const pa = projects.find((p) => p.projectId === a);
      const pb = projects.find((p) => p.projectId === b);
      return getVerificationPriorityScore(pb ?? { projectId: b, workspaceId: '' })
        - getVerificationPriorityScore(pa ?? { projectId: a, workspaceId: '' });
    });

    orderedGroups.push({
      groupId: group.groupId,
      projectIds: sorted,
      status: group.status,
    });
  }

  if (orderedGroups.length === 0 && projects.length > 0) {
    const fallback = projects
      .filter((p) => !(p.dependsOn?.length))
      .map((p) => p.projectId)
      .sort((a, b) => {
        const pa = projects.find((p) => p.projectId === a);
        const pb = projects.find((p) => p.projectId === b);
        return getVerificationPriorityScore(pb ?? { projectId: b, workspaceId: '' })
          - getVerificationPriorityScore(pa ?? { projectId: a, workspaceId: '' });
      });

    if (fallback.length > 0) {
      orderedGroups.push({
        groupId: 'verification-group-fallback',
        projectIds: fallback,
        status: 'READY',
      });
    }
  }

  setCachedVerificationSchedule(planId, orderedGroups);
  return orderedGroups;
}

function getDependencyDepth(projectId: string, projects: VerificationOrchestrationProjectInput[]): number {
  const project = projects.find((p) => p.projectId === projectId);
  if (!project || !(project.dependsOn?.length)) return 0;
  return 1 + Math.max(...project.dependsOn.map((d) => getDependencyDepth(d, projects)));
}
