/**
 * Learning event classifier — maps event types to learning categories.
 * Classification only. No behavior change.
 */

import type { GateRecord, LearningCategory, LearningEventInput, LearningEventType } from './types.js';
import { EVENT_TYPE_TO_CATEGORY, KNOWN_EVENT_TYPES } from './types.js';

export interface EventClassificationResult {
  valid: boolean;
  blocked: boolean;
  reason: string;
  gates: GateRecord[];
  eventType: LearningEventType;
  learningCategory: LearningCategory;
}

export function eventClassificationKey(eventType: LearningEventType, category: LearningCategory): string {
  return `${eventType}|${category}`;
}

export function isKnownEventType(eventType: LearningEventType): boolean {
  return KNOWN_EVENT_TYPES.includes(eventType as (typeof KNOWN_EVENT_TYPES)[number]);
}

export function classifyLearningEvent(input: LearningEventInput, blocked: boolean): EventClassificationResult {
  const gates: GateRecord[] = [];

  if (blocked) {
    return {
      valid: false,
      blocked: true,
      reason: 'Classification skipped — event blocked',
      gates,
      eventType: input.eventType,
      learningCategory: 'UNKNOWN',
    };
  }

  if (input.eventType === 'UNKNOWN') {
    gates.push({
      gateId: 'cls-type-0001',
      gateType: 'EVENT_TYPE_UNKNOWN',
      status: 'CLOSED',
      description: 'eventType UNKNOWN blocked',
    });
    return {
      valid: false,
      blocked: true,
      reason: 'eventType UNKNOWN blocked',
      gates,
      eventType: input.eventType,
      learningCategory: 'UNKNOWN',
    };
  }

  const learningCategory = EVENT_TYPE_TO_CATEGORY[input.eventType];

  gates.push({
    gateId: 'cls-done-0001',
    gateType: 'EVENT_CLASSIFIED',
    status: 'OPEN',
    description: `${input.eventType} → ${learningCategory}`,
  });

  return {
    valid: true,
    blocked: false,
    reason: 'Event classified',
    gates,
    eventType: input.eventType,
    learningCategory,
  };
}

export function isSuccessCategory(category: LearningCategory): boolean {
  return category === 'SUCCESS_PATTERN';
}

export function isFailureCategory(category: LearningCategory): boolean {
  return category === 'FAILURE_PATTERN';
}

export function isWarningCategory(category: LearningCategory): boolean {
  return category === 'WARNING_PATTERN';
}

export function isCapabilityCategory(category: LearningCategory): boolean {
  return category === 'CAPABILITY_PATTERN';
}

export function isAcquisitionCategory(category: LearningCategory): boolean {
  return category === 'ACQUISITION_PATTERN';
}

export function isGovernanceCategory(category: LearningCategory): boolean {
  return category === 'GOVERNANCE_PATTERN';
}

export function isMobileCategory(category: LearningCategory): boolean {
  return category === 'MOBILE_PATTERN';
}

export function isArchitectureCategory(category: LearningCategory): boolean {
  return category === 'ARCHITECTURE_PATTERN';
}

export function isVerificationCategory(category: LearningCategory): boolean {
  return category === 'VERIFICATION_PATTERN';
}

export function isApprovalCategory(category: LearningCategory): boolean {
  return category === 'APPROVAL_PATTERN';
}

export function isSimulationCategory(category: LearningCategory): boolean {
  return category === 'SIMULATION_PATTERN';
}
