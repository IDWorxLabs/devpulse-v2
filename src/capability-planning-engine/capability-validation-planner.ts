/**
 * Capability Planning Engine Era 3 — capability validation planning.
 */

import type {
  CapabilityGenerationPlanEra3,
  CapabilityValidationPlanEra3,
  ComposedCapabilityPlan,
  ExistingCapabilitySearchResult,
} from './capability-planning-types.js';

let valCounter = 0;

export function resetCapabilityValidationPlannerEra3ForTests(): void {
  valCounter = 0;
}

function buildPlan(capabilityId: string, a11y: boolean, security: boolean): CapabilityValidationPlanEra3 {
  valCounter += 1;
  return {
    readOnly: true,
    planId: `val-plan-${valCounter}`,
    capabilityId,
    staticValidation: true,
    typecheckValidation: true,
    unitValidation: true,
    integrationValidation: true,
    behaviorValidation: true,
    accessibilityValidation: a11y,
    securityValidation: security,
    performanceValidation: false,
    promptFaithfulnessValidation: true,
    regressionValidation: true,
  };
}

export function planCapabilityValidations(input: {
  searchResults: readonly ExistingCapabilitySearchResult[];
  compositions: readonly ComposedCapabilityPlan[];
  generationPlans: readonly CapabilityGenerationPlanEra3[];
}): CapabilityValidationPlanEra3[] {
  const plans: CapabilityValidationPlanEra3[] = [];

  for (const search of input.searchResults) {
    if (search.matchedCapability && search.matchType !== 'MISSING') {
      const a11y = /accessib|blink|gaze|keyboard/i.test(search.requiredCapability.name);
      const security = /auth|payment|security/i.test(search.requiredCapability.name);
      plans.push(buildPlan(search.matchedCapability.capabilityId, a11y, security));
    }
  }

  for (const composed of input.compositions) {
    plans.push(buildPlan(composed.composedId, true, false));
  }

  for (const gen of input.generationPlans) {
    plans.push(buildPlan(gen.planId, /accessib/i.test(gen.capabilityName), /auth|payment/i.test(gen.capabilityName)));
  }

  return plans;
}
