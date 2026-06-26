/**
 * Missing Capability Evolution Engine — Stage 8: capability workspace generation.
 */

import type {
  CapabilityDesign,
  CapabilityImplementationPlan,
  CapabilityTestFixturePlan,
  CapabilityValidatorDesign,
  CapabilityWorkspaceArtifact,
} from './missing-capability-evolution-types.js';

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function generateCapabilityWorkspace(input: {
  design: CapabilityDesign;
  implementationPlan: CapabilityImplementationPlan;
  validatorDesign: CapabilityValidatorDesign;
  fixturePlan: CapabilityTestFixturePlan;
}): CapabilityWorkspaceArtifact {
  const base = slug(input.design.name);
  const moduleRoot = input.implementationPlan.isolationBoundary;

  return {
    readOnly: true,
    capabilityId: input.design.capabilityId,
    modulePath: moduleRoot,
    typesPath: `${moduleRoot}/${base}.types.ts`,
    implementationPath: `${moduleRoot}/${base}.service.ts`,
    validatorsPath: `${moduleRoot}/${base}.validator.ts`,
    fixturesPath: `${moduleRoot}/${base}.fixtures.ts`,
    registryMetadataPath: `${moduleRoot}/registry-metadata.json`,
    documentationPath: `${moduleRoot}/README.md`,
    adapterPath: null,
  };
}
