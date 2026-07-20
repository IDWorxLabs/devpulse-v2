/**
 * Universal Behavioral Verification Engine V1 — verification planning.
 */

import type {
  BehaviorVerificationPlan,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';

export function buildBehaviorVerificationPlan(
  descriptors: readonly UniversalBehaviorDescriptor[],
  planId: string,
): BehaviorVerificationPlan {
  const strategies: Record<string, UniversalBehaviorDescriptor['verificationStrategy']> = {};
  for (const d of descriptors) {
    strategies[d.behaviorId] = d.verificationStrategy;
  }
  const runtimeRequired = descriptors.some(
    (d) =>
      d.supportClassification === 'EXECUTABLE' &&
      d.verificationStrategy === 'runtime_execution' &&
      d.criticality !== 'INFORMATIONAL',
  );
  return {
    planId,
    behaviorIds: descriptors.map((d) => d.behaviorId).sort((a, b) => a.localeCompare(b)),
    strategies,
    runtimeRequired,
    generatedAt: new Date().toISOString(),
  };
}

export function planRequiresRuntimeExecution(plan: BehaviorVerificationPlan): boolean {
  return plan.runtimeRequired;
}

export function behaviorsForStrategy(
  descriptors: readonly UniversalBehaviorDescriptor[],
  strategy: UniversalBehaviorDescriptor['verificationStrategy'],
): UniversalBehaviorDescriptor[] {
  return descriptors.filter((d) => d.verificationStrategy === strategy);
}
