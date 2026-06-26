import type { IncrementalBuildPlan } from '../incremental-autonomous-builder/incremental-builder-types.js';
import { discoverBehaviorScenarios } from './behavior-scenario-discovery.js';
import { planSimulationActions } from './simulation-action-planner.js';
import type { BehaviorSimulationReadinessResult } from './behavior-simulation-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';

export function assessBehaviorSimulationReadiness(input: {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuildPlan: IncrementalBuildPlan;
  incrementalBuildReady: boolean;
  incrementalBlockedReason?: string | null;
}): BehaviorSimulationReadinessResult {
  if (!input.incrementalBuildReady) {
    return {
      readOnly: true,
      ready: false,
      scenarioCount: 0,
      blockedReason: input.incrementalBlockedReason ?? 'Incremental build not ready for behavior simulation.',
    };
  }

  const pseudoIncremental = {
    readOnly: true as const,
    buildPlan: input.incrementalBuildPlan,
    permissionVerdict: 'READY_FOR_ASSEMBLY' as const,
  };

  const scenarios = discoverBehaviorScenarios({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    incrementalBuild: pseudoIncremental as never,
  });
  const plans = planSimulationActions(scenarios);

  const blockedReason =
    scenarios.length === 0
      ? 'No behavior scenarios discovered.'
      : plans.length !== scenarios.length
        ? 'Simulation action planning incomplete.'
        : null;

  return {
    readOnly: true,
    ready: blockedReason === null,
    scenarioCount: scenarios.length,
    blockedReason,
  };
}
