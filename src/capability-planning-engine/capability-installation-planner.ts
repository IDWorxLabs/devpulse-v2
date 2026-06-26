/**
 * Capability Planning Engine Era 3 — atomic capability installation planning.
 */

import type {
  CapabilityGenerationPlanEra3,
  CapabilityInstallationPlanEra3,
  ComposedCapabilityPlan,
} from './capability-planning-types.js';

let installCounter = 0;

export function resetCapabilityInstallationPlannerForTests(): void {
  installCounter = 0;
}

export function planCapabilityInstallations(input: {
  generationPlans: readonly CapabilityGenerationPlanEra3[];
  compositions: readonly ComposedCapabilityPlan[];
}): CapabilityInstallationPlanEra3[] {
  const plans: CapabilityInstallationPlanEra3[] = [];

  for (const gen of input.generationPlans) {
    installCounter += 1;
    const slug = gen.capabilityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    plans.push({
      readOnly: true,
      planId: `install-${installCounter}`,
      capabilityId: gen.planId,
      targetModule: `src/features/${slug}`,
      exports: gen.expectedInterfaces,
      imports: ['FeatureAppRouter', 'universal-app-blueprint'],
      registryUpdates: ['capability-planning-registry', 'ownership-registry'],
      ownershipRegistration: 'devpulse_v2_capability_planning_engine',
      validatorRegistration: gen.requiredValidators,
      documentationUpdate: true,
      rollbackPath: gen.rollbackPlan,
      postInstallValidation: ['npm run validate:capability-planning-engine', 'STATIC', 'TYPECHECK'],
    });
  }

  for (const composed of input.compositions) {
    installCounter += 1;
    plans.push({
      readOnly: true,
      planId: `install-${installCounter}`,
      capabilityId: composed.composedId,
      targetModule: 'composed-capability-bridge',
      exports: [composed.name],
      imports: composed.sourceCapabilityIds,
      registryUpdates: ['capability-planning-registry'],
      ownershipRegistration: 'devpulse_v2_capability_planning_engine',
      validatorRegistration: composed.validationPlan,
      documentationUpdate: false,
      rollbackPath: ['Unregister composed capability', 'Restore source capabilities only'],
      postInstallValidation: composed.validationPlan,
    });
  }

  return plans;
}
