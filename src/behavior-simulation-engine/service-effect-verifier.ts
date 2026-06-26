/**
 * Behavior Simulation Engine — service effect verification.
 */

import type { BehaviorScenario, SimulatedActionRecord, ServiceEffectVerification } from './behavior-simulation-types.js';

export function verifyServiceEffect(input: {
  scenario: BehaviorScenario;
  actions: readonly SimulatedActionRecord[];
  simulateBrokenHandler?: boolean;
  simulateUiWithoutData?: boolean;
}): ServiceEffectVerification {
  const serviceName = input.scenario.expectedServiceEffects[0]?.replace(/\s+called.*/i, '') ?? 'PrimaryService';
  const handlerExecuted = input.actions.every((a) => a.result === 'PASS') && !input.simulateBrokenHandler;
  const observedCall = handlerExecuted && !input.simulateUiWithoutData;

  return {
    readOnly: true,
    scenarioId: input.scenario.scenarioId,
    serviceName,
    expectedCall: input.scenario.expectedServiceEffects.length > 0,
    observedCall,
    argumentsMatch: observedCall,
    errorState: observedCall ? null : 'Service not invoked',
    matched: observedCall || input.scenario.expectedServiceEffects.length === 0,
  };
}
