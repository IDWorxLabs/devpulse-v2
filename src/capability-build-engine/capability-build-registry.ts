/**
 * Capability Build Engine — build plan registry.
 */

import type { CapabilityBuildPlan, CapabilityBuildType, BuildExecutionStrategy } from './capability-build-types.js';

const registry = new Map<string, CapabilityBuildPlan>();

export function registerCapabilityBuildPlan(plan: CapabilityBuildPlan): void {
  registry.set(plan.buildPlanId, plan);
}

export function getCapabilityBuildPlan(buildPlanId: string): CapabilityBuildPlan | undefined {
  return registry.get(buildPlanId);
}

export function listCapabilityBuildPlans(): CapabilityBuildPlan[] {
  return [...registry.values()];
}

export function listCapabilityBuildPlansByType(buildType: CapabilityBuildType): CapabilityBuildPlan[] {
  return listCapabilityBuildPlans().filter((p) => p.buildType === buildType);
}

export function listCapabilityBuildPlansByStrategy(strategy: BuildExecutionStrategy): CapabilityBuildPlan[] {
  return listCapabilityBuildPlans().filter((p) => p.executionStrategy === strategy);
}

export function getCapabilityBuildPlanCount(): number {
  return registry.size;
}

export function resetCapabilityBuildRegistryForTests(): void {
  registry.clear();
}
