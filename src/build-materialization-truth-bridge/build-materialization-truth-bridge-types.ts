/**

 * Build Materialization Truth Bridge — core models (Phase 26.75).

 * Reconciles filesystem evidence with Founder Test BUILD verdicts.

 */



import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';

import type { BuildMaterializationRealityAssessment } from '../build-materialization-reality/build-materialization-reality-types.js';

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';

import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';

import type { FounderTruthMatrixIntegrationAssessment } from '../founder-truth-matrix-integration/founder-truth-matrix-integration-types.js';

import type { StageProofLevel } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';



export type BuildTruthVerdict = 'BUILD_PROVEN' | 'BUILD_PARTIAL' | 'BUILD_NOT_PROVEN';



export type BuildTruthRootCause =

  | 'BUILD_MATERIALIZATION_PROVEN'

  | 'EVIDENCE_PROPAGATION_FAILURE'

  | 'WORKSPACE_NOT_LINKED'

  | 'ARTIFACTS_NOT_GENERATED'

  | 'ARTIFACTS_GENERATED_NOT_LINKED'

  | 'FOUNDER_TEST_MISREPORT'

  | 'BUILD_TRUTH_CONTRADICTION'

  | 'UNKNOWN';



export type BuildTruthContradictionKind =

  | 'BUILD_TRUTH_CONTRADICTION'

  | 'ARTIFACTS_MISREPORTED_MISSING'

  | 'PROOF_STALE_VS_DISK'

  | 'NONE';



export type BuildTruthEvidencePriority =

  | 'DISK_EVIDENCE'

  | 'WORKSPACE_EVIDENCE'

  | 'CONNECTED_BUILD_PROOF'

  | 'HISTORICAL_FOUNDER_REPORT'

  | 'CACHED_PROOF_SNAPSHOT';



export interface BuildTruthContradiction {

  readOnly: true;

  kind: BuildTruthContradictionKind;

  detail: string;

  founderTestClaim: string;

  diskEvidence: string;

  lostEvidenceAuthority: string | null;

}



export interface BuildMaterializationTruthEvidenceSnapshot {

  readOnly: true;

  workspaceCount: number;

  existingArtifacts: number;

  missingArtifacts: number;

  workspaceExists: boolean;

  connectedBuildProofLevel: string | null;

  materializationVerdict: string;

  founderBuildProofLevel: StageProofLevel;

  founderFirstBrokenLink: string | null;

  truthMatrixBuildVerdict: ConsistencyVerdict | null;

}



export interface BuildMaterializationTruthEvidence {

  readOnly: true;

  rootDir: string;

  materializationReality: BuildMaterializationRealityAssessment;

  connectedBuild: ConnectedBuildExecutionReport | null;

  autonomousBuildProof: AutonomousBuildExecutionProofReport | null;

  truthMatrixIntegration: FounderTruthMatrixIntegrationAssessment | null;

  snapshot: BuildMaterializationTruthEvidenceSnapshot;

  evidencePriorityApplied: readonly BuildTruthEvidencePriority[];

}



export interface BuildMaterializationFounderAnswers {

  readOnly: true;

  didFilesActuallyExist: boolean;

  didFounderTestMisreportMissingArtifacts: boolean;

  whichAuthorityLostEvidence: string | null;

  isBuildBroken: boolean;

  isProofPropagationBroken: boolean;

  recommendedFix: string;

  recommendedNextActions: string[];

}



export interface BuildMaterializationTruthReconciliation {

  readOnly: true;

  operationId: 'BUILD_MATERIALIZATION_TRUTH';

  reconciliationId: string;

  generatedAt: string;

  preReconciliationBuildVerdict: BuildTruthVerdict;

  postReconciliationBuildVerdict: BuildTruthVerdict;

  rootCause: BuildTruthRootCause;

  materializationVerdict: string;

  contradictions: readonly BuildTruthContradiction[];

  contradictionCount: number;

  rulesApplied: readonly string[];

  truthMatrixVerdictUpdated: boolean;

  founderTestVerdictReconciled: boolean;

  authoritativeSource: BuildTruthEvidencePriority;

  recommendedFix: string;

  founderAnswers: BuildMaterializationFounderAnswers;

}



export interface BuildMaterializationTruthBridgeReport {

  readOnly: true;

  advisoryOnly: true;

  bridgeId: string;

  generatedAt: string;

  coreQuestion: string;

  evidence: BuildMaterializationTruthEvidence;

  reconciliation: BuildMaterializationTruthReconciliation;

  filesystemEvidenceSummary: string;

  founderTestVerdictSummary: string;

  truthMatrixVerdictSummary: string;

  finalBuildTruth: BuildTruthVerdict;

  cacheKey: string;

}



export interface BuildMaterializationTruthBridgeAssessment {

  readOnly: true;

  advisoryOnly: true;

  orchestrationState: 'BUILD_MATERIALIZATION_TRUTH_COMPLETE';

  report: BuildMaterializationTruthBridgeReport;

  cacheKey: string;

}



export interface AssessBuildMaterializationTruthBridgeInput {

  rootDir?: string;

  materializationReality?: BuildMaterializationRealityAssessment;

  connectedBuild?: ConnectedBuildExecutionReport | null;

  autonomousBuildProof?: AutonomousBuildExecutionProofReport | null;

  truthMatrixIntegration?: FounderTruthMatrixIntegrationAssessment | null;

  skipMaterializationAssessment?: boolean;

  skipHistoryRecording?: boolean;

}



export interface BuildMaterializationTruthBridgeHistoryEntry {

  readOnly: true;

  bridgeId: string;

  generatedAt: string;

  finalBuildTruth: BuildTruthVerdict;

  rootCause: BuildTruthRootCause;

  contradictionCount: number;

  cacheKey: string;

}


