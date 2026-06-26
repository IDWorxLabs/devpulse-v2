/**
 * Virtual User Engine — lightweight readiness gate for build plan.
 */

import type { BehaviorSimulationReadinessResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPlan } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import { discoverVirtualUserProfiles } from './virtual-user-profile-discovery.js';
import { extractVirtualUserGoals } from './virtual-user-goal-extractor.js';
import type { VirtualUserReadinessResult } from './virtual-user-types.js';

export function assessVirtualUserReadiness(input: {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuildPlan: IncrementalBuildPlan;
  incrementalBuildReady: boolean;
  behaviorSimulationReady: boolean;
  behaviorScenarioCount: number;
  incrementalBlockedReason?: string | null;
  behaviorBlockedReason?: string | null;
}): VirtualUserReadinessResult {
  void input.capabilityPlanning;
  void input.incrementalBuildPlan;

  if (!input.incrementalBuildReady) {
    return {
      readOnly: true,
      ready: false,
      userCount: 0,
      goalCount: 0,
      blockedReason: input.incrementalBlockedReason ?? 'Incremental build not ready for virtual user simulation.',
    };
  }

  if (!input.behaviorSimulationReady) {
    return {
      readOnly: true,
      ready: false,
      userCount: 0,
      goalCount: 0,
      blockedReason: input.behaviorBlockedReason ?? 'Behavior simulation not ready for virtual user simulation.',
    };
  }

  const profiles = discoverVirtualUserProfiles({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
  });
  const goals = extractVirtualUserGoals({ profiles });

  const blockedReason =
    profiles.length === 0
      ? 'No virtual users discovered.'
      : goals.length === 0
        ? 'No virtual user goals extracted.'
        : input.behaviorScenarioCount === 0
          ? 'Behavior scenarios required before virtual user simulation.'
          : null;

  return {
    readOnly: true,
    ready: blockedReason === null,
    userCount: profiles.length,
    goalCount: goals.length,
    blockedReason,
  };
}
