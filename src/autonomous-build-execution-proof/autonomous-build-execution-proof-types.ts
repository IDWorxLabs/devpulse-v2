/**
 * Autonomous Build Execution Proof — connected idea-to-launch evidence models.
 * Read-only — no synthetic execution claims.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';

export type ExecutionStageId =
  | 'REQUIREMENTS'
  | 'PLAN'
  | 'BUILD'
  | 'RUNTIME'
  | 'PREVIEW'
  | 'VERIFY'
  | 'LAUNCH';

export type StageProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export interface StageEvidenceEntry {
  readOnly: true;
  label: string;
  detail: string;
  present: boolean;
  sourceAuthority: string;
}

export interface StageExecutionProof {
  readOnly: true;
  stage: ExecutionStageId;
  proofLevel: StageProofLevel;
  score: number;
  sourceAuthority: string;
  upstreamState: string;
  evidence: StageEvidenceEntry[];
  missingEvidence: string[];
  recommendedFix: string;
  downstreamBlocked: boolean;
}

export interface ChainLinkEvidence {
  readOnly: true;
  fromStage: ExecutionStageId;
  toStage: ExecutionStageId;
  connected: boolean;
  detail: string;
}

export interface ExecutionChainAnalysis {
  readOnly: true;
  chainConnected: boolean;
  firstBrokenStage: ExecutionStageId | null;
  chainLinks: ChainLinkEvidence[];
  missingLinks: string[];
  downstreamBlockedFrom: ExecutionStageId | null;
}

export interface FounderExecutionProofQuestions {
  readOnly: true;
  canActuallyBuildSoftware: boolean;
  canActuallyRunSoftware: boolean;
  canActuallyPreviewSoftware: boolean;
  canActuallyVerifySoftware: boolean;
  canFounderGoFromIdeaToLaunch: boolean;
  exactBreakStage: ExecutionStageId | null;
  missingEvidenceSummary: string[];
  mustBuildNext: string[];
}

export interface AutonomousBuildExecutionProofInputSnapshot {
  readOnly: true;
  founderTestAssessment: FounderTestAssessment;
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment;
  connectedVerificationAssessment: ConnectedVerificationAssessment;
  requirementsToPlanContract: RequirementsToPlanContractReport | null;
  missingAuthorities: string[];
}

export interface AutonomousBuildExecutionProofReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  proofId: string;
  generatedAt: string;
  chainConnected: boolean;
  firstBrokenStage: ExecutionStageId | null;
  launchBlockedByChain: boolean;
  stageProofs: StageExecutionProof[];
  chainAnalysis: ExecutionChainAnalysis;
  founderQuestions: FounderExecutionProofQuestions;
  missingEvidence: string[];
  launchImpact: string;
  recommendedFix: string;
  recommendedNextActions: string[];
  inputSnapshot: AutonomousBuildExecutionProofInputSnapshot;
  cacheKey: string;
}

export interface AutonomousBuildExecutionProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'EXECUTION_PROOF_COMPLETE' | 'EXECUTION_PROOF_FAILED';
  report: AutonomousBuildExecutionProofReport;
}

export interface AssessAutonomousBuildExecutionProofInput {
  rootDir?: string;
  rawPrompt?: string;
  founderTestAssessment?: FounderTestAssessment;
  requirementsToPlanContract?: RequirementsToPlanContractReport | null;
  connectedBuildExecutionAssessment?: ConnectedBuildExecutionAssessment;
  connectedRuntimeActivationAssessment?: ConnectedRuntimeActivationAssessment;
  connectedLivePreviewAssessment?: ConnectedLivePreviewAssessment;
  connectedVerificationAssessment?: ConnectedVerificationAssessment;
}

export interface AutonomousBuildExecutionProofHistoryEntry {
  timestamp: string;
  proofId: string;
  chainConnected: boolean;
  firstBrokenStage: ExecutionStageId | null;
  stageCount: number;
}

export interface AutonomousBuildExecutionProofHistorySummary {
  totalAssessments: number;
  connectedChains: number;
  disconnectedChains: number;
}

export interface AutonomousBuildExecutionProofArtifacts {
  autonomousBuildExecutionProofAssessment: AutonomousBuildExecutionProofAssessment;
  autonomousBuildExecutionProofReportMarkdown: string;
}
