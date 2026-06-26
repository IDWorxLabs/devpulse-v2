/**
 * Incremental Autonomous Builder — incremental build plan assembly.
 */

import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import { orderFeatureSlices } from './feature-dependency-ordering.js';
import { planFeatureSlices } from './feature-slice-planner.js';
import type { IncrementalBuildPlan } from './incremental-builder-types.js';

let buildCounter = 0;

export function resetIncrementalBuildPlanForTests(): void {
  buildCounter = 0;
}

function nextBuildId(): string {
  buildCounter += 1;
  return `incr-build-${buildCounter}`;
}

export function buildIncrementalBuildPlan(input: {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
}): IncrementalBuildPlan {
  const featureSlices = planFeatureSlices({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    capabilityPlanning: input.capabilityPlanning,
  });

  const capabilityBlocked = input.capabilityPlanning.gaps
    .filter((g) => g.decision === 'BLOCK_BUILD' || g.decision === 'NEEDS_HUMAN_REVIEW')
    .flatMap((g) => featureSlices.filter((s) => s.capabilityIds.some((id) => g.requiredCapability.requiredId === id)).map((s) => s.sliceId));

  const ordering = orderFeatureSlices(featureSlices, capabilityBlocked);

  const featureDependencies: Record<string, string[]> = {};
  const requiredCapabilitiesPerFeature: Record<string, string[]> = {};
  const validationPlanPerFeature: Record<string, string[]> = {};
  const repairPolicyPerFeature: Record<string, string> = {};

  for (const slice of featureSlices) {
    featureDependencies[slice.sliceId] = [...slice.dependencySliceIds];
    requiredCapabilitiesPerFeature[slice.sliceId] = [...slice.capabilityIds];
    validationPlanPerFeature[slice.sliceId] = [...slice.validationPlan];
    repairPolicyPerFeature[slice.sliceId] = slice.repairPolicy;
  }

  return {
    readOnly: true,
    buildId: nextBuildId(),
    productId: input.productIntelligenceModel.modelId,
    promptContractId: input.promptFaithfulness.contract.id,
    architectureSummary: `${input.productIntelligenceModel.product.productType}: ${input.productIntelligenceModel.architecture.moduleIds.join(', ') || 'custom modules'}`,
    featureSlices,
    featureDependencies,
    requiredCapabilitiesPerFeature,
    validationPlanPerFeature,
    repairPolicyPerFeature,
    commitBoundaries: featureSlices.map((s) => s.commitBoundary),
    rollbackBoundaries: featureSlices.map((s) => s.rollbackBoundary),
    wholeAppValidationPlan: [
      'TYPECHECK',
      'BUILD',
      'ROUTE_INTEGRITY',
      'FEATURE_INTEGRATION',
      'STATE_INTEGRATION',
      'PROMPT_FAITHFULNESS',
      'CAPABILITY_READINESS',
      'REGRESSION_SWEEP',
      'ACCESSIBILITY_BASELINE',
      'WORKSPACE_REALITY',
      'EXECUTION_TRACE',
    ],
  };
}

export function getOrderedSliceIdsFromPlan(plan: IncrementalBuildPlan): string[] {
  const capabilityBlocked: string[] = [];
  const ordering = orderFeatureSlices(plan.featureSlices, capabilityBlocked);
  return [...ordering.orderedSliceIds];
}
