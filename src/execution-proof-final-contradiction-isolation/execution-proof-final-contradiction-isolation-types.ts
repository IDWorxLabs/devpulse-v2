/**
 * Phase 27.06 — Execution Proof Final Contradiction Isolation types (V1).
 * Diagnostic-only. No reconciliation or convergence authority.
 */

import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { ExecutionProofDimension } from '../execution-proof-contradiction-elimination/execution-proof-contradiction-elimination-types.js';

export type FinalContradictionDivergenceClass =
  | 'AUTHORITY_STILL_USING_STALE_EVIDENCE'
  | 'STALE_PROOF_CONSUMER'
  | 'POST_CONVERGENCE_VERDICT_DRIFT'
  | 'ARTIFACTS_MISREPORTED_MISSING'
  | 'PROOF_STALE_VS_DISK'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'AUTHORITY_DISAGREEMENT'
  | 'NONE';

export interface AuthoritativeConvergedEvidence {
  readOnly: true;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  proofTimestamp: string | null;
  proofLevel: string;
  sourceAuthority: string;
  missingArtifacts: number;
  applicationProven: boolean;
  convergencePassed: boolean;
  contradictionEliminationPassed: boolean;
}

export interface AuthorityEvidenceConsumption {
  readOnly: true;
  authorityName: string;
  authorityId: string;
  dimension: ExecutionProofDimension | 'APPLICATION' | 'CLAIM';
  inputEvidence: {
    workspaceId: string | null;
    runId: string | null;
    manifestId: string | null;
    proofTimestamp: string | null;
    proofLevel: string;
    sourceAuthority: string;
  };
  consumedEvidence: {
    workspaceId: string | null;
    runId: string | null;
    manifestId: string | null;
    proofTimestamp: string | null;
    proofLevel: string;
    detail: string;
  };
  currentVerdict: ConsistencyVerdict | string;
  expectedVerdict: ConsistencyVerdict | string;
  divergence: FinalContradictionDivergenceClass;
  rootCause: string;
  claim?: string;
  claimId?: string;
}

export interface FinalContradictionRankedEntry {
  readOnly: true;
  rank: number;
  authority: string;
  authorityId: string;
  currentVerdict: string;
  expectedVerdict: string;
  rootCause: string;
  divergence: FinalContradictionDivergenceClass;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  proofTimestamp: string | null;
  evidenceSource: string;
}

export interface FinalContradictionIsolationSummary {
  readOnly: true;
  firstBuildPartialAuthorityId: string | null;
  firstRuntimeNotProvenAuthorityId: string | null;
  firstPreviewNotProvenAuthorityId: string | null;
  firstLaunchNotProvenAuthorityId: string | null;
  finalStaleConsumerAuthorityId: string | null;
  finalStaleConsumerAuthorityName: string | null;
  contradictionCount: number;
}

export interface ExecutionProofFinalContradictionIsolationReport {
  readOnly: true;
  isolationId: string;
  generatedAt: string;
  coreQuestion: string;
  authoritative: AuthoritativeConvergedEvidence;
  consumptions: readonly AuthorityEvidenceConsumption[];
  rankedTable: readonly FinalContradictionRankedEntry[];
  summary: FinalContradictionIsolationSummary;
  passToken: string | null;
}

export interface ExecutionProofFinalContradictionIsolationAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: ExecutionProofFinalContradictionIsolationReport;
}

export interface AssessExecutionProofFinalContradictionIsolationInput {
  rootDir?: string;
  runId?: string | null;
  skipHistoryRecording?: boolean;
}
