/**
 * Virtual User Engine — usability friction analysis.
 */

import type { FrictionEvent, FrictionSeverity, VirtualUserJourney, VirtualUserPersona, VirtualUserStepResult } from './virtual-user-types.js';

let frictionCounter = 0;

export function analyzeVirtualUserFriction(input: {
  journey: VirtualUserJourney;
  persona: VirtualUserPersona;
  stepResults: readonly VirtualUserStepResult[];
  simulateTooManySteps?: boolean;
  simulateMissingConfirmation?: boolean;
}): FrictionEvent[] {
  const events: FrictionEvent[] = [];
  const stepCount = input.stepResults.length;
  const budget = input.persona.attentionBudget;

  if (stepCount > budget || input.simulateTooManySteps) {
    frictionCounter += 1;
    const severity: FrictionSeverity = /emergency/i.test(input.journey.steps.join(' ')) ? 'BLOCKING' : 'HIGH';
    events.push({
      readOnly: true,
      eventId: `friction-${frictionCounter}`,
      journeyId: input.journey.journeyId,
      description: `Too many steps (${stepCount}) for user attention budget (${budget})`,
      severity,
      category: 'TOO_MANY_STEPS',
    });
  }

  const failedSteps = input.stepResults.filter((s) => !s.passed);
  if (failedSteps.length) {
    frictionCounter += 1;
    events.push({
      readOnly: true,
      eventId: `friction-${frictionCounter}`,
      journeyId: input.journey.journeyId,
      description: `Failed steps: ${failedSteps.map((s) => s.step).join(', ')}`,
      severity: 'HIGH',
      category: 'JOURNEY_FRICTION',
    });
  }

  const hasConfirmation = input.journey.steps.some((s) => /confirm|verify/i.test(s));
  if ((!hasConfirmation && /emergency|save|delete/i.test(input.journey.steps.join(' '))) || input.simulateMissingConfirmation) {
    frictionCounter += 1;
    events.push({
      readOnly: true,
      eventId: `friction-${frictionCounter}`,
      journeyId: input.journey.journeyId,
      description: 'Missing confirmation after critical action',
      severity: 'HIGH',
      category: 'NO_CONFIRMATION',
    });
  }

  if (/locked-in|patient/i.test(input.persona.abilities.join(' ') + input.persona.limitations.join(' '))) {
    const tinyTargetRisk = stepCount > 4 && !input.journey.accessibilityExpectations.length;
    if (tinyTargetRisk) {
      frictionCounter += 1;
      events.push({
        readOnly: true,
        eventId: `friction-${frictionCounter}`,
        journeyId: input.journey.journeyId,
        description: 'Journey may require targets too small for accessibility user',
        severity: 'MEDIUM',
        category: 'ACCESSIBILITY_FRICTION',
      });
    }
  }

  return events;
}

export function resetVirtualUserFrictionAnalyzerForTests(): void {
  frictionCounter = 0;
}
