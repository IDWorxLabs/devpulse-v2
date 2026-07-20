/**
 * Universal Capability Composition Engine V1 — requirement loading from approved envelope.
 *
 * Reads only ApprovedProductionBuildEnvelope and constitutionally approved descriptors.
 * Raw prompt text does not independently authorize capabilities.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import {
  extractCapabilityRequirementsFromEnvelope,
} from '../universal-capability-pack-framework/approved-capability-requirement-extractor.js';
import {
  normalizeCapabilityRequirements,
} from '../universal-capability-pack-framework/capability-requirement-normalizer.js';
import {
  stableCapabilityRequirementId,
  type CapabilityRequirementDescriptor,
} from '../universal-capability-pack-framework/universal-capability-pack-types.js';
import {
  NATIVE_CAPABILITY_KEYS,
  NATIVE_PROVIDER_IDS,
} from './native-capability-provider-registry.js';
import {
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
  type CompositionPlanBuildInput,
} from './universal-capability-composition-types.js';

export function loadPackCapabilityRequirements(
  envelope: ApprovedProductionBuildEnvelope,
): CapabilityRequirementDescriptor[] {
  const raw = extractCapabilityRequirementsFromEnvelope({ envelope });
  return normalizeCapabilityRequirements(raw);
}

export function loadNativeCapabilityRequirements(
  input: CompositionPlanBuildInput,
): CapabilityRequirementDescriptor[] {
  const { envelope, moduleIds, moduleEligibility } = input;
  const requirements: CapabilityRequirementDescriptor[] = [];
  const provenance = [UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE, 'native-requirement-loader'];

  const nativeDefs: readonly {
    readonly key: string;
    readonly label: string;
    readonly eligible: boolean;
    readonly providerId: string;
  }[] = [
    {
      key: NATIVE_CAPABILITY_KEYS.CRUD,
      label: 'Entity CRUD management',
      eligible: moduleIds.some((m) => moduleEligibility.crudByModule[m]),
      providerId: NATIVE_PROVIDER_IDS.CRUD,
    },
    {
      key: NATIVE_CAPABILITY_KEYS.ACTION,
      label: 'Executable action materialization',
      eligible: moduleIds.some((m) => moduleEligibility.actionByModule[m]),
      providerId: NATIVE_PROVIDER_IDS.ACTION,
    },
    {
      key: NATIVE_CAPABILITY_KEYS.WORKFLOW,
      label: 'Workflow state machine',
      eligible: moduleIds.some((m) => moduleEligibility.workflowByModule[m]),
      providerId: NATIVE_PROVIDER_IDS.WORKFLOW,
    },
    {
      key: NATIVE_CAPABILITY_KEYS.RELATIONSHIP,
      label: 'Relationship intelligence',
      eligible: moduleIds.some((m) => moduleEligibility.relationshipByModule[m]),
      providerId: NATIVE_PROVIDER_IDS.RELATIONSHIP,
    },
    {
      key: NATIVE_CAPABILITY_KEYS.RUNTIME,
      label: 'Runtime state coordination',
      eligible: moduleIds.some((m) => moduleEligibility.runtimeByModule[m]),
      providerId: NATIVE_PROVIDER_IDS.RUNTIME,
    },
    {
      key: NATIVE_CAPABILITY_KEYS.RULE,
      label: 'Business rule evaluation',
      eligible: moduleIds.some((m) => moduleEligibility.ruleByModule[m]),
      providerId: NATIVE_PROVIDER_IDS.RULE,
    },
  ];

  for (const def of nativeDefs) {
    if (!def.eligible) continue;
    requirements.push({
      requirementId: stableCapabilityRequirementId(def.key, 'native'),
      capabilityKey: def.key,
      category: 'CORE_EXTENSION',
      label: def.label,
      description: `Approved envelope requires ${def.label} via ${def.providerId}`,
      moduleIds: [...moduleIds],
      requiredBehaviors: [def.key],
      criticality: 'REQUIRED',
      optional: false,
      sourceEnvelopePaths: ['approvedProductionBuildEnvelope.modules'],
      provenance: [...provenance, def.providerId],
      supportClassification: 'NOT_REQUIRED',
    });
  }

  return requirements.sort((a, b) => a.requirementId.localeCompare(b.requirementId));
}

export function loadAllCapabilityRequirements(input: CompositionPlanBuildInput): CapabilityRequirementDescriptor[] {
  const native = loadNativeCapabilityRequirements(input);
  const pack = loadPackCapabilityRequirements(input.envelope);
  const seen = new Set<string>();
  const merged: CapabilityRequirementDescriptor[] = [];

  for (const req of [...native, ...pack]) {
    if (seen.has(req.capabilityKey)) continue;
    seen.add(req.capabilityKey);
    merged.push(req);
  }

  return merged.sort((a, b) => a.requirementId.localeCompare(b.requirementId));
}

export function envelopeFingerprint(envelope: ApprovedProductionBuildEnvelope): string {
  return [
    envelope.traceability.contractId,
    envelope.traceability.buildId ?? '',
    envelope.traceability.promptHash ?? '',
    envelope.approvedProductIdentity.displayName,
  ].join('|');
}
