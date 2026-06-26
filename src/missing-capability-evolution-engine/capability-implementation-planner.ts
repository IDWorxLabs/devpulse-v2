/**
 * Missing Capability Evolution Engine — Stage 5: capability implementation planning.
 */

import type {
  CapabilityDesign,
  CapabilityImplementationPlan,
  CapabilityInterfaceDesign,
} from './missing-capability-evolution-types.js';

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function planCapabilityImplementation(input: {
  design: CapabilityDesign;
  interfaceDesign: CapabilityInterfaceDesign;
}): CapabilityImplementationPlan {
  const base = slug(input.design.name);
  const moduleRoot = `src/platform-capabilities/${base}`;

  return {
    readOnly: true,
    capabilityId: input.design.capabilityId,
    filesToCreate: [
      `${moduleRoot}/index.ts`,
      `${moduleRoot}/${base}.types.ts`,
      `${moduleRoot}/${base}.service.ts`,
      `${moduleRoot}/${base}.validator.ts`,
      `${moduleRoot}/${base}.fixtures.ts`,
    ],
    filesToModify: [],
    exports: [...input.interfaceDesign.publicFunctions, ...input.interfaceDesign.publicTypes],
    imports: ['capability-planning-registry'],
    internalHelpers: [`build${input.design.name.replace(/\s+/g, '')}Payload`, `serialize${input.design.name.replace(/\s+/g, '')}`],
    integrationPoints: input.interfaceDesign.integrationPoints,
    dependencyRequirements: [],
    isolationBoundary: moduleRoot,
    rollbackStrategy: 'atomic-snapshot-restore',
    postInstallChecks: [
      'npm run validate:missing-capability-evolution-engine',
      'STATIC',
      'TYPECHECK',
    ],
  };
}
