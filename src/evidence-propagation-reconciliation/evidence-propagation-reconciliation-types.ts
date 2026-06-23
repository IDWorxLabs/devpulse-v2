/**
 * Evidence Propagation Reconciliation — types (Phase 26.88).
 */

import type { ApplicationTruthVerdict } from '../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js';
import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { ReconciledTruthClaim } from '../founder-truth-matrix-integration/founder-truth-matrix-integration-types.js';

export type EvidencePropagationRootCause =
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'STALE_EVIDENCE'
  | 'REAL_PRODUCT_GAP'
  | 'AUTHORITY_DISAGREEMENT'
  | 'APPLICATION_PROVEN'
  | 'NONE'
  | 'UNKNOWN';

export type StaleEvidenceKind =
  | 'STALE_WORKSPACE_ID'
  | 'STALE_RUN_ID'
  | 'STALE_BUILD_MANIFEST'
  | 'STALE_PREVIEW_CONTRACT'
  | 'STALE_RUNTIME_CONTRACT'
  | 'STALE_VERIFICATION_CONTRACT'
  | 'STALE_FOUNDER_REPORT'
  | 'STALE_TRUTH_MATRIX_SNAPSHOT';

export interface AuthoritativeRuntimeTruth {
  readOnly: true;
  filesExistOnDisk: boolean;
  dependenciesReady: boolean;
  applicationBoots: boolean;
  routesReachable: boolean;
  uiRenders: boolean;
  founderFlowProven: boolean;
  finalReportDelivered: boolean;
  finalApplicationTruth: ApplicationTruthVerdict;
  authoritativeWorkspaceId: string | null;
  authoritativeRunId: string | null;
  runtimeBridgeConsumed: boolean;
}

export interface AuthorityEvidenceSource {
  readOnly: true;
  authorityId: string;
  displayName: string;
  workspaceId: string | null;
  runId: string | null;
  buildProofLevel: ConsistencyVerdict;
  runtimeProofLevel: ConsistencyVerdict;
  previewProofLevel: ConsistencyVerdict;
  founderFlowProofLevel: ConsistencyVerdict;
  applicationVerdict: ConsistencyVerdict;
  consumesRuntimeBridge: boolean;
  evidenceStale: boolean;
  contradictsAuthoritativeRuntime: boolean;
  detail: string;
}

export interface StaleEvidenceFinding {
  readOnly: true;
  kind: StaleEvidenceKind;
  authorityId: string;
  staleValue: string;
  authoritativeValue: string | null;
  detail: string;
}

export interface AuthorityVerdictContradiction {
  readOnly: true;
  authorityId: string;
  displayName: string;
  authorityVerdict: ConsistencyVerdict;
  authoritativeVerdict: ConsistencyVerdict;
  rootCause: EvidencePropagationRootCause;
  detail: string;
}

export interface EvidencePropagationReconciliation {
  readOnly: true;
  reconciliationId: string;
  generatedAt: string;
  operationId: 'EVIDENCE_PROPAGATION_RECONCILIATION';
  authoritativeRuntimeTruth: AuthoritativeRuntimeTruth;
  authorityEvidenceSources: AuthorityEvidenceSource[];
  staleEvidence: StaleEvidenceFinding[];
  contradictions: AuthorityVerdictContradiction[];
  rulesApplied: string[];
  preReconciliationApplicationTruth: ApplicationTruthVerdict;
  postReconciliationApplicationTruth: ApplicationTruthVerdict;
  preAuthorityAgreement: boolean;
  postAuthorityAgreement: boolean;
  authorityAgreement: boolean;
  rootCause: EvidencePropagationRootCause;
  launchReadinessBlockedByStaleProof: boolean;
  reconciledClaims: ReconciledTruthClaim[];
  preLaunchVerdict: LaunchReadinessVerdict | null;
  postLaunchVerdict: LaunchReadinessVerdict | null;
  recommendedFix: string;
}

export interface EvidencePropagationReconciliationReport {
  readOnly: true;
  advisoryOnly: true;
  reconciliationId: string;
  generatedAt: string;
  coreQuestion: string;
  reconciliation: EvidencePropagationReconciliation;
  cacheKey: string;
}

export interface EvidencePropagationReconciliationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'EVIDENCE_PROPAGATION_RECONCILIATION_COMPLETE';
  report: EvidencePropagationReconciliationReport;
  cacheKey: string;
}

export interface AssessEvidencePropagationReconciliationInput {
  rootDir?: string;
  runId?: string | null;
  runtimeMaterializationTruthBridge?: import('../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js').RuntimeMaterializationTruthBridgeAssessment | null;
  buildMaterializationTruthBridge?: import('../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js').BuildMaterializationTruthBridgeAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment | null;
  autonomousBuildExecutionProof?: import('../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js').AutonomousBuildExecutionProofReport | null;
  launchReadinessVerdict?: LaunchReadinessVerdict | null;
  reconciledClaims?: ReconciledTruthClaim[];
  /** Inject contradictory authority sources for validation without full orchestration. */
  authorityEvidenceOverrides?: AuthorityEvidenceSource[];
  skipHistoryRecording?: boolean;
}
