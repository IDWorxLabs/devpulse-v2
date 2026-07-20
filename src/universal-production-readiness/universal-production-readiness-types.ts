/**
 * Universal Production Readiness Verification V1 — canonical types.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { UniversalBehaviorVerificationReport } from '../universal-behavioral-verification/universal-behavior-types.js';
import type { CapabilityCoverageReport, CapabilityCoverageSnapshot } from '../universal-capability-coverage/universal-capability-coverage-types.js';
import type { UniversalCapabilityCompositionPlan } from '../universal-capability-composition-engine/universal-capability-composition-types.js';
import type { CapabilityCompositionReport } from '../universal-capability-composition-engine/capability-composition-report.js';

export const UNIVERSAL_PRODUCTION_READINESS_VERSION = '1.0.0' as const;
export const UNIVERSAL_PRODUCTION_READINESS_SOURCE = 'UNIVERSAL_PRODUCTION_READINESS_VERIFICATION_V1' as const;

export type ReadinessVerdict =
  | 'PRODUCTION_READY'
  | 'CONDITIONALLY_READY'
  | 'NOT_PRODUCTION_READY'
  | 'BLOCKED_BY_REQUIRED_CAPABILITY'
  | 'BLOCKED_BY_BEHAVIORAL_FAILURE'
  | 'BLOCKED_BY_MATERIALIZATION_FAILURE'
  | 'BLOCKED_BY_RUNTIME_FAILURE'
  | 'BLOCKED_BY_PERSISTENCE_FAILURE'
  | 'BLOCKED_BY_DATA_INTEGRITY_FAILURE'
  | 'BLOCKED_BY_CONFIGURATION'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'BLOCKED_BY_COMPATIBILITY'
  | 'BLOCKED_BY_COLLISION'
  | 'BLOCKED_BY_MISSING_EVIDENCE'
  | 'INVALID_PRODUCTION_INPUT'
  | 'READINESS_EVALUATION_FAILED';

export type ReleaseDecision =
  | 'RELEASE_APPROVED'
  | 'RELEASE_APPROVED_WITH_NON_BLOCKING_WARNINGS'
  | 'RELEASE_BLOCKED'
  | 'RELEASE_REQUIRES_ENGINEERING_REPAIR'
  | 'RELEASE_REQUIRES_CAPABILITY_IMPLEMENTATION'
  | 'RELEASE_REQUIRES_CONFIGURATION'
  | 'RELEASE_REQUIRES_REVERIFICATION'
  | 'RELEASE_INVALID';

export type ReadinessDimensionId =
  | 'CONTRACT_FAITHFULNESS'
  | 'COMPOSITION_READINESS'
  | 'MATERIALIZATION_READINESS'
  | 'RUNTIME_READINESS'
  | 'BEHAVIORAL_READINESS'
  | 'CAPABILITY_READINESS'
  | 'CRUD_READINESS'
  | 'ACTION_READINESS'
  | 'WORKFLOW_READINESS'
  | 'RELATIONSHIP_READINESS'
  | 'BUSINESS_RULE_READINESS'
  | 'PERSISTENCE_READINESS'
  | 'DATA_INTEGRITY_READINESS'
  | 'NAVIGATION_READINESS'
  | 'CAPABILITY_PACK_READINESS'
  | 'BUILD_READINESS'
  | 'PREVIEW_READINESS'
  | 'EVIDENCE_INTEGRITY'
  | 'TRACEABILITY_READINESS'
  | 'DIAGNOSTIC_READINESS';

export type RequirementCriticality = 'CRITICAL' | 'REQUIRED' | 'IMPORTANT' | 'OPTIONAL' | 'INFORMATIONAL';

export type ReadinessFindingSeverity =
  | 'BLOCKER'
  | 'CRITICAL_FAILURE'
  | 'REQUIRED_GAP'
  | 'WARNING'
  | 'INFORMATIONAL'
  | 'RESOLVED'
  | 'NOT_APPLICABLE';

export type ReconciliationItemStatus =
  | 'FULLY_RECONCILED'
  | 'PLANNED_NOT_MATERIALIZED'
  | 'MATERIALIZED_NOT_REGISTERED'
  | 'REGISTERED_NOT_VERIFIED'
  | 'VERIFIED_NOT_COVERED'
  | 'COVERED_WITHOUT_VERIFICATION'
  | 'UNDECLARED_CONTRIBUTION'
  | 'INVALID_CONTRIBUTION'
  | 'BLOCKED_REQUIREMENT'
  | 'OPTIONAL_NOT_IMPLEMENTED'
  | 'NOT_APPLICABLE';

export interface ReadinessFinding {
  readonly findingId: string;
  readonly code: string;
  readonly severity: ReadinessFindingSeverity;
  readonly dimension: ReadinessDimensionId;
  readonly requirementIds: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly capabilityKeys: readonly string[];
  readonly providerIds: readonly string[];
  readonly packIds: readonly string[];
  readonly affectedArtifacts: readonly string[];
  readonly expectedEvidence: readonly string[];
  readonly observedEvidence: readonly string[];
  readonly repairCategory: string;
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface ReadinessDimensionResult {
  readonly dimensionId: ReadinessDimensionId;
  readonly passed: boolean;
  readonly score: number;
  readonly findings: readonly ReadinessFinding[];
  readonly provenance: readonly string[];
}

export interface ProductionReadinessScores {
  readonly contractFaithfulnessScore: number;
  readonly compositionScore: number;
  readonly materializationScore: number;
  readonly runtimeScore: number;
  readonly behavioralScore: number;
  readonly capabilityCoverageScore: number;
  readonly persistenceScore: number;
  readonly dataIntegrityScore: number;
  readonly navigationScore: number;
  readonly buildScore: number;
  readonly evidenceIntegrityScore: number;
  readonly traceabilityScore: number;
  readonly overallReadinessScore: number;
  readonly behavioralReadinessScore: number;
  readonly capabilityReadinessScore: number;
  readonly materializationReadinessScore: number;
  readonly dataReadinessScore: number;
  readonly runtimeReadinessScore: number;
}

export interface ProductionReadinessReconciliationItem {
  readonly itemId: string;
  readonly requirementId: string | null;
  readonly providerId: string | null;
  readonly capabilityKey: string | null;
  readonly status: ReconciliationItemStatus;
  readonly detail: string;
}

export interface UniversalProductionReadinessDescriptor {
  readonly readOnly: true;
  readonly readinessEvaluationId: string;
  readonly applicationId: string;
  readonly envelopeFingerprint: string;
  readonly compositionPlanFingerprint: string;
  readonly generatedWorkspaceFingerprint: string;
  readonly behaviorReportFingerprint: string;
  readonly capabilityCoverageFingerprint: string;
  readonly evaluatedAt: string;
  readonly evaluatorVersion: typeof UNIVERSAL_PRODUCTION_READINESS_VERSION;
  readonly requiredReadinessDimensions: readonly ReadinessDimensionId[];
  readonly dimensionResults: readonly ReadinessDimensionResult[];
  readonly blockingFindings: readonly ReadinessFinding[];
  readonly warningFindings: readonly ReadinessFinding[];
  readonly informationalFindings: readonly ReadinessFinding[];
  readonly missingEvidence: readonly string[];
  readonly contradictoryEvidence: readonly string[];
  readonly unresolvedRequirements: readonly string[];
  readonly verifiedRequirements: readonly string[];
  readonly productionReadinessScore: number;
  readonly behavioralReadinessScore: number;
  readonly capabilityReadinessScore: number;
  readonly materializationReadinessScore: number;
  readonly dataReadinessScore: number;
  readonly runtimeReadinessScore: number;
  readonly readinessVerdict: ReadinessVerdict;
  readonly releaseDecision: ReleaseDecision;
  readonly scores: ProductionReadinessScores;
  readonly reconciliation: readonly ProductionReadinessReconciliationItem[];
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface ProductionReadinessInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly workspaceFiles: readonly GeneratedWorkspaceFile[];
  readonly compositionPlan: UniversalCapabilityCompositionPlan | null;
  readonly compositionReport: CapabilityCompositionReport | null;
  readonly behaviorReport: UniversalBehaviorVerificationReport | null;
  readonly coverageSnapshot: CapabilityCoverageSnapshot | null;
  readonly coverageReport: CapabilityCoverageReport | null;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
}

export interface ProductionReadinessMaterializationInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly appTitle: string;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
  readonly compositionBacked: boolean;
  readonly behavioralVerificationBacked: boolean;
  readonly capabilityCoverageBacked: boolean;
}

export interface ProductionReadinessReport extends UniversalProductionReadinessDescriptor {
  readonly aeoDiagnoses: readonly { readonly code: string; readonly detail: string; readonly priority: string }[];
}
