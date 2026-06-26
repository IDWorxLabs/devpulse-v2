/**
 * Virtual Device Laboratory — lightweight readiness gate.
 */

import type { BehaviorSimulationReadinessResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPlan } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualUserReadinessResult } from '../virtual-user-engine/virtual-user-types.js';
import { buildDeviceMatrix } from './device-matrix-builder.js';
import { discoverDeviceProfiles } from './device-profile-discovery.js';
import type { VirtualDeviceReadinessResult } from './virtual-device-types.js';

export function assessVirtualDeviceReadiness(input: {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuildPlan: IncrementalBuildPlan;
  incrementalBuildReady: boolean;
  behaviorSimulationReady: boolean;
  virtualUserSimulationReady: boolean;
  virtualUserCount: number;
  incrementalBlockedReason?: string | null;
  behaviorBlockedReason?: string | null;
  virtualUserBlockedReason?: string | null;
}): VirtualDeviceReadinessResult {
  void input.capabilityPlanning;
  void input.incrementalBuildPlan;
  void input.promptFaithfulness;

  if (!input.incrementalBuildReady) {
    return {
      readOnly: true,
      ready: false,
      profileCount: 0,
      matrixCount: 0,
      blockedReason: input.incrementalBlockedReason ?? 'Incremental build not ready for device laboratory.',
    };
  }
  if (!input.behaviorSimulationReady) {
    return {
      readOnly: true,
      ready: false,
      profileCount: 0,
      matrixCount: 0,
      blockedReason: input.behaviorBlockedReason ?? 'Behavior simulation not ready for device laboratory.',
    };
  }
  if (!input.virtualUserSimulationReady) {
    return {
      readOnly: true,
      ready: false,
      profileCount: 0,
      matrixCount: 0,
      blockedReason: input.virtualUserBlockedReason ?? 'Virtual user simulation not ready for device laboratory.',
    };
  }

  const profiles = discoverDeviceProfiles({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
  });
  const matrix = buildDeviceMatrix({ profiles });

  const blockedReason =
    profiles.length === 0
      ? 'No device profiles discovered.'
      : matrix.length === 0
        ? 'Device matrix construction failed.'
        : input.virtualUserCount === 0
          ? 'Virtual users required before device laboratory.'
          : null;

  return {
    readOnly: true,
    ready: blockedReason === null,
    profileCount: profiles.length,
    matrixCount: matrix.length,
    blockedReason,
  };
}
