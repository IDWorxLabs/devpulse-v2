/**
 * Capability Build Engine — report generation.
 */

import type {
  CapabilityBuildPlan,
  CapabilityBuildReport,
  CapabilityBuildRiskAnalysis,
  CapabilityBuildValidationPlan,
  CapabilityBuildType,
  CapabilityIntegrationPlan,
  CapabilityModulePlan,
  CapabilityRollbackPlan,
  CapabilityRolloutPlan,
  CapabilitySequencePlan,
} from './capability-build-types.js';

let reportCounter = 0;

export function generateCapabilityBuildReport(
  buildPlan: CapabilityBuildPlan,
  context: {
    modules: CapabilityModulePlan;
    integrations: CapabilityIntegrationPlan;
    sequence: CapabilitySequencePlan;
    rollout: CapabilityRolloutPlan;
    rollback: CapabilityRollbackPlan;
    risk: CapabilityBuildRiskAnalysis;
    validation: CapabilityBuildValidationPlan;
    blocked?: boolean;
    blockReason?: string;
  },
): CapabilityBuildReport {
  reportCounter += 1;

  let recommendedAction = 'Review build plan artifacts — no execution or file modification';
  if (context.blocked) {
    recommendedAction = 'Block build plan — duplicate capability detected; enhance existing module instead';
  }

  return {
    reportId: `build-report-${reportCounter}`,
    buildPlanId: buildPlan.buildPlanId,
    buildType: buildPlan.buildType,
    executionStrategy: buildPlan.executionStrategy,
    capabilityDomain: buildPlan.capabilityDomain,
    modules: context.modules,
    integrations: context.integrations,
    sequence: context.sequence,
    rollout: context.rollout,
    rollback: context.rollback,
    risk: context.risk,
    validation: context.validation,
    planningOnly: true,
    recommendedAction,
    generatedAt: Date.now(),
  };
}

export function resetCapabilityBuildReportCounterForTests(): void {
  reportCounter = 0;
}
