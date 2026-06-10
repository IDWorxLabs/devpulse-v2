/**
 * Parallel Build Orchestration — execution group management.
 */

import type { OrchestrationProjectInput, OrchestrationStatus } from './orchestration-types.js';
import type { OrchestrationCapacityEvaluation } from './orchestration-types.js';
import { getPriorityScore } from './orchestration-readiness-evaluator.js';

export function buildOrchestrationGroups(
  projects: OrchestrationProjectInput[],
  statuses: Map<string, OrchestrationStatus>,
  capacity: OrchestrationCapacityEvaluation,
): string[][] {
  const ready = projects
    .filter((p) => statuses.get(p.projectId) === 'READY')
    .sort((a, b) => getPriorityScore(b.priority ?? 'NORMAL') - getPriorityScore(a.priority ?? 'NORMAL'));

  const groups: string[][] = [];
  const workspaceInGroup = new Map<number, Set<string>>();
  const groupSize = Math.max(1, capacity.safeLimit);

  for (const project of ready) {
    let placed = false;

    for (let i = 0; i < groups.length; i++) {
      const wsSet = workspaceInGroup.get(i) ?? new Set<string>();
      if (groups[i].length < groupSize && !wsSet.has(project.workspaceId)) {
        groups[i].push(project.projectId);
        wsSet.add(project.workspaceId);
        workspaceInGroup.set(i, wsSet);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const newIndex = groups.length;
      groups.push([project.projectId]);
      workspaceInGroup.set(newIndex, new Set([project.workspaceId]));
    }
  }

  const waiting = projects.filter((p) => {
    const status = statuses.get(p.projectId);
    return status === 'WAITING' || status === 'RESOURCE_BLOCKED';
  });

  if (waiting.length > 0 && groups.length > 0) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup.length < groupSize) {
      for (const w of waiting.slice(0, groupSize - lastGroup.length)) {
        lastGroup.push(w.projectId);
      }
    }
  }

  return groups;
}
