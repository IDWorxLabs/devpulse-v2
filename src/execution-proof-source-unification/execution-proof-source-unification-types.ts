/**
 * Phase 26.94 — Execution Proof Source Unification types (V1).
 */

import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { ApplicationTruthVerdict } from '../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';

export type ExecutionProofSourceClassification =
  | 'AUTHORITATIVE_SOURCE'
  | 'STALE_WORKSPACE'
  | 'STALE_RUNID'
  | 'STALE_MANIFEST'
  | 'STALE_REPORT'
  | 'MULTIPLE_SOURCE_CONFLICT'
  | 'SOURCE_NOT_DISCOVERABLE'
  | 'AUTHORITATIVE_SOURCE_MISMATCH';

export interface AuthoritativeExecutionSource {
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
  runtimeBridgeConsumed: boolean;
}

export interface ExecutionProofConsumerRecord {
  readOnly: true;
  authorityId: string;
  authorityName: string;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  reportTimestamp: string | null;
  workspaceSource: string;
  runIdSource: string;
  manifestSource: string;
  reportSource: string;
  verdict: ConsistencyVerdict;
  consumesRuntimeBridge: boolean;
  classification: ExecutionProofSourceClassification;
  staleEvidence: boolean;
  contradictsAuthoritativeTruth: boolean;
  reclassifiedAsTestingDefect: boolean;
  detail: string;
}

export interface StaleExecutionSourceFinding {
  readOnly: true;
  authorityId: string;
  authorityName: string;
  classification: ExecutionProofSourceClassification;
  staleValue: string;
  authoritativeValue: string | null;
  launchImpact: 'TESTING_INFRASTRUCTURE_DEFECT' | 'REAL_PRODUCT_GAP';
  detail: string;
}

export interface ExecutionProofSourceReconciliation {
  readOnly: true;
  unifiedWorkspaceId: string | null;
  unifiedRunId: string | null;
  unifiedManifestId: string | null;
  singleAuthoritativeChain: boolean;
  staleOnlyBlockersReclassified: number;
  genuineProductGapBlockers: number;
  conflictingSourceCount: number;
  actions: readonly string[];
}

export interface ExecutionProofSourceUnificationReport {
  readOnly: true;
  unificationId: string;
  generatedAt: string;
  coreQuestion: string;
  authoritative: AuthoritativeExecutionSource;
  consumerRecords: ExecutionProofConsumerRecord[];
  staleFindings: StaleExecutionSourceFinding[];
  reconciliation: ExecutionProofSourceReconciliation;
  preUnificationAgreement: boolean;
  postUnificationAgreement: boolean;
  passToken: string | null;
}

export interface ExecutionProofSourceUnificationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'EXECUTION_PROOF_SOURCE_UNIFICATION_COMPLETE';
  report: ExecutionProofSourceUnificationReport;
  cacheKey: string;
}

export interface AssessExecutionProofSourceUnificationInput {
  rootDir?: string;
  runId?: string | null;
  runtimeMaterializationTruthBridge?: import('../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js').RuntimeMaterializationTruthBridgeAssessment | null;
  buildMaterializationTruthBridge?: import('../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js').BuildMaterializationTruthBridgeAssessment | null;
  launchBlockers?: readonly { id: string; explanation: string }[];
  launchReadinessVerdict?: LaunchReadinessVerdict | null;
  skipHistoryRecording?: boolean;
  skipHeavyOrchestration?: boolean;
}
