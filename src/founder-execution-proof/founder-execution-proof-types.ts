/**
 * Founder Execution Proof — core models.
 * Read-only aggregation of real execution-chain evidence only.
 */

import type { ConnectedLivePreviewExecutionAssessment } from '../connected-live-preview-execution/connected-live-preview-execution-types.js';
import type { ConnectedRuntimeExecutionAssessment } from '../connected-runtime-execution/connected-runtime-execution-types.js';
import type { ConnectedVerificationExecutionAssessment } from '../connected-verification-execution/connected-verification-execution-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/connected-workspace-creation-types.js';
import type { EndToEndExecutionProofAssessment } from '../end-to-end-execution-proof-chain/end-to-end-execution-proof-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderExecutionChainAssessment } from '../founder-test-execution-chain-integration/founder-test-execution-chain-integration-types.js';
import type { FounderTestLaunchReadinessAssessment } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';

export type FounderExecutionState =
  | 'FOUNDER_EXECUTION_PROVEN'
  | 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS'
  | 'FOUNDER_EXECUTION_NOT_PROVEN'
  | 'FOUNDER_EXECUTION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type LaunchRecommendationState =
  | 'RECOMMEND_LAUNCH'
  | 'RECOMMEND_LAUNCH_WITH_WARNINGS'
  | 'DO_NOT_RECOMMEND_LAUNCH'
  | 'BLOCK_LAUNCH'
  | 'INSUFFICIENT_EVIDENCE';

export interface StageExecutionEvidence {
  readOnly: true;
  stage: 'WORKSPACE' | 'BUILD' | 'RUNTIME' | 'PREVIEW' | 'VERIFICATION';
  proven: boolean;
  state: string;
  score: number;
  proofPercent: number;
  sourceAuthority: string;
  evidenceSummary: string;
  artifactPaths: string[];
}

export interface ExecutionChainEvidenceSummary {
  readOnly: true;
  connected: boolean;
  state: string;
  score: number;
  proofPercent: number;
  sourceAuthority: string;
  evidenceSummary: string;
}

export interface LaunchEvidenceSummary {
  readOnly: true;
  launchReadinessProven: boolean;
  launchCouncilVerdict: string;
  founderAcceptanceState: string;
  proofPercent: number;
  sourceAuthority: string;
  evidenceSummary: string;
}

export interface ProofArtifactEntry {
  readOnly: true;
  path: string;
  category: string;
  stage: string;
  sourceAuthority: string;
}

export interface ExecutionCompletenessBreakdown {
  readOnly: true;
  workspaceProofPercent: number;
  buildProofPercent: number;
  runtimeProofPercent: number;
  previewProofPercent: number;
  verificationProofPercent: number;
  executionChainPercent: number;
  launchReadinessPercent: number;
  overallFounderProofPercent: number;
}

export interface FounderExecutionProofBundle {
  readOnly: true;
  proofBundleId: string;
  workspaceEvidence: StageExecutionEvidence;
  buildEvidence: StageExecutionEvidence;
  runtimeEvidence: StageExecutionEvidence;
  previewEvidence: StageExecutionEvidence;
  verificationEvidence: StageExecutionEvidence;
  executionChainEvidence: ExecutionChainEvidenceSummary;
  launchEvidence: LaunchEvidenceSummary;
  proofArtifacts: ProofArtifactEntry[];
  proofWarnings: string[];
  proofBlockers: string[];
}

export interface FounderExecutionProofQuestionAnswers {
  workspaceActuallyCreated: boolean;
  buildActuallyExecuted: boolean;
  runtimeActuallyActivated: boolean;
  previewActuallyActivated: boolean;
  verificationActuallyExecuted: boolean;
  executionChainConnected: boolean;
  founderCanInspectEvidence: boolean;
  blockersPresent: boolean;
  launchReadinessProven: boolean;
  founderExecutionProven: boolean;
}

export interface FounderExecutionProofInputSnapshot {
  readOnly: true;
  connectedWorkspaceCreationAssessment: ConnectedWorkspaceCreationAssessment | null;
  connectedRuntimeExecutionAssessment: ConnectedRuntimeExecutionAssessment | null;
  connectedLivePreviewExecutionAssessment: ConnectedLivePreviewExecutionAssessment | null;
  connectedVerificationExecutionAssessment: ConnectedVerificationExecutionAssessment | null;
  endToEndExecutionProofAssessment: EndToEndExecutionProofAssessment | null;
  founderTestExecutionChainAssessment: FounderExecutionChainAssessment | null;
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment | null;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  launchCouncilAssessment: LaunchCouncilAssessment | null;
  missingAuthorities: string[];
}

export interface FounderExecutionProofReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  proofId: string;
  generatedAt: string;
  founderExecutionScore: number;
  founderExecutionState: FounderExecutionState;
  launchRecommendation: LaunchRecommendationState;
  launchConfidence: number;
  executionCompleteness: ExecutionCompletenessBreakdown;
  topEvidence: string[];
  topBlockers: string[];
  topWarnings: string[];
  missingProofAreas: string[];
  recommendedNextActions: string[];
  questionAnswers: FounderExecutionProofQuestionAnswers;
  proofBundle: FounderExecutionProofBundle;
  inputSnapshot: FounderExecutionProofInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface FounderExecutionProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_EXECUTION_PROOF_COMPLETE' | 'FOUNDER_EXECUTION_PROOF_FAILED';
  report: FounderExecutionProofReport;
}

export interface AssessFounderExecutionProofInput {
  rootDir?: string;
  connectedWorkspaceCreationAssessment?: ConnectedWorkspaceCreationAssessment | null;
  connectedRuntimeExecutionAssessment?: ConnectedRuntimeExecutionAssessment | null;
  connectedLivePreviewExecutionAssessment?: ConnectedLivePreviewExecutionAssessment | null;
  connectedVerificationExecutionAssessment?: ConnectedVerificationExecutionAssessment | null;
  endToEndExecutionProofAssessment?: EndToEndExecutionProofAssessment | null;
  founderTestExecutionChainAssessment?: FounderExecutionChainAssessment | null;
  executionProofAssessment?: ExecutionProofAssessment | null;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
  founderTestLaunchReadinessAssessment?: FounderTestLaunchReadinessAssessment | null;
}

export interface FounderExecutionProofHistoryEntry {
  timestamp: string;
  proofId: string;
  founderExecutionScore: number;
  founderExecutionState: FounderExecutionState;
  launchRecommendation: LaunchRecommendationState;
  blockerCount: number;
  warningCount: number;
}

export interface FounderExecutionProofHistorySummary {
  totalAssessments: number;
  provenExecutions: number;
  provenWithWarningsExecutions: number;
  notProvenExecutions: number;
  blockedExecutions: number;
  insufficientEvidenceExecutions: number;
}

export interface FounderExecutionProofArtifacts {
  founderExecutionProofAssessment: FounderExecutionProofAssessment;
  founderExecutionProofReportMarkdown: string;
}

/** Founder-readable summary attached to unified founder test output. */
export interface FounderTestExecutionProofSummary {
  readOnly: true;
  founderExecutionState: FounderExecutionState;
  launchRecommendation: LaunchRecommendationState;
  launchConfidence: number;
  overallFounderProofPercent: number;
  executionCompletenessPercent: number;
  topBlockers: string[];
  topEvidence: string[];
}
