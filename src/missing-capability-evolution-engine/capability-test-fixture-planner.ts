/**
 * Missing Capability Evolution Engine — Stage 7: capability test fixture planning.
 */

import type { CapabilityDesign, CapabilityTestFixturePlan } from './missing-capability-evolution-types.js';

export function planCapabilityTestFixtures(design: CapabilityDesign): CapabilityTestFixturePlan {
  const base = design.name.replace(/\s+/g, '');

  return {
    readOnly: true,
    capabilityId: design.capabilityId,
    happyPath: [`${base} exports valid records`, `${base} produces downloadable output`],
    edgeCases: [`${base} handles single record`, `${base} handles large bounded dataset`],
    invalidInputs: [`${base} rejects null input`, `${base} rejects malformed options`],
    missingData: [`${base} handles empty collection gracefully`],
    failureStates: [`${base} reports serialization failure`],
    rollbackConditions: [`${base} install rollback restores prior registry`],
    accessibilityCases: design.accessibilityRequirements.map((c) => `${base} ${c} fixture`),
    performanceBoundaries: [`${base} completes within bounded time`],
    securityConstraints: design.securityConstraints.map((c) => `${base} ${c} fixture`),
  };
}
