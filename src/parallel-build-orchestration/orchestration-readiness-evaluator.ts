/**
 * Parallel Build Orchestration — readiness evaluation.
 */

import type { OrchestrationProjectInput, OrchestrationStatus } from './orchestration-types.js';
import type { DependencyBuildResult } from './orchestration-dependency-manager.js';
import { getCachedReadiness, setCachedReadiness } from './orchestration-cache.js';

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

export function evaluateOrchestrationReadiness(
  project: OrchestrationProjectInput,
  dependencyResult: DependencyBuildResult,
  completedProjects: Set<string> = new Set(),
): OrchestrationStatus {
  const cached = getCachedReadiness(project.projectId);
  if (cached) return cached as OrchestrationStatus;

  let status: OrchestrationStatus = 'READY';

  if (project.isolationOk === false) {
    status = 'BLOCKED';
  } else if (project.resourceAvailable === false) {
    status = 'RESOURCE_BLOCKED';
  } else if (
    dependencyResult.missing.some((m) => m.startsWith(project.projectId)) ||
    dependencyResult.cycles.some((c) => c.includes(project.projectId))
  ) {
    status = 'DEPENDENCY_BLOCKED';
  } else if ((project.dependsOn ?? []).some((dep) => !completedProjects.has(dep))) {
    status = 'WAITING';
  } else if (project.projectState === 'FAILED' || project.projectState === 'ARCHIVED') {
    status = 'BLOCKED';
  } else if (project.projectState === 'PAUSED') {
    status = 'WAITING';
  }

  setCachedReadiness(project.projectId, status);
  return status;
}

export function evaluateAllReadiness(
  projects: OrchestrationProjectInput[],
  dependencyResult: DependencyBuildResult,
): Map<string, OrchestrationStatus> {
  const statuses = new Map<string, OrchestrationStatus>();
  const completed = new Set(
    projects.filter((p) => p.projectState === 'COMPLETED').map((p) => p.projectId),
  );

  for (const project of projects) {
    statuses.set(
      project.projectId,
      evaluateOrchestrationReadiness(project, dependencyResult, completed),
    );
  }
  return statuses;
}

export function getPriorityScore(priority: string): number {
  return PRIORITY_ORDER[priority.toUpperCase()] ?? 2;
}
