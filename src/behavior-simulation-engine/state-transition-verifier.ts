/**
 * Behavior Simulation Engine — state transition verification.
 */

import type { BehaviorScenario, SimulatedActionRecord, StateTransitionVerification } from './behavior-simulation-types.js';

export function verifyStateTransition(input: {
  scenario: BehaviorScenario;
  actions: readonly SimulatedActionRecord[];
  simulateBrokenHandler?: boolean;
}): StateTransitionVerification {
  const expected = input.scenario.expectedStateChanges[0] ?? input.scenario.name;
  const last = input.actions[input.actions.length - 1];
  const observed = last?.observedStateAfter ?? input.scenario.preconditions[0] ?? 'unknown';
  const matched =
    !input.simulateBrokenHandler &&
    input.actions.length > 0 &&
    input.actions.every((a) => a.result === 'PASS') &&
    (expected === observed || observed !== (input.scenario.preconditions[0] ?? ''));

  return {
    readOnly: true,
    scenarioId: input.scenario.scenarioId,
    expected,
    observed,
    matched,
  };
}
