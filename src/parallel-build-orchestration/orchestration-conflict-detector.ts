/**
 * Parallel Build Orchestration — conflict detection.
 */

import type { OrchestrationConflict, OrchestrationProjectInput } from './orchestration-types.js';
import type { DependencyBuildResult } from './orchestration-dependency-manager.js';

let conflictCounter = 0;
let totalConflictCount = 0;

export function detectOrchestrationConflicts(
  projects: OrchestrationProjectInput[],
  dependencyResult: DependencyBuildResult,
  executionGroups: string[][],
): OrchestrationConflict[] {
  const conflicts: OrchestrationConflict[] = [];
  const scheduled = new Set<string>();

  for (const cycle of dependencyResult.cycles) {
    conflicts.push(createConflict(
      'dependency_cycle',
      'CRITICAL',
      `Dependency cycle detected: ${cycle.join(' -> ')}`,
      'Remove or break dependency cycle before orchestration',
      cycle,
    ));
  }

  for (const missing of dependencyResult.missing) {
    conflicts.push(createConflict(
      'missing_dependency',
      'HIGH',
      missing,
      'Register missing dependency project or remove dependency',
      [],
    ));
  }

  const workspaceToProjects = new Map<string, string[]>();
  for (const project of projects) {
    const list = workspaceToProjects.get(project.workspaceId) ?? [];
    list.push(project.projectId);
    workspaceToProjects.set(project.workspaceId, list);
  }

  for (const group of executionGroups) {
    const workspacesInGroup = new Set<string>();
    for (const projectId of group) {
      const project = projects.find((p) => p.projectId === projectId);
      if (!project) continue;

      if (scheduled.has(projectId)) {
        conflicts.push(createConflict(
          'duplicate_scheduling',
          'HIGH',
          `Project ${projectId} scheduled multiple times`,
          'Deduplicate orchestration schedule',
          [projectId],
        ));
      }
      scheduled.add(projectId);

      if (project.isolationOk === false) {
        conflicts.push(createConflict(
          'isolation_violation',
          'CRITICAL',
          `Isolation violation for ${projectId}`,
          'Resolve workspace isolation before parallel orchestration',
          [projectId],
        ));
      }

      if (workspacesInGroup.has(project.workspaceId)) {
        conflicts.push(createConflict(
          'workspace_conflict',
          'MEDIUM',
          `Workspace ${project.workspaceId} has multiple projects in same execution group`,
          'Separate workspace projects into different groups',
          group.filter((id) => projects.find((p) => p.projectId === id)?.workspaceId === project.workspaceId),
        ));
      }
      workspacesInGroup.add(project.workspaceId);
    }
  }

  for (const project of projects) {
    if (project.resourceAvailable === false) {
      conflicts.push(createConflict(
        'resource_conflict',
        'HIGH',
        `Insufficient resources for ${project.projectId}`,
        'Allocate resources or queue project',
        [project.projectId],
      ));
    }
  }

  totalConflictCount += conflicts.length;
  return conflicts;
}

function createConflict(
  conflictType: string,
  severity: OrchestrationConflict['severity'],
  detail: string,
  recommendedAction: string,
  projectIds: string[],
): OrchestrationConflict {
  conflictCounter += 1;
  return {
    conflictId: `orchestration-conflict-${conflictCounter}`,
    conflictType,
    severity,
    detail,
    recommendedAction,
    projectIds,
  };
}

export function getTotalOrchestrationConflictCount(): number {
  return totalConflictCount;
}

export function resetOrchestrationConflictDetectorForTests(): void {
  conflictCounter = 0;
  totalConflictCount = 0;
}
