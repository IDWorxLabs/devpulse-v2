/**
 * Missing Capability Evolution Engine — Stage 6: capability validator design.
 */

import type { CapabilityDesign, CapabilityValidatorDesign } from './missing-capability-evolution-types.js';

export function designCapabilityValidators(design: CapabilityDesign): CapabilityValidatorDesign {
  const base = design.name.replace(/\s+/g, '');

  return {
    readOnly: true,
    capabilityId: design.capabilityId,
    unitChecks: [`${base} serializes valid input`, `${base} rejects empty data`, `${base} handles invalid options`],
    integrationChecks: [`${base} integrates with capability registry`, `${base} exports through index`],
    promptFaithfulnessChecks: [`${base} satisfies prompt requirement evidence`, `${base} traceable to source requirements`],
    capabilityContractChecks: [`${base} public interface stable`, `${base} versioned exports`],
    safetyChecks: design.securityConstraints.map((c) => `${base} enforces ${c}`),
    regressionChecks: [`${base} does not mutate unrelated modules`],
    performanceChecks: design.performanceConstraints.map((c) => `${base} respects ${c}`),
    accessibilityChecks: design.accessibilityRequirements.map((c) => `${base} supports ${c}`),
  };
}
