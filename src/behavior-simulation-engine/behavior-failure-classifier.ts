/**
 * Behavior Simulation Engine — behavior failure classification.
 */

import type {
  BehaviorFailureCategory,
  BehaviorFailureReport,
  BehaviorScenario,
  DataUpdateVerification,
  ServiceEffectVerification,
  SimulatedActionRecord,
  StateTransitionVerification,
  UiResultVerification,
} from './behavior-simulation-types.js';

let failureCounter = 0;

export function classifyBehaviorFailure(input: {
  scenario: BehaviorScenario;
  actions: readonly SimulatedActionRecord[];
  state: StateTransitionVerification;
  service: ServiceEffectVerification;
  data: DataUpdateVerification;
  ui: UiResultVerification;
}): BehaviorFailureReport | null {
  if (input.state.matched && input.service.matched && input.data.matched && input.ui.matched) {
    return null;
  }

  failureCounter += 1;
  let category: BehaviorFailureCategory = 'UNEXPECTED_ERROR';
  let likelyCause = 'Unknown behavior mismatch';
  let expectedResult = input.scenario.expectedUiResults[0] ?? 'pass';
  let observedResult = input.ui.observedText;

  if (input.actions.some((a) => a.errors.some((e) => /handler/i.test(e)))) {
    category = 'HANDLER_NOT_CONNECTED';
    likelyCause = 'Interaction target exists but handler not connected';
    expectedResult = 'Handler executes';
    observedResult = 'No handler execution';
  } else if (!input.data.matched && input.ui.visibilityMatch) {
    category = 'DATA_NOT_UPDATED';
    likelyCause = 'UI updated without required data mutation';
    expectedResult = input.data.expectedMutation;
    observedResult = input.data.observedMutation;
  } else if (!input.data.matched && input.ui.matched) {
    category = 'DATA_NOT_UPDATED';
    likelyCause = 'UI updated without required data mutation';
    expectedResult = input.data.expectedMutation;
    observedResult = input.data.observedMutation;
  } else if (!input.state.matched) {
    category = 'STATE_NOT_UPDATED';
    likelyCause = 'Expected state transition did not occur';
    expectedResult = input.state.expected;
    observedResult = input.state.observed;
  } else if (!input.service.matched) {
    category = 'SERVICE_NOT_EXECUTED';
    likelyCause = 'Required service was not invoked';
    expectedResult = input.service.serviceName;
    observedResult = 'not called';
  } else if (!input.ui.matched) {
    category = 'UI_NOT_UPDATED';
    likelyCause = 'Expected UI result not observed';
  }

  return {
    readOnly: true,
    failureId: `beh-fail-${failureCounter}`,
    scenarioId: input.scenario.scenarioId,
    step: input.scenario.actionSteps[input.scenario.actionSteps.length - 1] ?? input.scenario.name,
    targetId: input.actions[input.actions.length - 1]?.targetId ?? 'unknown',
    category,
    expectedResult,
    observedResult,
    likelyCause,
    responsibleFeatureSliceId: input.scenario.featureSliceIds[0] ?? 'unknown',
    responsibleCapabilityId: input.scenario.capabilityIds[0] ?? 'unknown',
    responsibleArtifact: `src/features/${slugify(input.scenario.name)}`,
    repairRecommendation: `Repair ${category} in feature slice ${input.scenario.featureSliceIds[0] ?? 'core'}`,
  };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function resetBehaviorFailureClassifierForTests(): void {
  failureCounter = 0;
}
