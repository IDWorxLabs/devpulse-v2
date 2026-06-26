/**
 * Interaction Proof Engine — lightweight readiness gate.
 */

import type { BehaviorSimulationReadinessResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPlan } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualDeviceReadinessResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserReadinessResult } from '../virtual-user-engine/virtual-user-types.js';
import { discoverInteractionSurfaces } from './interaction-surface-discovery.js';
import type { InteractionProofReadinessResult } from './interaction-proof-types.js';

export function assessInteractionProofReadiness(input: {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuildPlan: IncrementalBuildPlan;
  incrementalBuildReady: boolean;
  behaviorSimulationReady: boolean;
  virtualUserSimulationReady: boolean;
  virtualDeviceLaboratoryReady: boolean;
  deviceProfileCount: number;
  incrementalBlockedReason?: string | null;
  behaviorBlockedReason?: string | null;
  virtualUserBlockedReason?: string | null;
  virtualDeviceBlockedReason?: string | null;
}): InteractionProofReadinessResult {
  void input.capabilityPlanning;
  void input.incrementalBuildPlan;
  void input.promptFaithfulness;

  if (!input.incrementalBuildReady) {
    return {
      readOnly: true,
      ready: false,
      interactionCount: 0,
      requiredCount: 0,
      blockedReason: input.incrementalBlockedReason ?? 'Incremental build not ready for interaction proof.',
    };
  }
  if (!input.behaviorSimulationReady) {
    return {
      readOnly: true,
      ready: false,
      interactionCount: 0,
      requiredCount: 0,
      blockedReason: input.behaviorBlockedReason ?? 'Behavior simulation not ready for interaction proof.',
    };
  }
  if (!input.virtualUserSimulationReady) {
    return {
      readOnly: true,
      ready: false,
      interactionCount: 0,
      requiredCount: 0,
      blockedReason: input.virtualUserBlockedReason ?? 'Virtual user simulation not ready for interaction proof.',
    };
  }
  if (!input.virtualDeviceLaboratoryReady) {
    return {
      readOnly: true,
      ready: false,
      interactionCount: 0,
      requiredCount: 0,
      blockedReason: input.virtualDeviceBlockedReason ?? 'Virtual device laboratory not ready for interaction proof.',
    };
  }

  const surfaces = discoverInteractionSurfaces({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
  });
  const requiredCount = surfaces.filter((s) => s.classification === 'REQUIRED_INTERACTION').length;

  const blockedReason =
    surfaces.length === 0
      ? 'No interaction surfaces discovered.'
      : input.deviceProfileCount === 0
        ? 'Device profiles required before interaction proof.'
        : null;

  return {
    readOnly: true,
    ready: blockedReason === null,
    interactionCount: surfaces.length,
    requiredCount,
    blockedReason,
  };
}
