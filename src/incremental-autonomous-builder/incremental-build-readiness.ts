/**
 * Incremental Autonomous Builder — lightweight readiness assessment (planning gate).
 */

import { buildArchitectureSkeleton } from './architecture-skeleton-builder.js';
import { buildIncrementalBuildPlan, getOrderedSliceIdsFromPlan } from './incremental-build-plan.js';
import type { IncrementalBuildPipelineInput } from './incremental-builder-types.js';
import type { IncrementalBuildPlan, ArchitectureSkeletonResult } from './incremental-builder-types.js';

export interface IncrementalBuildReadinessResult {
  readOnly: true;
  ready: boolean;
  buildPlan: IncrementalBuildPlan;
  skeleton: ArchitectureSkeletonResult;
  orderedSliceIds: readonly string[];
  blockedReason: string | null;
}

export function assessIncrementalBuildReadiness(
  input: Omit<IncrementalBuildPipelineInput, 'simulateFailingSliceId' | 'simulateRegressionSliceId' | 'resumeFromBuildId'>,
): IncrementalBuildReadinessResult {
  if (!input.promptFaithfulness.readyForGeneration) {
    const plan = buildIncrementalBuildPlan({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      capabilityPlanning: input.capabilityPlanning,
    });
    return {
      readOnly: true,
      ready: false,
      buildPlan: plan,
      skeleton: buildArchitectureSkeleton(plan),
      orderedSliceIds: [],
      blockedReason: 'Prompt Faithfulness blocked incremental build.',
    };
  }

  if (input.capabilityPlanning.permissionVerdict === 'BLOCKED') {
    const plan = buildIncrementalBuildPlan({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      capabilityPlanning: input.capabilityPlanning,
    });
    return {
      readOnly: true,
      ready: false,
      buildPlan: plan,
      skeleton: buildArchitectureSkeleton(plan),
      orderedSliceIds: [],
      blockedReason: input.capabilityPlanning.blockedReason ?? 'Capability planning blocked.',
    };
  }

  const buildPlan = buildIncrementalBuildPlan({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    capabilityPlanning: input.capabilityPlanning,
  });
  const skeleton = buildArchitectureSkeleton(buildPlan);
  const orderedSliceIds = getOrderedSliceIdsFromPlan(buildPlan);

  const blockedReason =
    !skeleton.compiles
      ? skeleton.blockedReason
      : buildPlan.featureSlices.length === 0
        ? 'No feature slices planned.'
        : orderedSliceIds.length === 0
          ? 'Feature ordering produced no buildable slices.'
          : null;

  return {
    readOnly: true,
    ready: blockedReason === null,
    buildPlan,
    skeleton,
    orderedSliceIds,
    blockedReason,
  };
}
