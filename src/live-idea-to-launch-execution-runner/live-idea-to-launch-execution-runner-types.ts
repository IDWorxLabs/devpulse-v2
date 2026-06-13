/**
 * Live Idea-To-Launch Execution Runner — read-only lifecycle evidence models.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type { LaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { FounderTestLaunchReadinessReport } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';

export type ExecutionLifecycleStage =
  | 'IDEA'
  | 'PLANNING'
  | 'BUILD'
  | 'VALIDATION'
  | 'RUNTIME'
  | 'LAUNCH';

export type ExecutionLifecycleState =
  | 'NOT_STARTED'
  | 'IDEA_CONFIRMED'
  | 'PLANNING_CONFIRMED'
  | 'BUILD_CONFIRMED'
  | 'VALIDATION_CONFIRMED'
  | 'RUNTIME_CONFIRMED'
  | 'LAUNCH_READY';

export type StageEvidenceLevel = 'CONFIRMED' | 'PARTIAL' | 'MISSING' | 'BLOCKED';

export type ExecutionVerdict = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN' | 'UNKNOWN';

export interface StageEvidenceEntry {
  readOnly: true;
  label: string;
  detail: string;
  present: boolean;
  sourceAuthority: string;
}

export interface StageAnalysis {
  readOnly: true;
  stage: ExecutionLifecycleStage;
  evidenceLevel: StageEvidenceLevel;
  confirmed: boolean;
  score: number;
  sourceAuthorities: string[];
  evidence: StageEvidenceEntry[];
  missingEvidence: string[];
  weakEvidence: string[];
  recommendedFix: string;
}

export interface ExecutionChainAnalysis {
  readOnly: true;
  completedStages: ExecutionLifecycleStage[];
  incompleteStages: ExecutionLifecycleStage[];
  blockedStages: ExecutionLifecycleStage[];
  missingEvidence: string[];
  weakEvidence: string[];
  executionGaps: string[];
  highestRiskStage: ExecutionLifecycleStage | null;
  nextRequiredStage: ExecutionLifecycleStage | null;
  chainConnected: boolean;
  firstBrokenStage: ExecutionLifecycleStage | null;
}

export interface ExecutionRiskAssessment {
  readOnly: true;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  highestRiskStage: ExecutionLifecycleStage | null;
}

export interface LiveExecutionRunnerInputSnapshot {
  readOnly: true;
  requirementsToPlanContract: RequirementsToPlanContractReport | null;
  founderTestAssessment: FounderTestAssessment | null;
  autonomousBuildExecutionProof: AutonomousBuildExecutionProofReport | null;
  connectedBuildExecution: ConnectedBuildExecutionReport | null;
  connectedVerificationExecutionProof: VerificationExecutionProofReport | null;
  connectedRuntimeActivationProof: RuntimeActivationProofReport | null;
  connectedPreviewExperienceProof: PreviewExperienceProofReport | null;
  connectedLaunchReadinessProof: LaunchReadinessProofReport | null;
  founderTestLaunchReadiness: FounderTestLaunchReadinessReport | null;
  projectVaultProjectCount: number;
}

export interface LiveIdeaToLaunchExecutionRunnerReport {
  readOnly: true;
  advisoryOnly: true;
  runId: string;
  generatedAt: string;
  executionState: ExecutionLifecycleState;
  overallExecutionScore: number;
  executionVerdict: ExecutionVerdict;
  idea: StageAnalysis;
  planning: StageAnalysis;
  build: StageAnalysis;
  validation: StageAnalysis;
  runtime: StageAnalysis;
  launch: StageAnalysis;
  chain: ExecutionChainAnalysis;
  risk: ExecutionRiskAssessment;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  inputSnapshot: LiveExecutionRunnerInputSnapshot;
  cacheKey: string;
}

export interface LiveIdeaToLaunchExecutionRunnerAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'LIVE_EXECUTION_RUNNER_COMPLETE' | 'LIVE_EXECUTION_RUNNER_FAILED';
  report: LiveIdeaToLaunchExecutionRunnerReport;
}

export interface AssessLiveIdeaToLaunchExecutionRunnerInput {
  rootDir?: string;
  rawPrompt?: string;
  requirementsToPlanContract?: RequirementsToPlanContractReport | null;
  founderTestAssessment?: FounderTestAssessment | null;
  autonomousBuildExecutionProof?: AutonomousBuildExecutionProofReport | null;
  connectedBuildExecution?: ConnectedBuildExecutionReport | null;
  connectedVerificationExecutionProof?: VerificationExecutionProofReport | null;
  connectedRuntimeActivationProof?: RuntimeActivationProofReport | null;
  connectedPreviewExperienceProof?: PreviewExperienceProofReport | null;
  connectedLaunchReadinessProof?: LaunchReadinessProofReport | null;
  founderTestLaunchReadiness?: FounderTestLaunchReadinessReport | null;
  /** Inject observed build/runtime/preview/verify fixtures for bounded validation. */
  observedBuildEvidence?: import('../connected-build-execution/connected-build-execution-types.js').ObservedFileEvidence;
  runtimeSessionEvidence?: import('../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js').RuntimeSessionEvidence;
  previewSessionEvidence?: import('../connected-preview-experience-proof/connected-preview-experience-proof-types.js').PreviewSessionEvidence;
  verificationEvidenceFixture?: import('../connected-verification-execution-proof/connected-verification-execution-proof-types.js').VerificationEvidenceFixture;
  launchReadinessFixture?: import('../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js').LaunchReadinessFixture;
  skipHistoryRecording?: boolean;
}

export interface LiveExecutionRunnerHistoryEntry {
  timestamp: string;
  runId: string;
  executionState: ExecutionLifecycleState;
  overallExecutionScore: number;
  executionVerdict: ExecutionVerdict;
}

export interface LiveExecutionRunnerHistorySummary {
  totalRuns: number;
  launchReadyRuns: number;
  runtimeConfirmedRuns: number;
  notProvenRuns: number;
}

export interface LiveIdeaToLaunchExecutionRunnerArtifacts {
  liveIdeaToLaunchExecutionRunnerAssessment: LiveIdeaToLaunchExecutionRunnerAssessment;
  liveIdeaToLaunchExecutionRunnerReportMarkdown: string;
}
