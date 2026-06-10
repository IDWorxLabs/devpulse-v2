/**
 * Parallel Build Orchestration — plan registry.
 */

import type { OrchestrationPlan } from './orchestration-types.js';
import {
  getCachedPlan,
  getCachedPlansByProject,
  setCachedPlan,
  setCachedPlansByProject,
} from './orchestration-cache.js';

const plans = new Map<string, OrchestrationPlan>();
const plansByProject = new Map<string, OrchestrationPlan[]>();
const plansByWorkspace = new Map<string, OrchestrationPlan[]>();

export function registerOrchestrationPlan(plan: OrchestrationPlan): OrchestrationPlan {
  plans.set(plan.planId, plan);
  setCachedPlan(plan);

  for (const project of plan.projects) {
    const projectPlans = plansByProject.get(project.projectId) ?? [];
    projectPlans.unshift(plan);
    plansByProject.set(project.projectId, projectPlans);
    setCachedPlansByProject(project.projectId, projectPlans);

    const workspacePlans = plansByWorkspace.get(project.workspaceId) ?? [];
    if (!workspacePlans.some((p) => p.planId === plan.planId)) {
      workspacePlans.unshift(plan);
      plansByWorkspace.set(project.workspaceId, workspacePlans);
    }
  }

  return plan;
}

export function getOrchestrationPlan(planId: string): OrchestrationPlan | undefined {
  const cached = getCachedPlan(planId);
  if (cached) return cached;
  const plan = plans.get(planId);
  if (plan) setCachedPlan(plan);
  return plan;
}

export function listOrchestrationPlans(): OrchestrationPlan[] {
  return [...plans.values()];
}

export function getOrchestrationPlanCount(): number {
  return plans.size;
}

export function listOrchestrationPlansByProject(projectId: string): OrchestrationPlan[] {
  const cached = getCachedPlansByProject(projectId);
  if (cached) return cached;
  const result = plansByProject.get(projectId) ?? [];
  setCachedPlansByProject(projectId, result);
  return result;
}

export function listOrchestrationPlansByWorkspace(workspaceId: string): OrchestrationPlan[] {
  return plansByWorkspace.get(workspaceId) ?? [];
}

export function resetOrchestrationRegistryForTests(): void {
  plans.clear();
  plansByProject.clear();
  plansByWorkspace.clear();
}
