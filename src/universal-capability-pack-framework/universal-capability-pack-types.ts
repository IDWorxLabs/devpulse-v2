/**
 * Universal Capability Pack Framework V1 — domain-agnostic types.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';

export const UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION = '1.0.0' as const;
export const UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE = 'UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1' as const;

export type CapabilityCategory =
  | 'CORE_EXTENSION'
  | 'DATA'
  | 'INTERACTION'
  | 'WORKFLOW'
  | 'RELATIONSHIP'
  | 'RUNTIME'
  | 'RULE'
  | 'SCHEDULING'
  | 'REPORTING'
  | 'ANALYTICS'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOTIFICATION'
  | 'FILE_MANAGEMENT'
  | 'SEARCH'
  | 'IMPORT_EXPORT'
  | 'EXTERNAL_INTEGRATION'
  | 'BACKGROUND_PROCESSING'
  | 'REALTIME'
  | 'OFFLINE'
  | 'OBSERVABILITY'
  | 'ACCESSIBILITY'
  | 'INTERNATIONALIZATION'
  | 'CUSTOM_EXTENSION';

export type PackSupportStatus =
  | 'PRODUCTION_READY'
  | 'FUNCTIONAL_REFERENCE'
  | 'PARTIALLY_IMPLEMENTED'
  | 'EXPERIMENTAL'
  | 'EXTENSION_POINT_REQUIRED'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'BLOCKED_BY_CONFIGURATION'
  | 'INCOMPATIBLE'
  | 'INVALID_PACK'
  | 'NOT_IMPLEMENTED'
  | 'DEPRECATED';

export type RequirementResolutionOutcome =
  | 'SATISFIED'
  | 'PARTIALLY_SATISFIED'
  | 'BLOCKED_BY_MISSING_PACK'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'BLOCKED_BY_CONFIGURATION'
  | 'BLOCKED_BY_COMPATIBILITY'
  | 'INVALID_REQUIREMENT'
  | 'NOT_REQUIRED'
  | 'INFORMATIONAL';

export type PackLifecycleStage =
  | 'DISCOVERED'
  | 'VALIDATED'
  | 'RESOLVED'
  | 'CONFIGURED'
  | 'COMPOSED'
  | 'MATERIALIZED'
  | 'REGISTERED'
  | 'INITIALIZED'
  | 'VERIFIED'
  | 'PRODUCTION_READY'
  | 'BLOCKED'
  | 'FAILED';

export type PackVerificationClassification =
  | 'BEHAVIORALLY_VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'STRUCTURALLY_PRESENT_ONLY'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'BLOCKED_BY_CONFIGURATION'
  | 'BLOCKED_BY_MISSING_PACK'
  | 'INCOMPATIBLE'
  | 'INVALID'
  | 'NOT_RUN'
  | 'FAILED';

export interface CapabilityRequirementDescriptor {
  readonly requirementId: string;
  readonly capabilityKey: string;
  readonly category: CapabilityCategory;
  readonly label: string;
  readonly description: string;
  readonly moduleIds: readonly string[];
  readonly requiredBehaviors: readonly string[];
  readonly criticality: 'REQUIRED' | 'OPTIONAL' | 'INFORMATIONAL';
  readonly optional: boolean;
  readonly sourceEnvelopePaths: readonly string[];
  readonly provenance: readonly string[];
  readonly supportClassification: RequirementResolutionOutcome;
}

export interface PackConfigurationField {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'string[]';
  readonly required: boolean;
  readonly defaultValue?: string | number | boolean | readonly string[];
  readonly secretReference?: boolean;
}

export interface PackConfigurationSchema {
  readonly fields: readonly PackConfigurationField[];
}

export interface CapabilityPackDescriptor {
  readonly packId: string;
  readonly packName: string;
  readonly packVersion: string;
  readonly engineCompatibility: string;
  readonly category: CapabilityCategory;
  readonly description: string;
  readonly providedCapabilities: readonly string[];
  readonly requiredCapabilities: readonly string[];
  readonly requiredPacks: readonly string[];
  readonly optionalPacks: readonly string[];
  readonly incompatiblePacks: readonly string[];
  readonly requiredB1Features: readonly string[];
  readonly requiredB2Features: readonly string[];
  readonly requiredB3Features: readonly string[];
  readonly requiredB4Features: readonly string[];
  readonly requiredB5Features: readonly string[];
  readonly requiredB6Features: readonly string[];
  readonly configurationSchema: PackConfigurationSchema;
  readonly defaultConfiguration: Readonly<Record<string, unknown>>;
  readonly generatedArtifacts: readonly string[];
  readonly runtimeScopes: readonly string[];
  readonly actions: readonly string[];
  readonly supportStatus: PackSupportStatus;
  readonly productionReadiness: boolean;
  readonly securityClassification: {
    readonly networkRequired: boolean;
    readonly secretAccessRequired: boolean;
    readonly filesystemRequired: boolean;
  };
  readonly provenance: readonly string[];
}

export interface PackResolutionCandidate {
  readonly packId: string;
  readonly packVersion: string;
  readonly supportStatus: PackSupportStatus;
  readonly selected: boolean;
  readonly rejectionReason?: string;
}

export interface PackResolutionResult {
  readonly requirementId: string;
  readonly capabilityKey: string;
  readonly outcome: RequirementResolutionOutcome;
  readonly selectedPackId: string | null;
  readonly candidates: readonly PackResolutionCandidate[];
  readonly provenance: readonly string[];
}

export interface CapabilityCompositionPlan {
  readonly readOnly: true;
  readonly fingerprint: string;
  readonly requirements: readonly CapabilityRequirementDescriptor[];
  readonly satisfiedByB1B6: readonly string[];
  readonly selectedPacks: readonly { readonly packId: string; readonly packVersion: string; readonly configuration: Readonly<Record<string, unknown>> }[];
  readonly dependencyOrder: readonly string[];
  readonly resolutions: readonly PackResolutionResult[];
  readonly unresolvedRequirements: readonly string[];
  readonly blockedRequirements: readonly string[];
  readonly lifecycleStage: PackLifecycleStage;
  readonly provenance: readonly string[];
}

export interface CapabilityPackMaterializationInput {
  readonly appTitle: string;
  readonly buildId: string;
  readonly promptHash: string;
  readonly moduleIds: readonly string[];
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly workflowBacked: boolean;
  readonly relationshipBacked: boolean;
  readonly runtimeBacked: boolean;
  readonly ruleBacked: boolean;
  readonly rawPrompt?: string;
}

export interface CapabilityPackMaterializationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION;
  readonly totalRequirements: number;
  readonly satisfiedRequirements: number;
  readonly blockedRequirements: number;
  readonly selectedPacks: number;
  readonly functionalReferencePacks: number;
  readonly notImplementedPacks: number;
  readonly behaviorallyVerifiedPacks: number;
  readonly capabilityCoveragePercent: number;
  readonly behavioralCoveragePercent: number;
  readonly compositionPlan: CapabilityCompositionPlan;
  readonly verifications: readonly { readonly packId: string; readonly classification: PackVerificationClassification; readonly passed: boolean }[];
}

export interface CapabilityPackBuildContext {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly input: CapabilityPackMaterializationInput;
}

export function stableCapabilityRequirementId(capabilityKey: string, discriminator: string): string {
  return `cap-req-${capabilityKey.replace(/\./g, '_')}__${discriminator}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
}

export function fingerprintCompositionPlan(plan: CapabilityCompositionPlan): string {
  const parts = [
    ...plan.requirements.map((r) => r.requirementId).sort(),
    ...plan.selectedPacks.map((p) => `${p.packId}@${p.packVersion}`).sort(),
    ...plan.dependencyOrder,
  ];
  return parts.join('|');
}
