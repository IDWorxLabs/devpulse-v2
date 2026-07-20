/**
 * Universal Runtime State Engine V1 — domain-agnostic types.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';

export const UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION = '1.0.0' as const;
export const UNIVERSAL_RUNTIME_STATE_ENGINE_SOURCE = 'UNIVERSAL_RUNTIME_STATE_ENGINE_V1' as const;

export type UniversalRuntimeSupportClassification =
  | 'FULLY_SUPPORTED'
  | 'ENTITY_STATE_SUPPORTED'
  | 'COLLECTION_STATE_SUPPORTED'
  | 'FORM_STATE_SUPPORTED'
  | 'ACTION_STATE_SUPPORTED'
  | 'WORKFLOW_STATE_SUPPORTED'
  | 'RELATIONSHIP_STATE_SUPPORTED'
  | 'NAVIGATION_STATE_SUPPORTED'
  | 'OPTIMISTIC_SUPPORTED'
  | 'PERSISTED_STATE_SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'EXTENSION_POINT_REQUIRED'
  | 'BLOCKED_BY_FUTURE_CAPABILITY'
  | 'INVALID_RUNTIME_CONTRACT'
  | 'NOT_REQUIRED';

export type UniversalRuntimeVerificationClassification =
  | 'BEHAVIORALLY_VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'STRUCTURALLY_PRESENT_ONLY'
  | 'BLOCKED_BY_CAPABILITY'
  | 'INVALID'
  | 'NOT_RUN'
  | 'FAILED';

export type RuntimeQueryStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR' | 'STALE' | 'REFRESHING';
export type RuntimeMutationStatus =
  | 'IDLE'
  | 'PENDING'
  | 'OPTIMISTIC'
  | 'COMMITTED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED'
  | 'RETRYING';

export type RuntimeCachePolicy =
  | 'NO_CACHE'
  | 'CACHE_FIRST'
  | 'NETWORK_OR_PROVIDER_FIRST'
  | 'STALE_WHILE_REVALIDATE'
  | 'MANUAL_INVALIDATION'
  | 'MUTATION_INVALIDATION'
  | 'SESSION_CACHE'
  | 'PERSISTED_CACHE';

export interface UniversalRuntimeStateDescriptor {
  readonly runtimeScopeId: string;
  readonly moduleId: string;
  readonly entityId: string;
  readonly stateKey: string;
  readonly stateKind: string;
  readonly sourceEnvelopePaths: readonly string[];
  readonly cachePolicy: RuntimeCachePolicy;
  readonly invalidationPolicy: string;
  readonly optimisticPolicy: string;
  readonly rollbackPolicy: string;
  readonly retryPolicy: string;
  readonly workflowBindings: readonly string[];
  readonly relationshipBindings: readonly string[];
  readonly supportClassification: UniversalRuntimeSupportClassification;
  readonly blockedReason?: string;
  readonly provenance: readonly string[];
}

export interface UniversalRuntimeMaterializationInput {
  readonly moduleId: string;
  readonly moduleDisplayName: string;
  readonly moduleRoute: string;
  readonly appTitle: string;
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly workflowBacked: boolean;
  readonly relationshipBacked: boolean;
  readonly buildId: string;
  readonly promptHash: string;
}

export interface UniversalRuntimeBehaviorVerificationResult {
  readonly readOnly: true;
  readonly runtimeScopeId: string;
  readonly classification: UniversalRuntimeVerificationClassification;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
}

export interface UniversalRuntimeMaterializationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION;
  readonly moduleId: string;
  readonly runtimeScopes: number;
  readonly queryCoverage: number;
  readonly mutationCoverage: number;
  readonly cacheCoverage: number;
  readonly behaviorallyVerifiedScopes: number;
  readonly behavioralCoveragePercent: number;
  readonly descriptors: readonly UniversalRuntimeStateDescriptor[];
  readonly verifications: readonly UniversalRuntimeBehaviorVerificationResult[];
}

export function stableRuntimeScopeId(moduleId: string, entityId: string): string {
  return `runtime-${moduleId}__${entityId}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
}

export function stableQueryKey(scopeId: string, kind: string, params: Record<string, string | number> = {}): string {
  const paramKey = Object.keys(params)
    .sort()
    .map((k) => `${k}:${params[k]}`)
    .join('|');
  return `${scopeId}::${kind}${paramKey ? `::${paramKey}` : ''}`;
}

export interface RuntimeDescriptorBuildContext {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly input: UniversalRuntimeMaterializationInput;
}
