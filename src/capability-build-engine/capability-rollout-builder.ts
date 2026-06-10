/**
 * Capability Build Engine — rollout builder.
 */

import type { CapabilityBuildInput, CapabilityRolloutPlan, RolloutStrategy } from './capability-build-types.js';

let rolloutPlans = 0;

export function buildCapabilityRolloutPlan(input: CapabilityBuildInput): CapabilityRolloutPlan {
  rolloutPlans += 1;

  let strategy: RolloutStrategy = 'ISOLATED';
  const stages: string[] = ['plan_review', 'artifact_generation'];

  if (input.founderApprovalRequired) {
    strategy = 'FOUNDER_REVIEWED';
    stages.push('founder_approval_gate', 'staged_activation');
  } else if (input.world2Impact) {
    strategy = 'WORLD2';
    stages.push('world2_sandbox', 'world2_observation', 'world2_promotion');
  } else if (input.trustImpact) {
    strategy = 'STAGED';
    stages.push('trust_baseline', 'staged_rollout', 'trust_verification');
  } else {
    strategy = 'ISOLATED';
    stages.push('isolated_module_validation', 'read_only_registration');
  }

  return { strategy, stages: [...new Set(stages)] };
}

export function getRolloutPlansCount(): number {
  return rolloutPlans;
}

export function resetRolloutBuilderForTests(): void {
  rolloutPlans = 0;
}
