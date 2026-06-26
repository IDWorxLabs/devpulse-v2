/**
 * Behavior Simulation Engine — data update verification.
 */

import type { BehaviorScenario, DataUpdateVerification } from './behavior-simulation-types.js';

export function verifyDataUpdate(input: {
  scenario: BehaviorScenario;
  serviceMatched: boolean;
  simulateUiWithoutData?: boolean;
}): DataUpdateVerification {
  const expectedMutation = input.scenario.expectedDataUpdates[0] ?? 'none';
  const dataStore = /expense/i.test(input.scenario.name)
    ? 'expenseStore'
    : /history|message/i.test(input.scenario.name)
      ? 'messageHistoryStore'
      : /settings/i.test(input.scenario.name)
        ? 'settingsStore'
        : 'appStore';

  const observedMutation =
    input.simulateUiWithoutData && expectedMutation !== 'none'
      ? 'none'
      : expectedMutation;
  const matched =
    expectedMutation === 'none' ||
    (input.serviceMatched && !input.simulateUiWithoutData && observedMutation === expectedMutation);

  return {
    readOnly: true,
    scenarioId: input.scenario.scenarioId,
    dataStore,
    expectedMutation,
    observedMutation,
    persistenceStatus: matched ? 'PERSISTED' : input.simulateUiWithoutData ? 'NOT_PERSISTED' : 'UNKNOWN',
    matched,
  };
}
