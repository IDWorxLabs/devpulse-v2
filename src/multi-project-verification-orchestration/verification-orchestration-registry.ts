/**
 * Multi Project Verification Orchestration — plan registry.
 */

import type { VerificationGroup, VerificationOrchestrationPlan } from './verification-orchestration-types.js';
import {
  getCachedPlansByProject,
  getCachedVerificationPlan,
  setCachedPlansByProject,
  setCachedVerificationPlan,
} from './verification-cache.js';

const plans = new Map<string, VerificationOrchestrationPlan>();
const plansByProject = new Map<string, VerificationOrchestrationPlan[]>();
const plansByGroup = new Map<string, VerificationOrchestrationPlan[]>();

export function registerVerificationOrchestrationPlan(
  plan: VerificationOrchestrationPlan,
): VerificationOrchestrationPlan {
  plans.set(plan.planId, plan);
  setCachedVerificationPlan(plan);

  for (const group of plan.groups) {
    for (const projectId of group.projectIds) {
      const projectPlans = plansByProject.get(projectId) ?? [];
      if (!projectPlans.some((p) => p.planId === plan.planId)) {
        projectPlans.unshift(plan);
        plansByProject.set(projectId, projectPlans);
        setCachedPlansByProject(projectId, projectPlans);
      }
    }

    const groupPlans = plansByGroup.get(group.groupId) ?? [];
    if (!groupPlans.some((p) => p.planId === plan.planId)) {
      groupPlans.unshift(plan);
      plansByGroup.set(group.groupId, groupPlans);
    }
  }

  return plan;
}

export function getVerificationOrchestrationPlan(planId: string): VerificationOrchestrationPlan | undefined {
  const cached = getCachedVerificationPlan(planId);
  if (cached) return cached;
  const plan = plans.get(planId);
  if (plan) setCachedVerificationPlan(plan);
  return plan;
}

export function listVerificationOrchestrationPlans(): VerificationOrchestrationPlan[] {
  return [...plans.values()];
}

export function getVerificationOrchestrationPlanCount(): number {
  return plans.size;
}

export function listVerificationOrchestrationPlansByProject(
  projectId: string,
): VerificationOrchestrationPlan[] {
  const cached = getCachedPlansByProject(projectId);
  if (cached) return cached;
  const result = plansByProject.get(projectId) ?? [];
  setCachedPlansByProject(projectId, result);
  return result;
}

export function listVerificationOrchestrationPlansByGroup(groupId: string): VerificationOrchestrationPlan[] {
  return plansByGroup.get(groupId) ?? [];
}

export function getVerificationGroupsFromPlan(planId: string): VerificationGroup[] {
  return getVerificationOrchestrationPlan(planId)?.groups ?? [];
}

export function resetVerificationOrchestrationRegistryForTests(): void {
  plans.clear();
  plansByProject.clear();
  plansByGroup.clear();
}
