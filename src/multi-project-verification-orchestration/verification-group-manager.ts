/**
 * Multi Project Verification Orchestration — verification group management.
 */

import type {
  VerificationGroup,
  VerificationOrchestrationProjectInput,
  VerificationOrchestrationStatus,
} from './verification-orchestration-types.js';
import type { VerificationCapacityEvaluation } from './verification-orchestration-types.js';
import {
  getConfidenceBand,
  getRiskBand,
  getVerificationPriorityScore,
} from './verification-readiness-evaluator.js';

let groupCounter = 0;

export function buildVerificationGroups(
  projects: VerificationOrchestrationProjectInput[],
  statuses: Map<string, VerificationOrchestrationStatus>,
  capacity: VerificationCapacityEvaluation,
): VerificationGroup[] {
  const ready = projects
    .filter((p) => statuses.get(p.projectId) === 'READY')
    .sort((a, b) => getVerificationPriorityScore(b) - getVerificationPriorityScore(a));

  const groups: VerificationGroup[] = [];
  const workspaceInGroup = new Map<number, Set<string>>();
  const groupSize = Math.max(1, capacity.safeLimit);

  for (const project of ready) {
    let placed = false;
    const band = `${getConfidenceBand(project.confidence ?? 50)}-${getRiskBand(project.riskScore ?? 30)}`;

    for (let i = 0; i < groups.length; i++) {
      const wsSet = workspaceInGroup.get(i) ?? new Set<string>();
      if (groups[i].projectIds.length < groupSize && !wsSet.has(project.workspaceId)) {
        groups[i].projectIds.push(project.projectId);
        wsSet.add(project.workspaceId);
        workspaceInGroup.set(i, wsSet);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groupCounter += 1;
      const newIndex = groups.length;
      groups.push({
        groupId: `verification-group-${groupCounter}-${band}`,
        projectIds: [project.projectId],
        status: 'READY',
      });
      workspaceInGroup.set(newIndex, new Set([project.workspaceId]));
    }
  }

  const waiting = projects.filter((p) => {
    const status = statuses.get(p.projectId);
    return status === 'WAITING' || status === 'CAPACITY_BLOCKED';
  });

  if (waiting.length > 0) {
    groupCounter += 1;
    const waitingGroup: VerificationGroup = {
      groupId: `verification-group-${groupCounter}-waiting`,
      projectIds: waiting.slice(0, groupSize).map((p) => p.projectId),
      status: 'WAITING',
    };
    if (waitingGroup.projectIds.length > 0) {
      groups.push(waitingGroup);
    }
  }

  const blocked = projects.filter((p) => {
    const status = statuses.get(p.projectId);
    return status === 'BLOCKED' || status === 'DEPENDENCY_BLOCKED';
  });

  if (blocked.length > 0) {
    groupCounter += 1;
    groups.push({
      groupId: `verification-group-${groupCounter}-blocked`,
      projectIds: blocked.map((p) => p.projectId),
      status: 'BLOCKED',
    });
  }

  return groups;
}

export function resetVerificationGroupCounterForTests(): void {
  groupCounter = 0;
}
