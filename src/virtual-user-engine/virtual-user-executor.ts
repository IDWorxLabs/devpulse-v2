/**
 * Virtual User Engine — journey execution via behavior simulation.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type {
  VirtualUserJourney,
  VirtualUserPersona,
  VirtualUserStepResult,
} from './virtual-user-types.js';

export interface VirtualUserExecutionContext {
  simulateAccessibilityBlocker?: boolean;
  simulateTooManySteps?: boolean;
  simulateMissingConfirmation?: boolean;
}

export function executeVirtualUserJourney(input: {
  journey: VirtualUserJourney;
  persona: VirtualUserPersona;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  context?: VirtualUserExecutionContext;
}): VirtualUserStepResult[] {
  const results: VirtualUserStepResult[] = [];
  const stepBudget = input.persona.attentionBudget;
  const tooManySteps = input.context?.simulateTooManySteps && /emergency/i.test(input.journey.steps.join(' '));
  const effectiveSteps = tooManySteps ? [...input.journey.steps, 'Extra navigation', 'Another screen', 'More taps'] : input.journey.steps;

  for (let i = 0; i < effectiveSteps.length; i++) {
    const step = effectiveSteps[i]!;
    const scenario = input.behaviorSimulation.scenarios.find((s) =>
      step.toLowerCase().split(' ').some((w) => w.length > 3 && s.name.toLowerCase().includes(w)),
    );
    const scenarioResult = scenario
      ? input.behaviorSimulation.scenarioResults.find((r) => r.scenarioId === scenario.scenarioId)
      : null;

    const accessibilityBlock =
      input.context?.simulateAccessibilityBlocker &&
      /patient|blink|emergency/i.test(input.persona.abilities.join(' ')) &&
      /navigate|select/i.test(step) &&
      i > 0;

    const passed =
      !accessibilityBlock &&
      (scenarioResult?.passed ?? true) &&
      i < stepBudget + (tooManySteps ? 3 : 0);

    results.push({
      readOnly: true,
      stepIndex: i,
      step,
      passed,
      behaviorScenarioId: scenario?.scenarioId ?? null,
      detail: accessibilityBlock ? 'Accessibility input unavailable' : passed ? 'pass' : 'step failed',
    });
  }

  return results;
}
