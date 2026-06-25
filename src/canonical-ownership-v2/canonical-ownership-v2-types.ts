/**
 * Canonical Ownership V2 Registration — types.
 */

export type CanonicalOwnerId =
  | 'CQI'
  | 'UVL'
  | 'AFLA'
  | 'Product Architect Intelligence'
  | 'Real Build Execution Pipeline'
  | 'Production Readiness Gate'
  | 'Cloud Execution Path'
  | 'World2'
  | 'Validation Runtime Governance'
  | 'Large-Scale Pipeline Integration'
  | 'Self-Evolution Execution'
  | 'Mobile Runtime Validation'
  | 'General-Purpose Code Generation'
  | 'Capability Audit'
  | 'Customer Operations Platform'
  | 'Production Observability Platform';

export interface CanonicalOwnershipEntry {
  readOnly: true;
  capabilityId: string;
  capabilityName: string;
  canonicalOwner: CanonicalOwnerId;
  category: string;
  status: 'REGISTERED' | 'CANONICAL' | 'DELEGATED';
  maturity: 'MATURE' | 'PARTIAL' | 'EXPERIMENTAL';
  modulePath: string;
  validationCommand: string;
  passToken: string;
  artifactPath: string;
  consumes: readonly string[];
  provides: readonly string[];
  duplicatesResolved: readonly string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CanonicalOwnershipGraphNode {
  readOnly: true;
  owner: CanonicalOwnerId;
  capabilities: readonly string[];
  consumers: readonly string[];
  providers: readonly string[];
}

export interface CanonicalOwnershipGraph {
  readOnly: true;
  generatedAt: string;
  nodes: readonly CanonicalOwnershipGraphNode[];
}

export interface OrphanCapabilityRecord {
  readOnly: true;
  capabilityId: string;
  capabilityName: string;
  missingFields: readonly string[];
}

export interface OwnershipCollisionRecord {
  readOnly: true;
  capabilityId: string;
  capabilityName: string;
  owners: readonly string[];
  collisionType: 'MULTIPLE_OWNERS' | 'COMPETING_MODULE' | 'PASS_TOKEN_REUSE' | 'AUTHORITY_OVERLAP';
  detail: string;
}

export interface DuplicateRiskResolution {
  readOnly: true;
  pair: string;
  resolution: string;
  resolved: boolean;
  boundary: string;
}

export interface OwnershipAuditImpact {
  readOnly: true;
  generatedAt: string;
  canonicalOwnershipGapClosed: boolean;
  duplicateRiskFalsePositivesReduced: number;
  orphanCriticalCapabilities: number;
  ownershipCollisions: number;
  auditShouldReport: string;
}

export interface CanonicalOwnershipV2Assessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Canonical Ownership V2 Registration';
  passToken: string;
  version: 'V2';
  generatedAt: string;
  registeredCapabilities: number;
  registrationScopeComplete: boolean;
  orphanCriticalCount: number;
  collisionCount: number;
  duplicateRisksResolved: number;
  ownershipProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  entries: readonly CanonicalOwnershipEntry[];
  graph: CanonicalOwnershipGraph;
  orphanCapabilities: readonly OrphanCapabilityRecord[];
  ownershipCollisions: readonly OwnershipCollisionRecord[];
  duplicateRiskResolutions: readonly DuplicateRiskResolution[];
  auditImpact: OwnershipAuditImpact;
}
