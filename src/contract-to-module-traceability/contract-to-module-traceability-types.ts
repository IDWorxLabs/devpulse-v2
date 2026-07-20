/**
 * Contract-to-Module Traceability Authority V1 — canonical types.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';

export const CONTRACT_TO_MODULE_TRACEABILITY_VERSION = '1.0.0' as const;
export const CONTRACT_TO_MODULE_TRACEABILITY_SOURCE = 'CONTRACT_TO_MODULE_TRACEABILITY_AUTHORITY_V1' as const;

export type TraceabilityNodeType =
  | 'CANONICAL_PRODUCT_CONTRACT'
  | 'APPROVED_REQUIREMENT'
  | 'APPROVED_PRODUCT_CONCEPT'
  | 'UNIVERSAL_FEATURE'
  | 'FEATURE_BEHAVIOR'
  | 'CBGA_MODULE_PLAN'
  | 'APPROVED_MODULE'
  | 'APPROVED_CONTRIBUTION'
  | 'CAPABILITY_ASSIGNMENT'
  | 'PROVIDER_ASSIGNMENT'
  | 'MATERIALIZATION_INPUT'
  | 'GENERATED_MODULE'
  | 'GENERATED_ARTIFACT'
  | 'ROUTE'
  | 'NAVIGATION_ENTRY'
  | 'RUNTIME_REGISTRATION'
  | 'WORKSPACE_MANIFEST_ENTRY'
  | 'PREVIEW_DOM_ENTRY'
  | 'BEHAVIOR_DESCRIPTOR'
  | 'BEHAVIOR_EVIDENCE'
  | 'COVERAGE_EVIDENCE'
  | 'READINESS_FINDING'
  | 'EXCLUSION_RECORD'
  | 'ALIAS_RECORD'
  | 'DERIVATION_RECORD'
  | 'AGGREGATION_RECORD';

export type TransformationBoundary =
  | 'CONTRACT_TO_FEATURE_CONTRACT'
  | 'FEATURE_CONTRACT_TO_CBGA_PLAN'
  | 'CBGA_PLAN_TO_ENVELOPE'
  | 'ENVELOPE_TO_COMPOSITION'
  | 'COMPOSITION_TO_MATERIALIZATION'
  | 'MATERIALIZATION_TO_GENERATED_MODULES'
  | 'GENERATED_MODULES_TO_ARTIFACTS'
  | 'GENERATED_MODULES_TO_ROUTES'
  | 'GENERATED_MODULES_TO_NAVIGATION'
  | 'GENERATED_MODULES_TO_RUNTIME'
  | 'GENERATED_MODULES_TO_MANIFEST'
  | 'GENERATED_MODULES_TO_PREVIEW'
  | 'BEHAVIOR_TO_VERIFICATION'
  | 'VERIFICATION_TO_COVERAGE'
  | 'COVERAGE_TO_READINESS';

export type ConceptPreservationOutcome =
  | 'PRESERVED'
  | 'PRESERVED_AS_ALIAS'
  | 'PRESERVED_AS_AGGREGATED_MODULE'
  | 'PRESERVED_AS_DERIVED_MODULE'
  | 'EXPLICITLY_EXCLUDED'
  | 'MISSING_FROM_FEATURE_CONTRACT'
  | 'MISSING_FROM_CBGA_PLAN'
  | 'MISSING_FROM_ENVELOPE'
  | 'MISSING_FROM_COMPOSITION'
  | 'MISSING_FROM_MATERIALIZATION_INPUT'
  | 'MISSING_FROM_GENERATED_MODULES'
  | 'MISSING_FROM_RUNTIME'
  | 'MISSING_FROM_PREVIEW'
  | 'MISSING_FROM_VERIFICATION'
  | 'CONTRADICTORY_TRACEABILITY'
  | 'INVALID_IDENTITY'
  | 'UNKNOWN';

export type ModuleAncestryOutcome =
  | 'DIRECTLY_APPROVED'
  | 'APPROVED_ALIAS'
  | 'APPROVED_AGGREGATION'
  | 'APPROVED_DERIVATION'
  | 'APPROVED_INFRASTRUCTURE_MODULE'
  | 'APPROVED_CAPABILITY_PACK_CONTRIBUTION'
  | 'UNAPPROVED_MODULE'
  | 'ORPHANED_MODULE'
  | 'CONTRADICTORY_ANCESTRY'
  | 'INVALID_MODULE_IDENTITY';

export type TraceabilityRootCause =
  | 'CONTRACT_CONCEPT_NOT_NORMALIZED'
  | 'FEATURE_CONTRACT_DROPPED_CONCEPT'
  | 'CBGA_PLAN_OMITTED_FEATURE'
  | 'ENVELOPE_OMITTED_MODULE'
  | 'COMPOSITION_INPUT_OMITTED_MODULE'
  | 'MATERIALIZATION_INPUT_DROPPED'
  | 'GENERATOR_DID_NOT_EMIT_MODULE'
  | 'GENERATOR_EMITTED_UNAPPROVED_MODULE'
  | 'TEMPLATE_DEFAULT_INTRODUCED_MODULE'
  | 'FALLBACK_CATALOG_INTRODUCED_MODULE'
  | 'ROUTE_REGISTRATION_MISSING'
  | 'NAVIGATION_REGISTRATION_MISSING'
  | 'RUNTIME_REGISTRATION_MISSING'
  | 'MANIFEST_REGISTRATION_MISSING'
  | 'PREVIEW_REGISTRATION_MISSING'
  | 'INVALID_ALIAS'
  | 'INVALID_AGGREGATION'
  | 'INVALID_DERIVATION'
  | 'IDENTITY_NORMALIZATION_CONFLICT'
  | 'STALE_TRACEABILITY_EVIDENCE'
  | 'CONTRADICTORY_TRACEABILITY'
  | 'UNKNOWN_ROOT_CAUSE';

export type TraceabilityComplianceOutcome =
  | 'TRACEABILITY_COMPLIANT'
  | 'TRACEABILITY_BLOCKED'
  | 'REGENERATION_REQUIRED'
  | 'NEW_CAPABILITY_REQUIRED'
  | 'HUMAN_DECISION_REQUIRED';

export type CanonicalBuildOutcome =
  | 'BUILD_SUCCEEDED'
  | 'BUILD_BLOCKED_TRACEABILITY'
  | 'BUILD_BLOCKED_FAITHFULNESS'
  | 'BUILD_BLOCKED_READINESS'
  | 'BUILD_REGENERATION_REQUIRED'
  | 'BUILD_REQUIRES_NEW_CAPABILITY'
  | 'BUILD_REQUIRES_HUMAN_DECISION'
  | 'BUILD_FAILED'
  | 'BUILD_ROLLED_BACK';

export interface TraceabilityNode {
  readonly readOnly: true;
  readonly traceabilityNodeId: string;
  readonly nodeType: TraceabilityNodeType;
  readonly canonicalIdentity: string;
  readonly displayName: string;
  readonly sourceAuthority: string;
  readonly sourceRecordId: string;
  readonly envelopeFingerprint: string;
  readonly contractFingerprint: string;
  readonly requirementIds: readonly string[];
  readonly conceptIds: readonly string[];
  readonly featureIds: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly moduleIds: readonly string[];
  readonly contributionIds: readonly string[];
  readonly capabilityKeys: readonly string[];
  readonly providerIds: readonly string[];
  readonly artifactPaths: readonly string[];
  readonly routeIds: readonly string[];
  readonly runtimeScopeIds: readonly string[];
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface TraceabilityEdge {
  readonly readOnly: true;
  readonly edgeId: string;
  readonly edgeType: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly sourceAuthority: string;
  readonly sourceRecordId: string;
  readonly reason: string;
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface TraceabilityFinding {
  readonly readOnly: true;
  readonly findingId: string;
  readonly diagnosticCode: string;
  readonly severity: 'BLOCKER' | 'WARNING' | 'INFO';
  readonly criticality: 'CRITICAL' | 'REQUIRED' | 'OPTIONAL';
  readonly firstBrokenBoundary: TransformationBoundary | 'UNKNOWN';
  readonly expectedNodeId: string;
  readonly observedNodeIds: readonly string[];
  readonly requirementIds: readonly string[];
  readonly conceptIds: readonly string[];
  readonly featureIds: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly moduleIds: readonly string[];
  readonly contributionIds: readonly string[];
  readonly providerIds: readonly string[];
  readonly artifactPaths: readonly string[];
  readonly routeIds: readonly string[];
  readonly runtimeScopeIds: readonly string[];
  readonly expectedState: string;
  readonly observedState: string;
  readonly ancestryPath: readonly string[];
  readonly missingEdges: readonly string[];
  readonly contradictionEvidence: readonly string[];
  readonly repairEligibility: string;
  readonly regenerationStage: string | null;
  readonly readinessImpact: string;
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface ContractToModuleTraceabilityGraph {
  readonly readOnly: true;
  readonly graphId: string;
  readonly contractFingerprint: string;
  readonly envelopeFingerprint: string;
  readonly workspaceFingerprint: string;
  readonly nodes: readonly TraceabilityNode[];
  readonly edges: readonly TraceabilityEdge[];
  readonly findings: readonly TraceabilityFinding[];
  readonly conceptPreservation: readonly { readonly conceptId: string; readonly outcome: ConceptPreservationOutcome; readonly firstBrokenBoundary: TransformationBoundary | 'UNKNOWN' }[];
  readonly moduleAncestry: readonly { readonly moduleId: string; readonly outcome: ModuleAncestryOutcome; readonly ancestryPath: readonly string[] }[];
  readonly fingerprint: string;
}

export interface ContractToModuleTraceabilityInput {
  readonly contract: CanonicalProductContract;
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly workspaceFiles: readonly GeneratedWorkspaceFile[];
  readonly proposedModuleIds: readonly string[];
  readonly universalFeatureNames: readonly string[];
}

export interface ContractToModuleTraceabilityReport {
  readonly readOnly: true;
  readonly graph: ContractToModuleTraceabilityGraph;
  readonly expectedConceptCount: number;
  readonly preservedConceptCount: number;
  readonly missingConceptCount: number;
  readonly expectedModuleCount: number;
  readonly generatedApprovedModuleCount: number;
  readonly missingModuleCount: number;
  readonly unapprovedModuleCount: number;
  readonly traceabilityCompleteness: number;
  readonly complianceOutcome: TraceabilityComplianceOutcome;
  readonly buildOutcome: CanonicalBuildOutcome;
  readonly repairableFindings: readonly TraceabilityFinding[];
  readonly regenerationRequiredFindings: readonly TraceabilityFinding[];
  readonly diagnostics: readonly { readonly code: string; readonly detail: string }[];
  readonly fingerprint: string;
}
