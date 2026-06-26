/**
 * Interaction Proof Engine — failure classification.
 */

import type {
  InteractionAccessibilityProof,
  InteractionDeviceCoverageProof,
  InteractionEffectProof,
  InteractionEventProof,
  InteractionFailureCategory,
  InteractionFailureReport,
  InteractionHandlerProof,
  InteractionIntentMapping,
  InteractionInventoryRecord,
} from './interaction-proof-types.js';

let failureCounter = 0;

export function classifyInteractionFailure(input: {
  record: InteractionInventoryRecord;
  intent: InteractionIntentMapping;
  reachabilityPassed: boolean;
  accessibilityProof: InteractionAccessibilityProof;
  eventProof: InteractionEventProof;
  handlerProof: InteractionHandlerProof;
  effectProof: InteractionEffectProof;
  deviceCoverage: readonly InteractionDeviceCoverageProof[];
  passed: boolean;
}): InteractionFailureReport | null {
  if (input.passed) return null;

  failureCounter += 1;
  let category: InteractionFailureCategory = 'HANDLER_NOT_EXECUTED';
  let observed = 'Interaction proof failed';
  let likelyCause = 'Handler or effect chain incomplete';

  if (input.record.classification === 'UNKNOWN_INTERACTION') {
    category = 'UNMAPPED_INTERACTION_INTENT';
    observed = input.intent.unmappedReason ?? 'Unknown interaction with no mapped purpose';
    likelyCause = 'Clickable surface exists with no known purpose';
  } else if (!input.intent.mapped) {
    category = 'UNMAPPED_INTERACTION_INTENT';
    observed = input.intent.unmappedReason ?? 'Unmapped interaction intent';
    likelyCause = 'No mapped intent for interaction';
  } else if (!input.reachabilityPassed) {
    category = input.deviceCoverage.some((d) => !d.passed) ? 'DEVICE_SPECIFIC_FAILURE' : 'NOT_REACHABLE';
    observed = 'Interaction not reachable';
    likelyCause = 'Element not reachable on required device profile';
  } else if (!input.accessibilityProof.passed) {
    category = !input.accessibilityProof.accessibleNameExists ? 'ACCESSIBLE_NAME_MISSING' : 'ROLE_INCORRECT';
    observed = 'Accessibility identity failed';
    likelyCause = 'Missing accessible name or incorrect role';
  } else if (!input.eventProof.executionResult) {
    category = 'EVENT_NOT_FIRED';
    observed = 'Event did not fire';
    likelyCause = 'Click or activation event failed';
  } else if (!input.handlerProof.handlerBound) {
    category = 'HANDLER_NOT_BOUND';
    observed = 'Handler not bound';
    likelyCause = 'Button exists but has no handler';
  } else if (!input.handlerProof.handlerExecuted) {
    category = 'HANDLER_NOT_EXECUTED';
    observed = 'Handler not executed';
    likelyCause = 'Handler not invoked after event';
  } else if (!input.effectProof.dataMatched) {
    category = 'DATA_NOT_CHANGED';
    observed = input.effectProof.detail;
    likelyCause = 'Expected data mutation did not occur';
  } else if (!input.effectProof.uiMatched) {
    category = 'UI_NOT_CHANGED';
    observed = input.effectProof.detail;
    likelyCause = 'Expected UI confirmation missing';
  } else if (!input.effectProof.stateMatched) {
    category = 'STATE_NOT_CHANGED';
    observed = input.effectProof.detail;
    likelyCause = 'Expected state transition missing';
  }

  return {
    readOnly: true,
    failureId: `ix-fail-${failureCounter}`,
    interactionId: input.record.interactionId,
    interactionLabel: input.record.label,
    featureSliceId: input.record.featureSliceId,
    requirementIds: input.record.requirementIds,
    capabilityIds: input.record.capabilityIds,
    behaviorScenarioIds: input.record.behaviorScenarioIds,
    virtualUserJourneyIds: input.record.virtualUserJourneyIds,
    deviceProfiles: input.deviceCoverage.filter((d) => !d.passed).map((d) => d.deviceProfileId),
    expectedResult: input.record.expectedUiEffect,
    observedResult: observed,
    category,
    severity: input.record.riskLevel === 'HIGH' ? 'BLOCKING' : 'HIGH',
    likelyCause,
    responsibleArtifact: `src/features/${input.record.featureSliceId}`,
    repairRecommendation: `Repair ${category} for ${input.record.label}`,
  };
}

export function resetInteractionFailureClassifierForTests(): void {
  failureCounter = 0;
}
