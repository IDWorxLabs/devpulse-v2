/**
 * Multi Project Verification Orchestration — plan builder pipeline.
 */

import type {
  VerificationGroup,
  VerificationOrchestrationPlan,
  VerificationOrchestrationProjectInput,
  VerificationOrchestrationStatus,
} from './verification-orchestration-types.js';
import { evaluateAllVerificationReadiness } from './verification-readiness-evaluator.js';
import { buildVerificationDependencyChains } from './verification-dependency-manager.js';
import { detectVerificationConflicts } from './verification-conflict-detector.js';
import { evaluateVerificationCapacity } from './verification-capacity-evaluator.js';
import { buildVerificationGroups } from './verification-group-manager.js';
import { buildVerificationSchedule } from './verification-scheduler.js';
import { registerVerificationOrchestrationPlan } from './verification-orchestration-registry.js';

let planCounter = 0;

export function buildVerificationOrchestrationPlan(
  projects: VerificationOrchestrationProjectInput[],
): VerificationOrchestrationPlan {
  planCounter += 1;
  const planId = `verification-orchestration-plan-${planCounter}`;

  const dependencyResult = buildVerificationDependencyChains(projects);
  const statuses = evaluateAllVerificationReadiness(projects, dependencyResult);
  const capacity = evaluateVerificationCapacity(projects);
  const groups = buildVerificationGroups(projects, statuses, capacity);
  const scheduledGroups = buildVerificationSchedule(planId, projects, dependencyResult, groups);
  const conflicts = detectVerificationConflicts(projects, dependencyResult, scheduledGroups);

  const readyProjects = projects
    .filter((p) => statuses.get(p.projectId) === 'READY')
    .map((p) => p.projectId);

  let waitingProjects = projects
    .filter((p) => statuses.get(p.projectId) === 'WAITING')
    .map((p) => p.projectId);

  let blockedProjects = projects
    .filter((p) => {
      const s = statuses.get(p.projectId);
      return s === 'BLOCKED' || s === 'DEPENDENCY_BLOCKED' || s === 'CAPACITY_BLOCKED';
    })
    .map((p) => p.projectId);

  if (conflicts.some((c) => c.severity === 'CRITICAL')) {
    const criticalIds = new Set(
      conflicts.filter((c) => c.severity === 'CRITICAL').flatMap((c) => c.projectIds),
    );
    for (const id of criticalIds) {
      if (!blockedProjects.includes(id)) {
        blockedProjects = [...blockedProjects, id];
      }
      readyProjects.splice(readyProjects.indexOf(id), 1);
      waitingProjects = waitingProjects.filter((w) => w !== id);
    }
  }

  const finalGroups: VerificationGroup[] = scheduledGroups.map((g) => {
    let groupStatus: VerificationOrchestrationStatus = g.status;
    if (g.projectIds.some((id) => blockedProjects.includes(id))) {
      groupStatus = 'BLOCKED';
    } else if (g.projectIds.some((id) => waitingProjects.includes(id))) {
      groupStatus = 'WAITING';
    } else if (g.projectIds.every((id) => readyProjects.includes(id))) {
      groupStatus = 'READY';
    }
    return { ...g, status: groupStatus };
  });

  const plan: VerificationOrchestrationPlan = {
    planId,
    groups: finalGroups,
    readyProjects,
    waitingProjects,
    blockedProjects,
    dependencyChains: dependencyResult.chains,
    estimatedVerificationParallelism: capacity.estimatedParallelism,
    generatedAt: Date.now(),
  };

  registerVerificationOrchestrationPlan(plan);
  return plan;
}

export function resetVerificationOrchestrationPlanCounterForTests(): void {
  planCounter = 0;
}
