/**
 * Missing Capability Evolution Engine — Stage 12: capability reuse indexing.
 */

import type {
  CapabilityDesign,
  CapabilityReuseIndexEntry,
  CapabilityValidationEvidence,
  EvolvedCapabilityRecord,
} from './missing-capability-evolution-types.js';
import {
  findExistingEvolvedCapability,
  registerCapabilityReuseIndexEntry,
} from './missing-capability-evolution-registry.js';

export function indexCapabilityForReuse(input: {
  design: CapabilityDesign;
  validation: CapabilityValidationEvidence;
  record: EvolvedCapabilityRecord;
}): CapabilityReuseIndexEntry {
  const keywords = [
    input.design.name,
    ...input.design.name.toLowerCase().split(/\s+/),
    input.design.capabilityId,
  ];

  const entry: CapabilityReuseIndexEntry = {
    readOnly: true,
    capabilityId: input.design.capabilityId,
    capabilityKeywords: keywords,
    requirementPatterns: [...input.design.sourceRequirements],
    promptPatterns: [/export/i.test(input.design.name) ? 'csv export' : input.design.name.toLowerCase()],
    domainPatterns: [...input.design.supportedProductDomains],
    platformPatterns: [...input.design.supportedPlatforms],
    supportedWorkflows: [`${input.design.name} export workflow`, `${input.design.name} integration`],
    unsupportedWorkflows: input.design.limitations,
    knownLimitations: [...input.design.limitations],
    validationEvidence: input.validation,
  };

  registerCapabilityReuseIndexEntry(entry);
  return entry;
}

export function checkCapabilityReuse(capabilityName: string): {
  existing: EvolvedCapabilityRecord | null;
  shouldEvolve: boolean;
  reuseReason: string | null;
} {
  const existing = findExistingEvolvedCapability(capabilityName);
  if (existing) {
    return {
      existing,
      shouldEvolve: false,
      reuseReason: `Existing validated capability ${existing.capabilityId} found in reuse index`,
    };
  }
  return { existing: null, shouldEvolve: true, reuseReason: null };
}

export function preventDuplicateEvolution(capabilityName: string): boolean {
  return findExistingEvolvedCapability(capabilityName) !== null;
}
