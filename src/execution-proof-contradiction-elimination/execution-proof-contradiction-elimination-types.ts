/**
 * Phase 27.01 — Execution Proof Contradiction Elimination types (V1).
 */

import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';

export type ExecutionProofDimension =
  | 'BUILD'
  | 'RUNTIME'
  | 'PREVIEW'
  | 'VERIFY'
  | 'LAUNCH'
  | 'APPLICATION';

export type ContradictionRootCause =
  | 'STALE_VERDICT_CACHE'
  | 'STALE_WORKSPACE_REFERENCE'
  | 'STALE_RUNID_REFERENCE'
  | 'STALE_MANIFEST_REFERENCE'
  | 'STALE_REPORT_REFERENCE'
  | 'POST_CONVERGENCE_VERDICT_DRIFT'
  | 'AUTHORITY_REEVALUATION_FAILURE'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'REAL_PRODUCT_GAP'
  | 'UNKNOWN';

export type ContradictionReclassification = 'TESTING_INFRASTRUCTURE_DEFECT' | 'REAL_PRODUCT_GAP';

export interface AuthoritativeContradictionContext {
  readOnly: true;
  applicationProven: boolean;
  authoritativeWorkspaceId: string | null;
  authoritativeRunId: string | null;
  authoritativeManifestId: string | null;
  authoritativeProofTimestamp: string | null;
  diskMissingArtifacts: number;
  diskExistingArtifacts: number;
  runtimeBridgeVerdict: string;
  convergencePassed: boolean;
  unificationPassed: boolean;
}

export interface AuthorityVerdictTrace {
  readOnly: true;
  authorityId: string;
  authorityName: string;
  dimension: ExecutionProofDimension;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  proofTimestamp: string | null;
  verdict: ConsistencyVerdict | string;
  proofLevel: string;
  sourceFile: string;
  sourceChain: string;
  consumesRuntimeBridge: boolean;
  detail: string;
}

export interface ExecutionProofContradiction {
  readOnly: true;
  authorityId: string;
  authorityName: string;
  dimension: ExecutionProofDimension;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  proofTimestamp: string | null;
  verdict: string;
  expectedVerdict: string;
  rootCause: ContradictionRootCause;
  reclassification: ContradictionReclassification;
  evidencePath: string;
  detail: string;
}

export interface ExecutionProofContradictionElimination {
  readOnly: true;
  contradictionsEliminated: number;
  infrastructureDefectCount: number;
  genuineProductGapCount: number;
  buildPartialAuthorityId: string | null;
  runtimeNotProvenAuthorityId: string | null;
  previewNotProvenAuthorityId: string | null;
  launchNotProvenAuthorityId: string | null;
  truthMatrixMisreportSuppressed: boolean;
  actions: readonly string[];
}

export interface ExecutionProofContradictionEliminationReport {
  readOnly: true;
  eliminationId: string;
  generatedAt: string;
  coreQuestion: string;
  authoritative: AuthoritativeContradictionContext;
  authorityTraces: AuthorityVerdictTrace[];
  contradictions: ExecutionProofContradiction[];
  elimination: ExecutionProofContradictionElimination;
  allAuthoritiesTraced: boolean;
  allContradictionsIdentified: boolean;
  passToken: string | null;
}

export interface ExecutionProofContradictionEliminationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'EXECUTION_PROOF_CONTRADICTION_ELIMINATION_COMPLETE';
  report: ExecutionProofContradictionEliminationReport;
  cacheKey: string;
}

export interface AssessExecutionProofContradictionEliminationInput {
  rootDir?: string;
  runId?: string | null;
  runtimeMaterializationTruthBridge?: import('../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js').RuntimeMaterializationTruthBridgeAssessment | null;
  buildMaterializationTruthBridge?: import('../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js').BuildMaterializationTruthBridgeAssessment | null;
  launchReadinessVerdict?: LaunchReadinessVerdict | null;
  launchBlockers?: readonly { id: string; explanation: string }[];
  skipHistoryRecording?: boolean;
  skipHeavyOrchestration?: boolean;
}
