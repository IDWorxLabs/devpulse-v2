/**
 * Universal Capability Composition Engine V1 — domain-neutral composition model.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { CapabilityRequirementDescriptor } from '../universal-capability-pack-framework/universal-capability-pack-types.js';

export const UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION = '1.0.0' as const;
export const UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE =
  'UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_V1' as const;

export type CompositionPhase =
  | 'FOUNDATION'
  | 'PERSISTENCE'
  | 'ENTITY'
  | 'RELATIONSHIP'
  | 'RULE'
  | 'ACTION'
  | 'WORKFLOW'
  | 'RUNTIME'
  | 'UI'
  | 'ROUTING'
  | 'PACK_EXTENSION'
  | 'VERIFICATION'
  | 'COVERAGE'
  | 'REPORTING';

export type CompositionProductionReadiness =
  | 'PRODUCTION_READY'
  | 'PARTIALLY_READY'
  | 'BLOCKED_BY_REQUIRED_CAPABILITY'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'BLOCKED_BY_CONFIGURATION'
  | 'BLOCKED_BY_COMPATIBILITY'
  | 'BLOCKED_BY_COLLISION'
  | 'INVALID_COMPOSITION';

export type ProviderKind = 'NATIVE' | 'PACK';

export type ContributionType =
  | 'source_file'
  | 'shared_runtime'
  | 'module_artifact'
  | 'route'
  | 'navigation_entry'
  | 'ui_surface'
  | 'action'
  | 'workflow'
  | 'relationship'
  | 'business_rule'
  | 'runtime_scope'
  | 'persistence_adapter'
  | 'configuration'
  | 'verification_scenario'
  | 'engineering_evidence'
  | 'coverage_evidence';

export type CollisionResolutionPolicy =
  | 'REJECT'
  | 'NAMESPACE'
  | 'MERGE_DECLARATIVE'
  | 'PROVIDER_PRECEDENCE'
  | 'SHARED_CONTRIBUTION'
  | 'APPROVED_OVERRIDE';

export type ReconciliationClassification =
  | 'MATCHED'
  | 'MISSING_CONTRIBUTION'
  | 'UNDECLARED_CONTRIBUTION'
  | 'PROVIDER_NOT_EXECUTED'
  | 'PROVIDER_EXECUTED_UNAPPROVED'
  | 'CONFIGURATION_DRIFT'
  | 'VERSION_DRIFT'
  | 'FINGERPRINT_DRIFT'
  | 'VERIFICATION_MISSING';

export interface NativeCapabilityProviderDescriptor {
  readonly providerId: string;
  readonly providerKind: 'NATIVE';
  readonly version: string;
  readonly providedCapabilities: readonly string[];
  readonly compositionPhase: CompositionPhase;
  readonly contributionTypes: readonly ContributionType[];
  readonly requiredInputs: readonly string[];
  readonly productionReadiness: boolean;
  readonly provenance: readonly string[];
}

export interface ProviderAssignmentCandidate {
  readonly providerId: string;
  readonly providerKind: ProviderKind;
  readonly packId?: string;
  readonly version: string;
  readonly supportStatus?: string;
  readonly selected: boolean;
  readonly rejectionReason?: string;
  readonly rankingScore: number;
  readonly rankingEvidence: readonly string[];
}

export interface ProviderAssignment {
  readonly requirementId: string;
  readonly capabilityKey: string;
  readonly providerId: string;
  readonly providerKind: ProviderKind;
  readonly packId: string | null;
  readonly version: string;
  readonly outcome:
    | 'SATISFIED'
    | 'PARTIALLY_SATISFIED'
    | 'DEFERRED'
    | 'BLOCKED'
    | 'UNRESOLVED';
  readonly candidates: readonly ProviderAssignmentCandidate[];
  readonly provenance: readonly string[];
}

export interface DependencyGraphNode {
  readonly nodeId: string;
  readonly nodeKind: 'REQUIREMENT' | 'NATIVE_PROVIDER' | 'PACK' | 'CONFIGURATION';
  readonly label: string;
}

export interface DependencyGraphEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly edgeKind: 'REQUIRES' | 'CONFIGURATION' | 'RUNTIME' | 'PERSISTENCE' | 'VERIFICATION';
}

export interface CompositionDependencyGraph {
  readonly nodes: readonly DependencyGraphNode[];
  readonly edges: readonly DependencyGraphEdge[];
  readonly installationOrder: readonly string[];
  readonly issues: readonly { readonly code: string; readonly detail: string }[];
}

export interface ContributionBoundary {
  readonly providerId: string;
  readonly allowedModuleIds: readonly string[];
  readonly allowedEntityIds: readonly string[];
  readonly allowedRoutePrefixes: readonly string[];
  readonly allowedFilePrefixes: readonly string[];
  readonly allowedRuntimeScopePrefixes: readonly string[];
  readonly allowedActionIds: readonly string[];
  readonly allowedWorkflowIds: readonly string[];
  readonly allowedRelationshipIds: readonly string[];
  readonly allowedRuleIds: readonly string[];
  readonly allowedConfigurationNamespaces: readonly string[];
}

export interface ContributionAllowlistEntry {
  readonly providerId: string;
  readonly contributionType: ContributionType;
  readonly contributionId: string;
  readonly phase: CompositionPhase;
}

export interface CollisionDecision {
  readonly collisionCode: string;
  readonly detail: string;
  readonly providerIds: readonly string[];
  readonly policy: CollisionResolutionPolicy;
  readonly resolved: boolean;
}

export interface CompositionVerificationRequirement {
  readonly scenarioId: string;
  readonly capabilityKey: string;
  readonly providerId: string;
  readonly expectedEffects: readonly string[];
}

export interface UniversalCapabilityCompositionPlan {
  readonly readOnly: true;
  readonly compositionPlanId: string;
  readonly compositionVersion: typeof UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION;
  readonly approvedEnvelopeFingerprint: string;
  readonly approvedProductIdentity: string;
  readonly capabilityRequirements: readonly CapabilityRequirementDescriptor[];
  readonly nativeCapabilityProviders: readonly NativeCapabilityProviderDescriptor[];
  readonly selectedCapabilityPacks: readonly {
    readonly packId: string;
    readonly packVersion: string;
    readonly configuration: Readonly<Record<string, unknown>>;
  }[];
  readonly providerAssignments: readonly ProviderAssignment[];
  readonly providerAlternatives: readonly ProviderAssignmentCandidate[];
  readonly dependencyGraph: CompositionDependencyGraph;
  readonly installationOrder: readonly string[];
  readonly materializationOrder: readonly string[];
  readonly compositionPhases: readonly { readonly phase: CompositionPhase; readonly providerIds: readonly string[] }[];
  readonly compatibilityDecisions: readonly { readonly code: string; readonly passed: boolean; readonly detail: string }[];
  readonly configurationBindings: Readonly<Record<string, unknown>>;
  readonly contributionAllowlist: readonly ContributionAllowlistEntry[];
  readonly contributionBoundaries: readonly ContributionBoundary[];
  readonly routes: readonly string[];
  readonly navigationEntries: readonly string[];
  readonly runtimeScopes: readonly string[];
  readonly persistenceScopes: readonly string[];
  readonly actions: readonly string[];
  readonly workflows: readonly string[];
  readonly relationships: readonly string[];
  readonly businessRules: readonly string[];
  readonly verificationRequirements: readonly CompositionVerificationRequirement[];
  readonly unresolvedRequirements: readonly string[];
  readonly blockedRequirements: readonly string[];
  readonly optionalDeferredRequirements: readonly string[];
  readonly collisionDecisions: readonly CollisionDecision[];
  readonly productionReadiness: CompositionProductionReadiness;
  readonly provenance: readonly string[];
  readonly planFingerprint: string;
  readonly createdFromPipelineState: string;
  /** Derived eligibility flags consumed by B1–B7 materializers. */
  readonly nativeEngineEligibility: {
    readonly crud: boolean;
    readonly actions: boolean;
    readonly workflows: boolean;
    readonly relationships: boolean;
    readonly runtime: boolean;
    readonly businessRules: boolean;
    readonly capabilityPacks: boolean;
    readonly behavioralVerification: boolean;
    readonly capabilityCoverage: boolean;
  };
}

export interface CompositionPlanBuildInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly appTitle: string;
  readonly moduleIds: readonly string[];
  readonly moduleEligibility: {
    readonly crudByModule: Readonly<Record<string, boolean>>;
    readonly actionByModule: Readonly<Record<string, boolean>>;
    readonly workflowByModule: Readonly<Record<string, boolean>>;
    readonly relationshipByModule: Readonly<Record<string, boolean>>;
    readonly runtimeByModule: Readonly<Record<string, boolean>>;
    readonly ruleByModule: Readonly<Record<string, boolean>>;
  };
}

export interface CompositionMaterializationInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly appTitle: string;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
  readonly rawPrompt?: string;
}

export interface CompositionMaterializationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION;
  readonly plan: UniversalCapabilityCompositionPlan;
  readonly reconciliation: readonly {
    readonly classification: ReconciliationClassification;
    readonly detail: string;
    readonly providerId?: string;
  }[];
}

export interface CompositionBuildContext {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly plan: UniversalCapabilityCompositionPlan;
}
