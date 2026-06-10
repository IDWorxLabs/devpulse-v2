/**
 * Capability Planning Engine — plan registry.
 */

import type { CapabilityApprovalRequirement, CapabilityPlan, CapabilityPlanType } from './capability-planning-types.js';

const registry = new Map<string, CapabilityPlan>();

export function registerCapabilityPlan(plan: CapabilityPlan): void {
  registry.set(plan.planId, plan);
}

export function getCapabilityPlan(planId: string): CapabilityPlan | undefined {
  return registry.get(planId);
}

export function listCapabilityPlans(): CapabilityPlan[] {
  return [...registry.values()];
}

export function listCapabilityPlansByType(planType: CapabilityPlanType): CapabilityPlan[] {
  return listCapabilityPlans().filter((p) => p.planType === planType);
}

export function listCapabilityPlansByApproval(requirement: CapabilityApprovalRequirement): CapabilityPlan[] {
  return listCapabilityPlans().filter((p) => p.approvalRequirement === requirement);
}

export function getCapabilityPlanCount(): number {
  return registry.size;
}

export function resetCapabilityPlanRegistryForTests(): void {
  registry.clear();
}
