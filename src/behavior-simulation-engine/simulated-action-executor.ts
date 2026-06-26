/**
 * Behavior Simulation Engine — simulated action execution.
 */

import type {
  InteractionTarget,
  SimulatedActionRecord,
  SimulationActionPlan,
} from './behavior-simulation-types.js';

let actionCounter = 0;

export interface SimulationExecutionContext {
  simulateBrokenHandler?: boolean;
  simulateUiWithoutData?: boolean;
}

export function executeSimulatedActions(input: {
  plan: SimulationActionPlan;
  targets: readonly InteractionTarget[];
  context?: SimulationExecutionContext;
}): SimulatedActionRecord[] {
  const records: SimulatedActionRecord[] = [];
  const scenarioTargets = input.targets.filter((t) => t.traceabilityLinks.includes(input.plan.scenarioId));
  let currentState = input.plan.initialState;

  for (const step of input.plan.interactionSteps) {
    actionCounter += 1;
    const target = scenarioTargets.find((t) => step.toLowerCase().includes(t.accessibleName.toLowerCase())) ??
      scenarioTargets[0];
    const stateBefore = currentState;
    const handlerConnected = !(input.context?.simulateBrokenHandler && /save|speak|delete|export/i.test(step));
    const stateAfter = handlerConnected
      ? input.plan.expectedFinalState
      : stateBefore;
    const uiAfter = input.context?.simulateUiWithoutData && /save|success/i.test(step)
      ? 'Success message displayed'
      : input.plan.expectedUiEffects[0] ?? 'UI updated';

    records.push({
      readOnly: true,
      actionId: `action-${actionCounter}`,
      targetId: target?.targetId ?? 'target-unknown',
      actionType: inferActionType(step),
      timestamp: Date.now(),
      result: handlerConnected && stateAfter !== stateBefore ? 'PASS' : handlerConnected ? 'PASS' : 'FAIL',
      observedStateBefore: stateBefore,
      observedStateAfter: stateAfter,
      observedUiBefore: 'Initial UI',
      observedUiAfter: uiAfter,
      errors: handlerConnected ? [] : ['Handler did not execute'],
      durationMs: 12,
    });
    currentState = stateAfter;
  }

  return records;
}

function inferActionType(step: string): string {
  if (/click/i.test(step)) return 'CLICK';
  if (/enter|type/i.test(step)) return 'TYPE';
  if (/navigate/i.test(step)) return 'NAVIGATE';
  if (/select/i.test(step)) return 'SELECT';
  if (/save|submit/i.test(step)) return 'SUBMIT';
  if (/open/i.test(step)) return 'OPEN_MENU';
  if (/blink|gesture/i.test(step)) return 'GESTURE';
  return 'CLICK';
}

export function resetSimulatedActionExecutorForTests(): void {
  actionCounter = 0;
}
