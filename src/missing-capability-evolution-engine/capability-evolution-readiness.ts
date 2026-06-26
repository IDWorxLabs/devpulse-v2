/**
 * Missing Capability Evolution Engine — lightweight readiness gate.
 */

import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import { runMissingCapabilityEvolutionPipeline } from './capability-evolution-authority.js';
import type { MissingCapabilityEvolutionReadinessResult } from './missing-capability-evolution-types.js';

export function assessMissingCapabilityEvolutionReadiness(input: {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  promptFaithfulnessBlocked?: boolean;
}): MissingCapabilityEvolutionReadinessResult {
  const needsEvolution =
    input.capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION' ||
    input.capabilityPlanning.generationPlans.length > 0;

  if (!needsEvolution) {
    return {
      readOnly: true,
      ready: true,
      blockedReason: null,
      pipelineResult: null,
    };
  }

  if (input.promptFaithfulnessBlocked ?? !input.promptFaithfulness.readyForGeneration) {
    return {
      readOnly: true,
      ready: false,
      blockedReason: 'Prompt Faithfulness blocked — missing capability evolution cannot proceed.',
      pipelineResult: null,
    };
  }

  const pipelineResult = runMissingCapabilityEvolutionPipeline({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    capabilityPlanning: input.capabilityPlanning,
    promptFaithfulnessBlocked: input.promptFaithfulnessBlocked,
  });

  const ready = pipelineResult.permissionVerdict === 'EVOLUTION_PASS';

  return {
    readOnly: true,
    ready,
    blockedReason: ready
      ? null
      : pipelineResult.blockedReason ??
        pipelineResult.humanReview?.problemSummary ??
        'Missing capability evolution incomplete',
    pipelineResult,
  };
}
