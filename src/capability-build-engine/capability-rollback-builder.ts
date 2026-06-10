/**
 * Capability Build Engine — rollback builder.
 */

import type { CapabilityBuildInput, CapabilityIntegrationPlan, CapabilityRollbackPlan } from './capability-build-types.js';

let rollbackPlans = 0;

export function buildCapabilityRollbackPlan(
  input: CapabilityBuildInput,
  integrations: CapabilityIntegrationPlan,
): CapabilityRollbackPlan {
  rollbackPlans += 1;

  const checkpoints = [
    'pre_build_snapshot',
    'post_module_plan',
    'post_integration_plan',
    'pre_validation',
  ];

  const triggers = [
    'validation_failure',
    'risk_threshold_exceeded',
    'duplicate_capability_detected',
    'trust_degradation',
  ];

  const dependencies = [
    ...integrations.registryIntegrations,
    ...integrations.upstreamIntegrations,
  ];

  const recoveryPath = [
    'halt_build_pipeline',
    'revert_to_last_checkpoint',
    'notify_founder_if_required',
    'restore_read_only_integrations',
  ];

  if (input.world2Impact) {
    triggers.push('world2_sandbox_failure');
    recoveryPath.push('world2_rollback_to_snapshot');
  }

  return {
    checkpoints: [...new Set(checkpoints)],
    triggers: [...new Set(triggers)],
    dependencies: [...new Set(dependencies)],
    recoveryPath: [...new Set(recoveryPath)],
  };
}

export function getRollbackPlansCount(): number {
  return rollbackPlans;
}

export function resetRollbackBuilderForTests(): void {
  rollbackPlans = 0;
}
