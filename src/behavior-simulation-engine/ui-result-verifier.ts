/**
 * Behavior Simulation Engine — UI result verification.
 */

import type { BehaviorScenario, SimulatedActionRecord, UiResultVerification } from './behavior-simulation-types.js';

export function verifyUiResult(input: {
  scenario: BehaviorScenario;
  actions: readonly SimulatedActionRecord[];
  dataMatched: boolean;
  simulateUiWithoutData?: boolean;
}): UiResultVerification {
  const expectedText = input.scenario.expectedUiResults[0] ?? input.scenario.name;
  const last = input.actions[input.actions.length - 1];
  const observedText = last?.observedUiAfter ?? 'none';
  const visibilityMatch = Boolean(observedText) && observedText !== 'none';
  const routeMatch = !/navigate|history|report/i.test(input.scenario.name) || visibilityMatch;

  const matched =
    visibilityMatch &&
    routeMatch &&
    (input.dataMatched || input.scenario.expectedDataUpdates.length === 0) &&
    !input.simulateUiWithoutData;

  return {
    readOnly: true,
    scenarioId: input.scenario.scenarioId,
    expectedText,
    observedText,
    visibilityMatch,
    routeMatch,
    matched,
  };
}
