/**
 * Phase 26.91 — Authority Evidence Source Realignment types (V1).
 */

import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { ApplicationTruthVerdict } from '../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';

export type AuthoritySourceFailureClass =
  | 'STALE_WORKSPACE'
  | 'STALE_RUNID'
  | 'STALE_MANIFEST'
  | 'STALE_REPORT'
  | 'AUTHORITY_SOURCE_MISMATCH'
  | 'AUTHORITATIVE_TRUTH_IGNORED'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'REAL_PRODUCT_GAP'
  | 'UNKNOWN_SOURCE_FAILURE'
  | 'NONE';

export type AuthorityDataSource =
  | 'RUNTIME_MATERIALIZATION_TRUTH_BRIDGE'
  | 'BUILD_MATERIALIZATION_TRUTH_BRIDGE'
  | 'AUTONOMOUS_BUILD_EXECUTION_PROOF'
  | 'FOUNDER_TEST_INTEGRATION'
  | 'LAUNCH_READINESS'
  | 'TRUTH_MATRIX'
  | 'CONNECTED_RUNTIME_ACTIVATION'
  | 'CONNECTED_PREVIEW'
  | 'CONNECTED_VERIFICATION'
  | 'CONNECTED_LAUNCH_READINESS'
  | 'EVIDENCE_PROPAGATION_RECONCILIATION'
  | 'CACHED_REPORT'
  | 'UNKNOWN';

export interface AuthorityEvidenceRecord {
  readOnly: true;
  authorityName: string;
  authorityId: string;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  reportTimestamp: string | null;
  evidenceTimestamp: string | null;
  proofLevel: ConsistencyVerdict;
  verdict: ConsistencyVerdict;
  dataSource: AuthorityDataSource;
  buildProofLevel: ConsistencyVerdict;
  runtimeProofLevel: ConsistencyVerdict;
  previewProofLevel: ConsistencyVerdict;
  consumesRuntimeBridge: boolean;
  evidenceStale: boolean;
  workspaceStale: boolean;
  runIdStale: boolean;
  manifestStale: boolean;
  reportStale: boolean;
  contradictsAuthoritativeRuntime: boolean;
  blocksLaunchFromStaleEvidence: boolean;
  failureClass: AuthoritySourceFailureClass;
  detail: string;
}

export interface AuthoritativeEvidenceSource {
  readOnly: true;
  authoritativeWorkspaceId: string | null;
  authoritativeRunId: string | null;
  authoritativeManifestId: string | null;
  authoritativeReportTimestamp: string | null;
  finalApplicationTruth: ApplicationTruthVerdict;
  applicationBoots: boolean;
  routesReachable: boolean;
  uiRenders: boolean;
  founderFlowProven: boolean;
}

export interface StaleAuthorityFinding {
  readOnly: true;
  authorityId: string;
  authorityName: string;
  failureClass: AuthoritySourceFailureClass;
  staleValue: string;
  authoritativeValue: string | null;
  reclassifiedAsTestingDefect: boolean;
  detail: string;
}

export interface AuthoritySourceRealignmentPlan {
  readOnly: true;
  realignmentRequired: boolean;
  authoritativeWorkspaceId: string | null;
  authoritativeRunId: string | null;
  actions: readonly string[];
  staleAuthorityCount: number;
  staleLaunchBlockerCount: number;
  reason: string | null;
}

export interface AuthorityEvidenceSourceRealignmentReport {
  readOnly: true;
  realignmentId: string;
  generatedAt: string;
  coreQuestion: string;
  authoritative: AuthoritativeEvidenceSource;
  authorityRecords: AuthorityEvidenceRecord[];
  staleFindings: StaleAuthorityFinding[];
  realignmentPlan: AuthoritySourceRealignmentPlan;
  preAuthorityAgreement: boolean;
  postAuthorityAgreement: boolean;
  staleLaunchBlockersReclassified: number;
  genuineProductGapBlockers: number;
  passToken: string | null;
}

export interface AuthorityEvidenceSourceRealignmentAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_COMPLETE';
  report: AuthorityEvidenceSourceRealignmentReport;
  cacheKey: string;
}

export interface AssessAuthorityEvidenceSourceRealignmentInput {
  rootDir?: string;
  runId?: string | null;
  runtimeMaterializationTruthBridge?: import('../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js').RuntimeMaterializationTruthBridgeAssessment | null;
  buildMaterializationTruthBridge?: import('../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js').BuildMaterializationTruthBridgeAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment | null;
  autonomousBuildExecutionProof?: import('../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js').AutonomousBuildExecutionProofReport | null;
  launchReadinessVerdict?: LaunchReadinessVerdict | null;
  launchBlockers?: readonly { id: string; explanation: string }[];
  skipHistoryRecording?: boolean;
  /** Skip assessFounderTestIntegration / autonomous proof for isolated validation. */
  skipHeavyOrchestration?: boolean;
}
