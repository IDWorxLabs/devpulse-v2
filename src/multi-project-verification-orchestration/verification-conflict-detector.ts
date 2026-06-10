/**
 * Multi Project Verification Orchestration — conflict detection.
 */

import type {
  VerificationConflict,
  VerificationGroup,
  VerificationOrchestrationProjectInput,
} from './verification-orchestration-types.js';
import type { VerificationDependencyBuildResult } from './verification-dependency-manager.js';

let conflictCounter = 0;
let totalConflictCount = 0;

export function detectVerificationConflicts(
  projects: VerificationOrchestrationProjectInput[],
  dependencyResult: VerificationDependencyBuildResult,
  groups: VerificationGroup[],
): VerificationConflict[] {
  const conflicts: VerificationConflict[] = [];
  const scheduled = new Set<string>();

  for (const cycle of dependencyResult.cycles) {
    conflicts.push(createConflict(
      'dependency_cycle',
      'CRITICAL',
      `Verification dependency cycle: ${cycle.join(' -> ')}`,
      'Remove or break verification dependency cycle',
      cycle,
    ));
  }

  for (const missing of dependencyResult.missing) {
    conflicts.push(createConflict(
      'missing_dependency',
      'HIGH',
      missing,
      'Register missing verification dependency or remove dependency',
      [],
    ));
  }

  for (const group of groups) {
    const workspacesInGroup = new Set<string>();
    for (const projectId of group.projectIds) {
      const project = projects.find((p) => p.projectId === projectId);
      if (!project) continue;

      if (scheduled.has(projectId)) {
        conflicts.push(createConflict(
          'duplicate_scheduling',
          'HIGH',
          `Project ${projectId} scheduled in multiple verification groups`,
          'Deduplicate verification schedule',
          [projectId],
        ));
      }
      scheduled.add(projectId);

      if (project.isolationOk === false) {
        conflicts.push(createConflict(
          'isolation_conflict',
          'CRITICAL',
          `Isolation conflict for ${projectId}`,
          'Resolve workspace isolation before verification orchestration',
          [projectId],
        ));
      }

      if (workspacesInGroup.has(project.workspaceId)) {
        conflicts.push(createConflict(
          'workspace_conflict',
          'MEDIUM',
          `Workspace ${project.workspaceId} has multiple projects in verification group ${group.groupId}`,
          'Separate workspace projects into different verification groups',
          group.projectIds.filter(
            (id) => projects.find((p) => p.projectId === id)?.workspaceId === project.workspaceId,
          ),
        ));
      }
      workspacesInGroup.add(project.workspaceId);

      if (project.resourceAvailable === false) {
        conflicts.push(createConflict(
          'resource_conflict',
          'HIGH',
          `Insufficient resources for verification of ${projectId}`,
          'Allocate resources or queue verification',
          [projectId],
        ));
      }
    }
  }

  const highRiskCount = projects.filter((p) => (p.riskScore ?? 0) >= 70).length;
  if (highRiskCount > Math.ceil(projects.length * 0.5)) {
    conflicts.push(createConflict(
      'portfolio_conflict',
      'MEDIUM',
      `${highRiskCount} high-risk projects exceed safe portfolio ratio`,
      'Prioritize high-risk projects sequentially',
      projects.filter((p) => (p.riskScore ?? 0) >= 70).map((p) => p.projectId),
    ));
  }

  totalConflictCount += conflicts.length;
  return conflicts;
}

function createConflict(
  conflictType: string,
  severity: VerificationConflict['severity'],
  detail: string,
  recommendedAction: string,
  projectIds: string[],
): VerificationConflict {
  conflictCounter += 1;
  return {
    conflictId: `verification-conflict-${conflictCounter}`,
    conflictType,
    severity,
    detail,
    recommendedAction,
    projectIds,
  };
}

export function getTotalVerificationConflictCount(): number {
  return totalConflictCount;
}

export function resetVerificationConflictDetectorForTests(): void {
  conflictCounter = 0;
  totalConflictCount = 0;
}
