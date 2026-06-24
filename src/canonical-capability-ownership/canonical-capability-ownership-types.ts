/**
 * Canonical Capability Ownership V1 — types.
 */

export type CanonicalOwnershipStatus =
  | 'CANONICAL'
  | 'MERGED'
  | 'REMOVED'
  | 'DELEGATED';

export type ConsolidationGroupId =
  | 'LAUNCH_READINESS_AUTHORITY'
  | 'VERIFICATION_ORCHESTRATOR'
  | 'REQUIREMENT_COMPLETENESS_INTELLIGENCE'
  | 'NAVIGATION_REVIEW'
  | 'WORLD2_EXECUTION_ENGINE';

export interface CanonicalCapabilityOwnershipEntry {
  capability: string;
  owner: string;
  ownerPath: string;
  consumers: readonly string[];
  status: CanonicalOwnershipStatus;
  consolidationGroup?: ConsolidationGroupId;
  mergedInto?: string;
  responsibilities?: readonly string[];
  validateScript?: string;
}

export interface ConsolidationGroup {
  id: ConsolidationGroupId;
  auditDecision: 'MERGE' | 'REMOVE';
  target: string;
  reason: string;
  canonicalOwner: string;
  canonicalOwnerPath: string;
  mergedCapabilities: readonly string[];
  responsibilities: readonly string[];
  validationCriterion: string;
}

export interface CanonicalOwnershipAssessment {
  version: 'V1';
  generatedAt: string;
  passToken: string;
  consolidationGroupsComplete: number;
  consolidationGroupsTotal: number;
  mergedCapabilities: readonly string[];
  removedCapabilities: readonly string[];
  canonicalOwners: readonly CanonicalCapabilityOwnershipEntry[];
  remainingDuplicateRiskCount: number;
  futureConsolidationRecommendations: readonly string[];
  entries: readonly CanonicalCapabilityOwnershipEntry[];
}
