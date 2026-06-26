/**
 * Missing Capability Evolution Engine — Stage 11: capability registry update.
 */

import { registerCapabilityRecord } from '../capability-planning-engine/capability-planning-registry.js';
import type { CapabilityStatus } from '../capability-planning-engine/capability-planning-types.js';
import type {
  CapabilityInstallationResult,
  CapabilityValidationEvidence,
  EvolvedCapabilityRecord,
  EvolutionSafetyAssessment,
  CapabilityDesign,
} from './missing-capability-evolution-types.js';
import { registerEvolvedCapabilityRecord } from './missing-capability-evolution-registry.js';

export function updateCapabilityRegistry(input: {
  design: CapabilityDesign;
  safety: EvolutionSafetyAssessment;
  validation: CapabilityValidationEvidence;
  installation: CapabilityInstallationResult;
}): EvolvedCapabilityRecord | null {
  if (!input.installation.installed || !input.installation.postInstallValidationPassed) {
    return null;
  }

  const now = Date.now();
  const status =
    input.safety.verdict === 'SAFE_WITH_LIMITATIONS' ? 'EVOLVED_WITH_LIMITATIONS' : 'VALIDATED_EVOLVED';

  const record: EvolvedCapabilityRecord = {
    readOnly: true,
    capabilityId: input.design.capabilityId,
    name: input.design.name,
    version: '1.0.0',
    status,
    source: 'missing-capability-evolution-engine',
    ownerModule: 'devpulse_v2_missing_capability_evolution_engine',
    supportedRequirementCategories: ['FUNCTIONAL', 'API'],
    supportedProductDomains: [...input.design.supportedProductDomains],
    supportedPlatforms: [...input.design.supportedPlatforms],
    interfaces: [...input.design.interfaces],
    dependencies: [],
    validationEvidence: input.validation,
    safetyVerdict: input.safety.verdict,
    reuseScore: status === 'VALIDATED_EVOLVED' ? 0.92 : 0.78,
    limitations: [...input.design.limitations],
    createdAt: now,
    updatedAt: now,
    lastVerifiedAt: now,
  };

  registerEvolvedCapabilityRecord(record);

  const planningStatus: CapabilityStatus =
    status === 'VALIDATED_EVOLVED' ? 'VALIDATED' : 'AVAILABLE_WITH_LIMITATIONS';

  registerCapabilityRecord({
    readOnly: true,
    capabilityId: input.design.capabilityId,
    name: input.design.name,
    version: '1.0.0',
    status: planningStatus,
    source: 'missing-capability-evolution-engine',
    ownerModule: 'devpulse_v2_missing_capability_evolution_engine',
    supportedRequirementCategories: ['FUNCTIONAL', 'API'],
    supportedProductDomains: [...input.design.supportedProductDomains],
    supportedPlatforms: [...input.design.supportedPlatforms],
    dependencies: [],
    interfaces: [...input.design.interfaces],
    validationCoverage: [...input.validation.validatorNames],
    riskLevel: 'LOW',
    reuseConfidence: record.reuseScore,
    lastValidationStatus: 'PASS',
    description: input.design.purpose,
    sourceModule: `src/platform-capabilities/${input.design.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  });

  return record;
}
