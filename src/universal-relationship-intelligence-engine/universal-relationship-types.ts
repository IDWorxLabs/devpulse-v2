/**
 * Universal Relationship Intelligence Engine V1 — domain-agnostic types.
 */

import type { CbgaCanonicalContractEvidence } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ApprovedModulePlan } from '../contract-bound-generation-authority-v4/approved-module-plan.js';

export const UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION = '1.0.0' as const;
export const UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_SOURCE =
  'UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_V1' as const;

export type UniversalRelationshipSupportClassification =
  | 'FULLY_SUPPORTED'
  | 'ONE_TO_ONE_SUPPORTED'
  | 'ONE_TO_MANY_SUPPORTED'
  | 'MANY_TO_ONE_SUPPORTED'
  | 'MANY_TO_MANY_SUPPORTED'
  | 'PARENT_CHILD_SUPPORTED'
  | 'SELF_REFERENTIAL_SUPPORTED'
  | 'CRUD_BACKED'
  | 'ACTION_BACKED'
  | 'WORKFLOW_BACKED'
  | 'PERSISTENCE_BACKED'
  | 'NAVIGATION_BACKED'
  | 'PARTIALLY_SUPPORTED'
  | 'EXTENSION_POINT_REQUIRED'
  | 'BLOCKED_BY_FUTURE_CAPABILITY'
  | 'INVALID_RELATIONSHIP_CONTRACT'
  | 'NOT_EXECUTABLE_INFORMATIONAL';

export type UniversalRelationshipVerificationClassification =
  | 'BEHAVIORALLY_VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'STRUCTURALLY_PRESENT_ONLY'
  | 'BLOCKED_BY_CAPABILITY'
  | 'INVALID'
  | 'NOT_RUN'
  | 'FAILED';

export type UniversalRelationshipCardinality =
  | 'ONE_TO_ONE'
  | 'ONE_TO_MANY'
  | 'MANY_TO_ONE'
  | 'MANY_TO_MANY'
  | 'PARENT_CHILD'
  | 'SELF_REFERENTIAL';

export type UniversalRelationshipOwnership =
  | 'SOURCE_OWNS_TARGET'
  | 'TARGET_OWNS_SOURCE'
  | 'SHARED_OWNERSHIP'
  | 'INDEPENDENT_ASSOCIATION'
  | 'COMPOSITION'
  | 'AGGREGATION'
  | 'NON_OWNING_REFERENCE';

export type UniversalLifecyclePolicy =
  | 'RESTRICT'
  | 'CASCADE'
  | 'SET_NULL'
  | 'DETACH'
  | 'ARCHIVE_RELATED'
  | 'PRESERVE'
  | 'CUSTOM_EXTENSION_REQUIRED';

export interface RawApprovedRelationship {
  readonly label: string;
  readonly sourceEntityLabel: string;
  readonly targetEntityLabel: string;
  readonly cardinalityHint: UniversalRelationshipCardinality;
  readonly sourceOptional: boolean;
  readonly targetOptional: boolean;
  readonly sourceEnvelopePath: string;
  readonly ordered: boolean;
}

export interface UniversalRelationshipDescriptor {
  readonly relationshipId: string;
  readonly label: string;
  readonly description: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly sourceModuleId: string;
  readonly targetModuleId: string;
  readonly relationshipKind: string;
  readonly cardinality: UniversalRelationshipCardinality;
  readonly inverseCardinality: UniversalRelationshipCardinality;
  readonly ownership: UniversalRelationshipOwnership;
  readonly sourceField: string;
  readonly targetField: string;
  readonly junctionEntityId: string | null;
  readonly sourceOptional: boolean;
  readonly targetOptional: boolean;
  readonly ordered: boolean;
  readonly onDeletePolicy: UniversalLifecyclePolicy;
  readonly orphanPolicy: UniversalLifecyclePolicy;
  readonly cascadePolicy: UniversalLifecyclePolicy;
  readonly sourceEnvelopePaths: readonly string[];
  readonly provenance: readonly string[];
  readonly supportClassification: UniversalRelationshipSupportClassification;
  readonly blockedReason?: string;
  readonly sourceRoute: string;
  readonly targetRoute: string;
  readonly mutationOperations: readonly string[];
  readonly workflowGuardIds: readonly string[];
}

export interface UniversalRelationshipMaterializationInput {
  readonly moduleId: string;
  readonly moduleDisplayName: string;
  readonly moduleRoute: string;
  readonly appTitle: string;
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly workflowBacked: boolean;
  readonly approvedRoutes: readonly string[];
  readonly canonicalProductContract: CbgaCanonicalContractEvidence;
  readonly approvedModulePlan: ApprovedModulePlan;
  readonly buildId: string;
  readonly promptHash: string;
  readonly rawPrompt?: string;
}

export interface UniversalRelationshipBehaviorVerificationResult {
  readonly readOnly: true;
  readonly relationshipId: string;
  readonly classification: UniversalRelationshipVerificationClassification;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
}

export interface UniversalRelationshipMaterializationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION;
  readonly moduleId: string;
  readonly totalApprovedRelationships: number;
  readonly fullyMaterializedRelationships: number;
  readonly partiallyMaterializedRelationships: number;
  readonly blockedRelationships: number;
  readonly invalidRelationships: number;
  readonly behaviorallyVerifiedRelationships: number;
  readonly behavioralCoveragePercent: number;
  readonly verifiedOperations: number;
  readonly totalOperations: number;
  readonly descriptors: readonly UniversalRelationshipDescriptor[];
  readonly verifications: readonly UniversalRelationshipBehaviorVerificationResult[];
}

export function escRelationshipString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}

export function stableRelationshipId(
  sourceModuleId: string,
  targetModuleId: string,
  cardinality: UniversalRelationshipCardinality,
): string {
  const base = `${sourceModuleId}__${targetModuleId}__${cardinality}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  return `rel-${base}`;
}
