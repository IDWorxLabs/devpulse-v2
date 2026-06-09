/**
 * Verification plan builder — dependency-aware execution plans without execution.
 */

import type { VerificationTarget } from '../verification-registry/types.js';
import type { VerificationDependencyRecord } from '../verification-registry/types.js';
import type { VerificationExecutionPlan, OrchestrationExecutionState } from './types.js';

let planCounter = 0;

export function resetVerificationPlanCounterForTests(): void {
  planCounter = 0;
}

function nextPlanId(): string {
  planCounter += 1;
  return `vplan-${planCounter.toString().padStart(4, '0')}`;
}

export function buildVerificationExecutionPlan(
  target: VerificationTarget,
  dep: VerificationDependencyRecord | null,
  order: number,
  state: OrchestrationExecutionState = 'PLANNED',
): VerificationExecutionPlan {
  return {
    verificationPlanId: nextPlanId(),
    targetId: target.verificationTargetId,
    targetCategory: target.verificationCategory,
    executionState: state,
    phase: target.phase,
    ownerModule: target.ownerModule,
    upstreamDependencies: dep ? [...dep.upstreamDependencies] : [],
    downstreamDependencies: dep ? [...dep.downstreamDependencies] : [],
    prerequisites: dep ? [...dep.verificationPrerequisites] : [],
    plannedOrder: order,
    registryOnly: true,
  };
}

export function buildVerificationExecutionPlans(
  targets: VerificationTarget[],
  dependencies: VerificationDependencyRecord[],
  executionOrder: string[],
  stateMap: Map<string, OrchestrationExecutionState>,
): VerificationExecutionPlan[] {
  const depByTarget = new Map(dependencies.map((d) => [d.targetId, d]));
  const orderIndex = new Map(executionOrder.map((id, i) => [id, i]));

  return targets
    .map((target) => {
      const dep = depByTarget.get(target.verificationTargetId) ?? null;
      const order = orderIndex.get(target.verificationTargetId) ?? 999;
      const state = stateMap.get(target.verificationTargetId) ?? 'PLANNED';
      return buildVerificationExecutionPlan(target, dep, order, state);
    })
    .sort((a, b) => a.plannedOrder - b.plannedOrder);
}

export function buildFutureExecutionPlan(target: VerificationTarget): VerificationExecutionPlan {
  return buildVerificationExecutionPlan(target, null, 0, 'REGISTERED');
}
