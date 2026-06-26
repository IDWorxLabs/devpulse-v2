/**
 * Missing Capability Evolution Engine — Stage 4: capability interface design.
 */

import type { CapabilityDesign, CapabilityInterfaceDesign } from './missing-capability-evolution-types.js';

export function designCapabilityInterface(design: CapabilityDesign): CapabilityInterfaceDesign {
  const base = design.capabilityId.replace(/^cap-evolved-/, '');

  return {
    readOnly: true,
    capabilityId: design.capabilityId,
    version: '1.0.0',
    publicTypes: [`${base}Options`, `${base}Result`, `${base}Error`],
    publicFunctions: [`export${design.name.replace(/\s+/g, '')}`, `validate${design.name.replace(/\s+/g, '')}Input`],
    events: [`${base}:export-complete`, `${base}:export-failed`],
    stateContracts: [`${base}State`],
    serviceContracts: [`I${design.name.replace(/\s+/g, '')}Service`],
    dataContracts: [`${base}Record`, `${base}ExportPayload`],
    validationHooks: ['validateInput', 'validateOutput', 'validatePromptFaithfulness'],
    errorTypes: [`${base}ValidationError`, `${base}ExportError`],
    configurationOptions: ['delimiter', 'encoding', 'includeHeaders'],
    integrationPoints: ['capability-planning-registry', 'incremental-autonomous-builder'],
    projectSpecific: false,
  };
}
