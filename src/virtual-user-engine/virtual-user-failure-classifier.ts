/**
 * Virtual User Engine — failure classification.
 */

import type {
  FrictionEvent,
  VirtualUserFailureCategory,
  VirtualUserFailureReport,
  VirtualUserGoal,
  VirtualUserJourney,
  VirtualUserStepResult,
} from './virtual-user-types.js';

let failureCounter = 0;

export function classifyVirtualUserFailure(input: {
  goal: VirtualUserGoal;
  journey: VirtualUserJourney;
  stepResults: readonly VirtualUserStepResult[];
  frictionEvents: readonly FrictionEvent[];
  accessibilityBlockers: readonly string[];
  completionStatus: string;
}): VirtualUserFailureReport | null {
  if (input.completionStatus === 'COMPLETED' || input.completionStatus === 'SKIPPED_WITH_JUSTIFICATION') {
    return null;
  }

  failureCounter += 1;
  const failedStep = input.stepResults.find((s) => !s.passed);
  let category: VirtualUserFailureCategory = 'GOAL_NOT_REACHED';
  let likelyCause = 'User goal not achieved';

  if (input.accessibilityBlockers.length) {
    category = 'ACCESSIBILITY_BLOCKER';
    likelyCause = input.accessibilityBlockers[0] ?? 'Accessibility blocker';
  } else if (input.frictionEvents.some((f) => f.category === 'TOO_MANY_STEPS' && f.severity === 'BLOCKING')) {
    category = 'TOO_MANY_STEPS';
    likelyCause = 'Emergency or critical workflow requires excessive navigation';
  } else if (input.frictionEvents.some((f) => f.category === 'NO_CONFIRMATION')) {
    category = 'NO_CONFIRMATION';
    likelyCause = 'Action completed without visible confirmation';
  } else if (failedStep?.behaviorScenarioId) {
    category = 'BEHAVIOR_FAILED';
    likelyCause = 'Underlying behavior scenario failed during journey';
  } else if (failedStep) {
    category = 'JOURNEY_BLOCKED';
    likelyCause = failedStep.detail;
  }

  return {
    readOnly: true,
    failureId: `vu-fail-${failureCounter}`,
    userId: input.goal.userId,
    goalId: input.goal.goalId,
    journeyId: input.journey.journeyId,
    failedStep: failedStep?.step ?? input.journey.steps[0] ?? 'unknown',
    expectedOutcome: input.goal.completionCriteria[0] ?? 'Goal completed',
    observedOutcome: failedStep?.detail ?? 'Goal not reached',
    category,
    affectedRequirementIds: input.goal.sourceRequirements,
    affectedFeatureSliceIds: input.goal.requiredFeatureSliceIds,
    affectedBehaviorScenarioIds: input.goal.requiredBehaviorScenarioIds,
    likelyCause,
    repairRecommendation: `Repair ${category} for journey ${input.journey.journeyId}`,
  };
}

export function resetVirtualUserFailureClassifierForTests(): void {
  failureCounter = 0;
}
