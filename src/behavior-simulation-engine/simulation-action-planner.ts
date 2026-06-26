/**
 * Behavior Simulation Engine — simulation action planning.
 */

import {
  DEFAULT_SIMULATION_RETRY_BUDGET,
  DEFAULT_SIMULATION_TIMEOUT_MS,
  type BehaviorScenario,
  type SimulationActionPlan,
} from './behavior-simulation-types.js';

let planCounter = 0;

export function planSimulationActions(scenarios: readonly BehaviorScenario[]): SimulationActionPlan[] {
  return scenarios.map((scenario) => {
    planCounter += 1;
    const inputValues: Record<string, string> = {};
    if (/amount/i.test(scenario.name)) {
      inputValues.amount = '42.50';
      inputValues.category = 'Travel';
      inputValues.description = 'Client lunch';
    }
    if (/text size|settings/i.test(scenario.name)) {
      inputValues.textSize = 'large';
    }

    return {
      readOnly: true,
      planId: `sim-plan-${planCounter}`,
      scenarioId: scenario.scenarioId,
      initialState: scenario.preconditions[0] ?? 'App loaded',
      navigationSteps: scenario.actionSteps.filter((s) => /navigate|open/i.test(s)),
      interactionSteps: scenario.actionSteps,
      inputValues,
      expectedIntermediateStates: scenario.actionSteps.slice(0, -1).map((s) => `After: ${s}`),
      expectedFinalState: scenario.expectedStateChanges[0] ?? scenario.name,
      expectedServiceEffects: scenario.expectedServiceEffects,
      expectedDataEffects: scenario.expectedDataUpdates,
      expectedUiEffects: scenario.expectedUiResults,
      timeoutBudgetMs: DEFAULT_SIMULATION_TIMEOUT_MS,
      retryPolicy: `Bounded retry max ${DEFAULT_SIMULATION_RETRY_BUDGET}`,
      failureClassificationRules: [
        'TARGET_MISSING',
        'HANDLER_NOT_CONNECTED',
        'STATE_NOT_UPDATED',
        'SERVICE_NOT_EXECUTED',
        'DATA_NOT_UPDATED',
        'UI_NOT_UPDATED',
      ],
    };
  });
}
