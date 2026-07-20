/**
 * Universal Capability Composition Engine V1 — B1–B6 native provider registry.
 */

import type { NativeCapabilityProviderDescriptor } from './universal-capability-composition-types.js';
import { UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE } from './universal-capability-composition-types.js';

export const NATIVE_PROVIDER_IDS = {
  CRUD: 'native.universal-crud-generation-engine.v1',
  ACTION: 'native.universal-action-materialization-engine.v1',
  WORKFLOW: 'native.universal-workflow-generation-engine.v1',
  RELATIONSHIP: 'native.universal-relationship-intelligence-engine.v1',
  RUNTIME: 'native.universal-runtime-state-engine.v1',
  RULE: 'native.universal-business-rule-engine.v1',
} as const;

export const NATIVE_CAPABILITY_KEYS = {
  CRUD: 'crud.entity-management',
  ACTION: 'actions.materialization',
  WORKFLOW: 'workflows.state-machine',
  RELATIONSHIP: 'relationships.intelligence',
  RUNTIME: 'runtime.state-coordination',
  RULE: 'rules.business-evaluation',
} as const;

const BASE_PROVENANCE = [UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE, 'native-provider-registry'] as const;

export const NATIVE_CAPABILITY_PROVIDERS: readonly NativeCapabilityProviderDescriptor[] = [
  {
    providerId: NATIVE_PROVIDER_IDS.CRUD,
    providerKind: 'NATIVE',
    version: '1.0.0',
    providedCapabilities: [NATIVE_CAPABILITY_KEYS.CRUD],
    compositionPhase: 'ENTITY',
    contributionTypes: ['source_file', 'shared_runtime', 'module_artifact', 'persistence_adapter', 'ui_surface'],
    requiredInputs: ['approvedModules', 'approvedEntities'],
    productionReadiness: true,
    provenance: [...BASE_PROVENANCE, NATIVE_PROVIDER_IDS.CRUD],
  },
  {
    providerId: NATIVE_PROVIDER_IDS.ACTION,
    providerKind: 'NATIVE',
    version: '1.0.0',
    providedCapabilities: [NATIVE_CAPABILITY_KEYS.ACTION],
    compositionPhase: 'ACTION',
    contributionTypes: ['source_file', 'shared_runtime', 'action', 'ui_surface'],
    requiredInputs: ['approvedActions'],
    productionReadiness: true,
    provenance: [...BASE_PROVENANCE, NATIVE_PROVIDER_IDS.ACTION],
  },
  {
    providerId: NATIVE_PROVIDER_IDS.WORKFLOW,
    providerKind: 'NATIVE',
    version: '1.0.0',
    providedCapabilities: [NATIVE_CAPABILITY_KEYS.WORKFLOW],
    compositionPhase: 'WORKFLOW',
    contributionTypes: ['source_file', 'shared_runtime', 'workflow', 'ui_surface'],
    requiredInputs: ['approvedWorkflows'],
    productionReadiness: true,
    provenance: [...BASE_PROVENANCE, NATIVE_PROVIDER_IDS.WORKFLOW],
  },
  {
    providerId: NATIVE_PROVIDER_IDS.RELATIONSHIP,
    providerKind: 'NATIVE',
    version: '1.0.0',
    providedCapabilities: [NATIVE_CAPABILITY_KEYS.RELATIONSHIP],
    compositionPhase: 'RELATIONSHIP',
    contributionTypes: ['source_file', 'shared_runtime', 'relationship', 'ui_surface'],
    requiredInputs: ['approvedRelationships'],
    productionReadiness: true,
    provenance: [...BASE_PROVENANCE, NATIVE_PROVIDER_IDS.RELATIONSHIP],
  },
  {
    providerId: NATIVE_PROVIDER_IDS.RUNTIME,
    providerKind: 'NATIVE',
    version: '1.0.0',
    providedCapabilities: [NATIVE_CAPABILITY_KEYS.RUNTIME],
    compositionPhase: 'RUNTIME',
    contributionTypes: ['source_file', 'shared_runtime', 'runtime_scope'],
    requiredInputs: ['approvedRuntimeRequirements'],
    productionReadiness: true,
    provenance: [...BASE_PROVENANCE, NATIVE_PROVIDER_IDS.RUNTIME],
  },
  {
    providerId: NATIVE_PROVIDER_IDS.RULE,
    providerKind: 'NATIVE',
    version: '1.0.0',
    providedCapabilities: [NATIVE_CAPABILITY_KEYS.RULE],
    compositionPhase: 'RULE',
    contributionTypes: ['source_file', 'shared_runtime', 'business_rule'],
    requiredInputs: ['approvedBusinessRules'],
    productionReadiness: true,
    provenance: [...BASE_PROVENANCE, NATIVE_PROVIDER_IDS.RULE],
  },
];

export function listNativeCapabilityProviders(): readonly NativeCapabilityProviderDescriptor[] {
  return NATIVE_CAPABILITY_PROVIDERS;
}

export function getNativeProviderById(providerId: string): NativeCapabilityProviderDescriptor | undefined {
  return NATIVE_CAPABILITY_PROVIDERS.find((p) => p.providerId === providerId);
}

export function findNativeProvidersForCapability(capabilityKey: string): NativeCapabilityProviderDescriptor[] {
  return NATIVE_CAPABILITY_PROVIDERS.filter((p) => p.providedCapabilities.includes(capabilityKey));
}

export function fingerprintNativeProviderRegistry(): string {
  return NATIVE_CAPABILITY_PROVIDERS.map((p) => `${p.providerId}@${p.version}`).join('|');
}
