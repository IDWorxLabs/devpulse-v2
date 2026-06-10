/**
 * Parallel Build Orchestration — plan builder pipeline.
 */

import type { OrchestrationPlan, OrchestrationProject, OrchestrationProjectInput, OrchestrationStatus } from './orchestration-types.js';
import { evaluateAllReadiness } from './orchestration-readiness-evaluator.js';
import { buildDependencyChains } from './orchestration-dependency-manager.js';
import { detectOrchestrationConflicts } from './orchestration-conflict-detector.js';
import { evaluateOrchestrationCapacity } from './orchestration-capacity-evaluator.js';
import { buildOrchestrationGroups } from './orchestration-group-manager.js';
import { buildOrchestrationSchedule } from './orchestration-scheduler.js';
import { registerOrchestrationPlan } from './orchestration-registry.js';

let planCounter = 0;

export function buildOrchestrationPlan(projects: OrchestrationProjectInput[]): OrchestrationPlan {
  planCounter += 1;
  const planId = `orchestration-plan-${planCounter}`;

  const dependencyResult = buildDependencyChains(projects);
  const statuses = evaluateAllReadiness(projects, dependencyResult);
  const conflicts = detectOrchestrationConflicts(projects, dependencyResult, []);
  const capacity = evaluateOrchestrationCapacity(projects);
  const groups = buildOrchestrationGroups(projects, statuses, capacity);
  const scheduleGroups = buildOrchestrationSchedule(planId, projects, dependencyResult, groups);

  const conflictCheck = detectOrchestrationConflicts(projects, dependencyResult, scheduleGroups);

  const orchestrationProjects: OrchestrationProject[] = projects.map((p) => ({
    projectId: p.projectId,
    workspaceId: p.workspaceId,
    priority: p.priority ?? 'NORMAL',
    status: statuses.get(p.projectId) ?? 'BLOCKED',
  }));

  const readyProjects = orchestrationProjects.filter((p) => p.status === 'READY').map((p) => p.projectId);
  const waitingProjects = orchestrationProjects.filter((p) => p.status === 'WAITING').map((p) => p.projectId);
  const blockedProjects = orchestrationProjects
    .filter((p) => ['BLOCKED', 'DEPENDENCY_BLOCKED', 'RESOURCE_BLOCKED'].includes(p.status))
    .map((p) => p.projectId);

  if (conflictCheck.length > 0) {
    for (const p of orchestrationProjects) {
      if (conflictCheck.some((c) => c.projectIds.includes(p.projectId) && c.severity === 'CRITICAL')) {
        (p as { status: OrchestrationStatus }).status = 'BLOCKED';
      }
    }
  }

  const plan: OrchestrationPlan = {
    planId,
    projects: orchestrationProjects,
    readyProjects: orchestrationProjects.filter((p) => p.status === 'READY').map((p) => p.projectId),
    waitingProjects: orchestrationProjects.filter((p) => p.status === 'WAITING').map((p) => p.projectId),
    blockedProjects: orchestrationProjects.filter((p) => ['BLOCKED', 'DEPENDENCY_BLOCKED', 'RESOURCE_BLOCKED'].includes(p.status)).map((p) => p.projectId),
    executionGroups: scheduleGroups,
    dependencyChains: dependencyResult.chains,
    estimatedParallelism: capacity.estimatedParallelism,
    generatedAt: Date.now(),
  };

  registerOrchestrationPlan(plan);
  return plan;
}

export function resetOrchestrationPlanCounterForTests(): void {
  planCounter = 0;
}
