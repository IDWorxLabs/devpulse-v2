/**
 * Missing Capability Evolution Engine — Stage 3: capability design planning.
 */

import type {
  CapabilityDesign,
  EvolutionSafetyAssessment,
  MissingCapabilityIntakeItem,
} from './missing-capability-evolution-types.js';

let designCounter = 0;

export function resetCapabilityDesignPlannerForTests(): void {
  designCounter = 0;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function planCapabilityDesign(input: {
  item: MissingCapabilityIntakeItem;
  safety: EvolutionSafetyAssessment;
}): CapabilityDesign {
  designCounter += 1;
  const id = `cap-evolved-${slug(input.item.capabilityName)}`;

  return {
    readOnly: true,
    capabilityId: id,
    name: input.item.capabilityName,
    purpose: input.item.reasonRequired,
    sourceRequirements: input.item.sourceRequirementIds,
    supportedProductDomains: ['CUSTOM_APPLICATION'],
    supportedPlatforms: ['WEB'],
    inputs: ['sourceData', 'exportOptions'],
    outputs: ['exportedContent', 'exportMetadata'],
    interfaces: input.item.expectedInterfaces,
    stateRequirements: [],
    dataRequirements: ['serializableRecords'],
    serviceRequirements: [`${slug(input.item.capabilityName)}.service`],
    uiRequirements: /export|csv/i.test(input.item.capabilityName) ? ['exportButton', 'downloadLink'] : [],
    accessibilityRequirements: ['keyboardAccessibleExport'],
    errorHandling: ['invalidInput', 'emptyDataSet'],
    securityConstraints: ['noCredentialExposure', 'sanitizeOutput'],
    performanceConstraints: ['boundedMemoryExport'],
    validationRequirements: input.item.requiredValidation,
    reuseRules: ['requirePromptEvidence', 'deterministicValidation'],
    limitations: input.safety.limitations,
  };
}
