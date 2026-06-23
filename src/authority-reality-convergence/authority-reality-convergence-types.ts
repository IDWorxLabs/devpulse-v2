/**
 * Phase 27.00 — Authority Reality Convergence types (V1).
 */

import type { AuthoritativeExecutionSource } from '../execution-proof-source-unification/execution-proof-source-unification-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { ChatCapabilityAnswerQualityAssessment } from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';

export type RealityConsumerKind =
  | 'STALE_PROOF_CONSUMER'
  | 'CACHED_VERDICT_CONSUMER'
  | 'STALE_REPORT_CONSUMER'
  | 'WORKSPACE_MISMATCH'
  | 'RUNID_MISMATCH'
  | 'MANIFEST_MISMATCH'
  | 'PROOF_TIMESTAMP_DIVERGENCE'
  | 'VERDICT_DIVERGENCE'
  | 'ARTIFACTS_MISREPORTED';

export type RealityDivergenceLaunchImpact =
  | 'TESTING_INFRASTRUCTURE_DEFECT'
  | 'REAL_PRODUCT_GAP'
  | 'EVIDENCE_PROPAGATION_FAILURE';

export interface AuthoritativeRealitySource extends AuthoritativeExecutionSource {
  readOnly: true;
  authoritativeProofTimestamp: string | null;
  diskMissingArtifacts: number;
  diskExistingArtifacts: number;
  workspaceExistsOnDisk: boolean;
}

export interface RealityAuditFinding {
  readOnly: true;
  auditKind: 'workspace' | 'runId' | 'manifest' | 'proofTimestamp' | 'verdict';
  authorityId: string;
  authorityName: string;
  consumerValue: string | null;
  authoritativeValue: string | null;
  aligned: boolean;
  consumerKind: RealityConsumerKind | null;
  detail: string;
}

export interface LaunchCriticalAuthorityTrace {
  readOnly: true;
  authorityId: string;
  authorityName: string;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  proofTimestamp: string | null;
  verdict: string;
  consumesRuntimeBridge: boolean;
  alignedWithAuthoritative: boolean;
  divergenceKinds: readonly RealityConsumerKind[];
  detail: string;
}

export interface AuthorityRealityDivergence {
  readOnly: true;
  authoritativeSource: string;
  consumingSource: string;
  divergenceReason: RealityConsumerKind;
  detail: string;
  launchImpact: RealityDivergenceLaunchImpact;
}

export interface AuthorityRealityConvergenceReconciliation {
  readOnly: true;
  convergedWorkspaceId: string | null;
  convergedRunId: string | null;
  convergedManifestId: string | null;
  convergedProofTimestamp: string | null;
  staleConsumersRepaired: number;
  cachedVerdictConsumersRepaired: number;
  staleReportConsumersRepaired: number;
  artifactsMisreportReclassified: number;
  staleOnlyBlockersReclassified: number;
  genuineProductGapBlockers: number;
  allLaunchCriticalAligned: boolean;
  actions: readonly string[];
}

export interface AuthorityRealityConvergenceReport {
  readOnly: true;
  convergenceId: string;
  generatedAt: string;
  coreQuestion: string;
  authoritative: AuthoritativeRealitySource;
  auditFindings: RealityAuditFinding[];
  launchCriticalTraces: LaunchCriticalAuthorityTrace[];
  divergences: AuthorityRealityDivergence[];
  reconciliation: AuthorityRealityConvergenceReconciliation;
  preConvergenceAgreement: boolean;
  postConvergenceAgreement: boolean;
  chatCapabilityPropagationAligned: boolean;
  passToken: string | null;
}

export interface AuthorityRealityConvergenceAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'AUTHORITY_REALITY_CONVERGENCE_COMPLETE';
  report: AuthorityRealityConvergenceReport;
  cacheKey: string;
}

export interface AssessAuthorityRealityConvergenceInput {
  rootDir?: string;
  runId?: string | null;
  runtimeMaterializationTruthBridge?: import('../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js').RuntimeMaterializationTruthBridgeAssessment | null;
  buildMaterializationTruthBridge?: import('../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js').BuildMaterializationTruthBridgeAssessment | null;
  launchBlockers?: readonly { id: string; explanation: string }[];
  launchReadinessVerdict?: LaunchReadinessVerdict | null;
  chatCapabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
  chatStressSimulation?: ChatStressSimulationReport | null;
  skipHistoryRecording?: boolean;
  skipHeavyOrchestration?: boolean;
}
