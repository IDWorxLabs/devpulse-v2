/**
 * Behavior Simulation Engine — behavior model construction.
 */

import type { BehaviorScenario, BehaviorModel } from './behavior-simulation-types.js';

let modelCounter = 0;

export function buildBehaviorModel(input: {
  productLabel: string;
  scenarios: readonly BehaviorScenario[];
}): BehaviorModel {
  modelCounter += 1;
  const states: BehaviorModel['states'] = [];
  const transitions: BehaviorModel['transitions'] = [];

  for (const scenario of input.scenarios) {
    const fromId = `state-${slugify(scenario.preconditions[0] ?? 'initial')}`;
    const toId = `state-${slugify(scenario.expectedStateChanges[0] ?? scenario.name)}`;
    if (!states.find((s) => s.stateId === fromId)) {
      states.push({
        readOnly: true,
        stateId: fromId,
        label: scenario.preconditions[0] ?? 'Initial',
        description: scenario.preconditions.join('; ') || 'Initial application state',
      });
    }
    if (!states.find((s) => s.stateId === toId)) {
      states.push({
        readOnly: true,
        stateId: toId,
        label: scenario.expectedStateChanges[0] ?? scenario.name,
        description: scenario.expectedStateChanges.join('; '),
      });
    }
    transitions.push({
      readOnly: true,
      transitionId: `trans-${scenario.scenarioId}`,
      fromStateId: fromId,
      action: scenario.actionSteps[scenario.actionSteps.length - 1] ?? scenario.name,
      toStateId: toId,
      expectedUi: scenario.expectedUiResults,
      requirementIds: scenario.sourceRequirementIds,
    });
  }

  return {
    readOnly: true,
    modelId: `beh-model-${modelCounter}`,
    productLabel: input.productLabel,
    states,
    transitions,
    traceableToPrompt: input.scenarios.some((s) => s.sourceRequirementIds.length > 0),
  };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}
