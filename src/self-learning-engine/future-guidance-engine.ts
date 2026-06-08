/**
 * Future guidance engine — creates future guidance recommendations.
 * Guidance only. Does NOT auto-apply or change behavior.
 */

import type {
  FutureGuidance,
  GuidanceType,
  LearningCategory,
  LearningConfidence,
  LearningEventInput,
  LearningEventType,
} from './types.js';
import { nextGuidanceId } from './types.js';

export function futureGuidanceKey(guidanceType: GuidanceType, eventType: LearningEventType): string {
  return `${guidanceType}|${eventType}`;
}

function guidanceForCategory(
  input: LearningEventInput,
  category: LearningCategory,
  confidence: LearningConfidence,
  learningEventId: string,
): FutureGuidance[] {
  const guidance: FutureGuidance[] = [];
  const requiresReview = confidence === 'LOW' || category === 'FAILURE_PATTERN';

  const add = (
    guidanceType: GuidanceType,
    summary: string,
    systems: string[],
    review = requiresReview,
  ): void => {
    guidance.push({
      guidanceId: nextGuidanceId(),
      learningEventId,
      guidanceType,
      guidanceSummary: summary,
      appliesToSystems: systems,
      confidenceScore: confidence,
      requiresHumanReview: review,
      status: 'READY',
    });
  };

  switch (category) {
    case 'SUCCESS_PATTERN':
      add('BEST_PRACTICE', `Repeat successful approach: ${input.eventSummary.slice(0, 60)}`, [input.sourceSystem]);
      add('RECOMMENDATION', 'Consider applying this pattern to similar projects', [input.sourceSystem], false);
      break;
    case 'FAILURE_PATTERN':
      add('AVOIDANCE_RULE', `Avoid repeating failure: ${input.eventSummary.slice(0, 60)}`, [input.sourceSystem], true);
      add('WARNING', 'Review root cause before similar operations', [input.sourceSystem], true);
      break;
    case 'WARNING_PATTERN':
      add('WARNING', `Heed warning from ${input.sourceSystem}: ${input.eventSummary.slice(0, 60)}`, [input.sourceSystem]);
      add('CHECKPOINT_SUGGESTION', 'Add checkpoint before proceeding with similar actions', [input.sourceSystem]);
      break;
    case 'CAPABILITY_PATTERN':
      add('CAPABILITY_SUGGESTION', `Capability gap noted: ${input.capabilityGapId ?? input.eventSummary.slice(0, 40)}`, [
        'missing_capability_detector',
        'safe_capability_acquisition',
      ]);
      break;
    case 'ACQUISITION_PATTERN':
      add('RECOMMENDATION', `Review acquisition plan: ${input.acquisitionPlanId ?? 'planned'}`, [
        'safe_capability_acquisition',
      ]);
      add('CHECKPOINT_SUGGESTION', 'Verify governance gates before acquisition proceed', ['safe_capability_acquisition']);
      break;
    case 'GOVERNANCE_PATTERN':
      add('GOVERNANCE_SUGGESTION', `Governance lesson: ${input.eventSummary.slice(0, 60)}`, [
        'execution_authority',
        'verification_gated_apply',
        'founder_approval_execution_gate',
      ], true);
      break;
    case 'MOBILE_PATTERN':
      add('RECOMMENDATION', `Mobile outcome lesson: ${input.eventSummary.slice(0, 60)}`, [
        'mobile_command_foundation',
        'mobile_approval_flow_foundation',
      ]);
      break;
    case 'ARCHITECTURE_PATTERN':
      add('BEST_PRACTICE', `Architecture pattern observed: ${input.eventSummary.slice(0, 60)}`, [
        'world2_execution_planner',
      ]);
      break;
    case 'VERIFICATION_PATTERN':
      add('CHECKPOINT_SUGGESTION', `Verification lesson: ${input.eventSummary.slice(0, 60)}`, [
        'world2_completion_verifier',
        'verification_gated_apply',
      ]);
      break;
    case 'APPROVAL_PATTERN':
      add('GOVERNANCE_SUGGESTION', `Approval outcome lesson: ${input.eventSummary.slice(0, 60)}`, [
        'founder_approval_execution_gate',
        'mobile_approval_flow_foundation',
      ]);
      break;
    case 'SIMULATION_PATTERN':
      add('RECOMMENDATION', `Simulation lesson: ${input.eventSummary.slice(0, 60)}`, ['world2_simulation_runtime']);
      break;
    default:
      add('RECOMMENDATION', `General lesson: ${input.eventSummary.slice(0, 60)}`, [input.sourceSystem]);
  }

  return guidance;
}

export function createFutureGuidance(
  input: LearningEventInput,
  category: LearningCategory,
  confidence: LearningConfidence,
  learningEventId: string,
  blocked: boolean,
): FutureGuidance[] {
  if (blocked || category === 'UNKNOWN') return [];
  return guidanceForCategory(input, category, confidence, learningEventId);
}

export function futureGuidanceListKey(guidance: FutureGuidance[]): string {
  return guidance.map((g) => `${g.guidanceType}:${g.guidanceSummary.slice(0, 20)}`).sort().join(';');
}

export function isRecommendationGuidance(type: GuidanceType): boolean {
  return type === 'RECOMMENDATION';
}

export function isWarningGuidance(type: GuidanceType): boolean {
  return type === 'WARNING';
}

export function isBestPracticeGuidance(type: GuidanceType): boolean {
  return type === 'BEST_PRACTICE';
}

export function isAvoidanceRuleGuidance(type: GuidanceType): boolean {
  return type === 'AVOIDANCE_RULE';
}

export function isCheckpointSuggestionGuidance(type: GuidanceType): boolean {
  return type === 'CHECKPOINT_SUGGESTION';
}

export function isCapabilitySuggestionGuidance(type: GuidanceType): boolean {
  return type === 'CAPABILITY_SUGGESTION';
}

export function isGovernanceSuggestionGuidance(type: GuidanceType): boolean {
  return type === 'GOVERNANCE_SUGGESTION';
}
