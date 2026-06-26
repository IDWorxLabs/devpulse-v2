/**
 * Virtual User Engine — accessibility-aware user simulation.
 */

import type { VirtualUserJourney, VirtualUserPersona, VirtualUserStepResult } from './virtual-user-types.js';

export function analyzeVirtualUserAccessibility(input: {
  persona: VirtualUserPersona;
  journey: VirtualUserJourney;
  stepResults: readonly VirtualUserStepResult[];
  simulateAccessibilityBlocker?: boolean;
}): { passed: boolean; events: string[]; blockers: string[] } {
  const events: string[] = [];
  const blockers: string[] = [];
  const needsA11y = input.persona.requiredInputModes.some((m) => /BLINK|GAZE|ACCESSIBLE/i.test(m));

  if (!needsA11y) {
    return { passed: true, events: ['Standard input modes only'], blockers: [] };
  }

  if (input.persona.accessibilityRequirements.length) {
    events.push(`Enforcing: ${input.persona.accessibilityRequirements.join(', ')}`);
  }

  const failedAccessibleStep = input.stepResults.find(
    (s) => !s.passed && /blink|emergency|select|navigate/i.test(s.step),
  );

  if (input.simulateAccessibilityBlocker || failedAccessibleStep) {
    blockers.push('Required action unavailable through accessibility input mode');
    return { passed: false, events, blockers };
  }

  if (input.journey.steps.length > input.persona.attentionBudget && /emergency/i.test(input.journey.steps.join(' '))) {
    blockers.push('Emergency workflow exceeds minimal step count for accessibility user');
    return { passed: false, events, blockers };
  }

  events.push('Accessibility constraints satisfied');
  return { passed: true, events, blockers: [] };
}
