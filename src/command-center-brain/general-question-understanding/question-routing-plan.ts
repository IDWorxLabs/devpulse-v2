/**
 * Build a QuestionRoutingPlan from user input.
 */

import { detectContextNeeds } from './context-need-detector.js';
import { computeRoutingConfidence, selectCapabilities } from './capability-selector.js';
import { selectReasoningModes } from './reasoning-mode-selector.js';
import type { QuestionRoutingPlan } from './general-question-types.js';
import { detectQuestionDimensions } from './question-understanding-engine.js';

export function buildQuestionRoutingPlan(question: string): QuestionRoutingPlan {
  const trimmed = question.trim();
  const dimensions = detectQuestionDimensions(trimmed);
  const contextNeeds = detectContextNeeds(trimmed, dimensions);
  const reasoningModes = selectReasoningModes(trimmed, dimensions);
  const capabilitySelection = selectCapabilities(trimmed, dimensions, contextNeeds, reasoningModes);

  return {
    question: trimmed,
    dimensions,
    contextNeeds,
    reasoningModes,
    selectedCapabilities: capabilitySelection.selectedCapabilities,
    unavailableCapabilities: capabilitySelection.unavailableCapabilities,
    primaryCapability: capabilitySelection.primaryCapability,
    secondaryCapabilities: capabilitySelection.secondaryCapabilities,
    confidence: computeRoutingConfidence(dimensions, capabilitySelection.selectedCapabilities),
    routingReason: capabilitySelection.routingReason,
    timestamp: Date.now(),
  };
}

export function shouldAllowGenericFallback(plan: QuestionRoutingPlan): boolean {
  const onlyUnknown = plan.dimensions.length === 1 && plan.dimensions[0] === 'UNKNOWN';
  return (
    onlyUnknown &&
    plan.contextNeeds.length === 0 &&
    plan.selectedCapabilities.length === 0 &&
    plan.primaryCapability === null
  );
}

export function generalQuestionRoutingPlanKey(plan: QuestionRoutingPlan): string {
  return [
    plan.dimensions.join(','),
    plan.contextNeeds.join(','),
    plan.reasoningModes.join(','),
    plan.selectedCapabilities.join(','),
    plan.primaryCapability ?? 'none',
    plan.confidence,
  ].join('|');
}
