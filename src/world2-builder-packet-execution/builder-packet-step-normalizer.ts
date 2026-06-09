/**
 * Builder packet step normalizer — normalizes raw steps without executing them.
 */

import {
  ALLOWED_PHASE_15_2_STEP_TYPES,
  BLOCKED_PHASE_15_2_STEP_TYPES,
  type BuilderPacketExecutionStep,
  type BuilderPacketRawStep,
  type BuilderPacketStepType,
} from './types.js';

let stepCounter = 0;

function nextStepId(): string {
  stepCounter += 1;
  return `bstep-${stepCounter.toString().padStart(4, '0')}`;
}

export function resetBuilderPacketStepCounterForTests(): void {
  stepCounter = 0;
}

function isAllowedInPhase(stepType: BuilderPacketStepType): boolean {
  return (ALLOWED_PHASE_15_2_STEP_TYPES as readonly string[]).includes(stepType);
}

function blockedReasonForType(stepType: BuilderPacketStepType): string | null {
  if ((BLOCKED_PHASE_15_2_STEP_TYPES as readonly string[]).includes(stepType)) {
    return `Step type ${stepType} blocked in Phase 15.2 — proposal-only preparation`;
  }
  if (!isAllowedInPhase(stepType)) {
    return `Step type ${stepType} not allowed in Phase 15.2`;
  }
  return null;
}

export function normalizeBuilderPacketSteps(rawSteps: BuilderPacketRawStep[]): BuilderPacketExecutionStep[] {
  return rawSteps.map((raw, index) => {
    const blockedReason = blockedReasonForType(raw.stepType);
    const allowed = blockedReason === null;

    return {
      stepId: raw.stepId ?? nextStepId(),
      title: raw.title || `Step ${index + 1}`,
      description: raw.description,
      targetArea: raw.targetArea,
      stepType: raw.stepType,
      riskLevel: 'LOW',
      requiresApproval: false,
      allowedInThisPhase: allowed,
      blockedReason,
    };
  });
}
