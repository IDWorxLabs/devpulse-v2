/**
 * Universal Capability Coverage Intelligence V1 — canonical types.
 *
 * Domain-neutral capability descriptors. Product names never influence coverage.
 */

import { createHash } from 'node:crypto';

export const UNIVERSAL_CAPABILITY_COVERAGE_VERSION = '1.0.0' as const;
export const UNIVERSAL_CAPABILITY_COVERAGE_SOURCE = 'UNIVERSAL_CAPABILITY_COVERAGE_INTELLIGENCE_V1' as const;

export type CapabilityCategory =
  | 'CRUD'
  | 'ACTIONS'
  | 'WORKFLOWS'
  | 'RELATIONSHIPS'
  | 'RUNTIME'
  | 'BUSINESS_RULES'
  | 'VERIFICATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOTIFICATIONS'
  | 'SEARCH'
  | 'FILE_MANAGEMENT'
  | 'REPORTING'
  | 'ANALYTICS'
  | 'EXPORT'
  | 'IMPORT'
  | 'PREFERENCES'
  | 'AUDIT'
  | 'SCHEDULING'
  | 'REALTIME'
  | 'OFFLINE'
  | 'OBSERVABILITY'
  | 'ACCESSIBILITY'
  | 'INTERNATIONALIZATION'
  | 'CUSTOM';

export type CapabilityMaturityLevel =
  | 'NOT_PRESENT'
  | 'DECLARED'
  | 'STRUCTURALLY_IMPLEMENTED'
  | 'FUNCTIONALLY_IMPLEMENTED'
  | 'BEHAVIORALLY_VERIFIED'
  | 'PRODUCTION_READY';

export type CapabilitySupportClassification =
  | 'PRODUCTION_READY'
  | 'FUNCTIONAL_REFERENCE'
  | 'PARTIALLY_IMPLEMENTED'
  | 'EXPERIMENTAL'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'BLOCKED_BY_CONFIGURATION'
  | 'NOT_IMPLEMENTED'
  | 'INVALID'
  | 'DEPRECATED';

export type CoverageDimension = 'structural' | 'runtime' | 'behavioral' | 'production' | 'engineering';

export interface CapabilityCoverageDimensions {
  readonly structuralCoverage: number;
  readonly runtimeCoverage: number;
  readonly behavioralCoverage: number;
  readonly productionCoverage: number;
  readonly engineeringCoverage: number;
}

export interface UniversalCapabilityDescriptor {
  readonly readOnly: true;
  readonly capabilityId: string;
  readonly capabilityKey: string;
  readonly category: CapabilityCategory;
  readonly label: string;
  readonly description: string;
  readonly providedBy: string;
  readonly sourceAuthorities: readonly string[];
  readonly supportingMilestones: readonly string[];
  readonly supportingPacks: readonly string[];
  readonly supportedBehaviors: readonly string[];
  readonly verificationEvidence: readonly string[];
  readonly productionReadiness: boolean;
  readonly supportClassification: CapabilitySupportClassification;
  readonly maturityLevel: CapabilityMaturityLevel;
  readonly engineeringCoverage: number;
  readonly behavioralCoverage: number;
  readonly provenance: readonly string[];
  readonly fingerprint: string;
  readonly dimensionScores: CapabilityCoverageDimensions;
  readonly milestoneChecks: readonly CapabilityMilestoneCheck[];
}

export interface CapabilityMilestoneCheck {
  readonly milestoneId: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface CapabilityCoverageSnapshot {
  readonly snapshotId: string;
  readonly generatedAt: string;
  readonly capabilities: readonly UniversalCapabilityDescriptor[];
  readonly scorecard: CapabilityEngineeringScorecard;
  readonly fingerprint: string;
}

export interface CapabilityEngineeringScorecard {
  readonly totalCapabilities: number;
  readonly behaviorallyVerified: number;
  readonly productionReady: number;
  readonly partiallyImplemented: number;
  readonly blocked: number;
  readonly notImplemented: number;
  readonly behavioralCoveragePercent: number;
  readonly engineeringCoveragePercent: number;
  readonly productionCoveragePercent: number;
  readonly structuralCoveragePercent: number;
  readonly runtimeCoveragePercent: number;
  readonly capabilityMaturityIndex: number;
}

export interface CapabilityCoverageComparison {
  readonly previousFingerprint: string;
  readonly currentFingerprint: string;
  readonly regressions: readonly CapabilityCoverageRegression[];
  readonly improvements: readonly string[];
  readonly unchanged: boolean;
}

export interface CapabilityCoverageRegression {
  readonly capabilityKey: string;
  readonly regressionType: string;
  readonly previousMaturity: CapabilityMaturityLevel;
  readonly currentMaturity: CapabilityMaturityLevel;
  readonly detail: string;
}

export interface CapabilityCoverageReport {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly snapshot: CapabilityCoverageSnapshot;
  readonly gaps: readonly CapabilityGapEntry[];
  readonly diagnoses: readonly string[];
  readonly traceabilityChains: readonly CapabilityTraceabilityChain[];
}

export interface CapabilityGapEntry {
  readonly capabilityKey: string;
  readonly gapType: string;
  readonly detail: string;
  readonly maturityLevel: CapabilityMaturityLevel;
}

export interface CapabilityTraceabilityChain {
  readonly capabilityKey: string;
  readonly approvedRequirementPath: string;
  readonly generatorAuthority: string;
  readonly packId: string | null;
  readonly runtimeArtifactPath: string | null;
  readonly behaviorEvidenceId: string | null;
  readonly coverageFingerprint: string;
}

export interface CapabilityCoverageMaterializationInput {
  readonly envelope: import('../contract-bound-generation-authority-v4/approved-production-build-envelope.js').ApprovedProductionBuildEnvelope;
  readonly appTitle: string;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly workflowBacked: boolean;
  readonly relationshipBacked: boolean;
  readonly runtimeBacked: boolean;
  readonly ruleBacked: boolean;
  readonly capabilityPackBacked: boolean;
  readonly behavioralVerificationBacked: boolean;
}

export function stableCapabilityId(capabilityKey: string, anchor: string): string {
  const digest = createHash('sha256').update(`${capabilityKey}|${anchor}`).digest('hex').slice(0, 16);
  return `capability.${capabilityKey.replace(/\./g, '-')}.${digest}`;
}

export function fingerprintCapability(descriptor: UniversalCapabilityDescriptor): string {
  const payload = [
    descriptor.capabilityKey,
    descriptor.maturityLevel,
    descriptor.supportClassification,
    descriptor.behavioralCoverage,
    descriptor.engineeringCoverage,
  ].join('|');
  return createHash('sha256').update(payload).digest('hex').slice(0, 24);
}

export function fingerprintCoverageSnapshot(capabilities: readonly UniversalCapabilityDescriptor[]): string {
  const keys = capabilities.map((c) => `${c.capabilityKey}:${c.maturityLevel}:${c.behavioralCoverage}`).sort().join('\n');
  return createHash('sha256').update(keys).digest('hex').slice(0, 32);
}
