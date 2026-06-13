/**
 * Founder Launch Decision Authority — read-only decision models.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type { LaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import type { FounderTestRealitySweepReport } from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { FounderTestLaunchReadinessReport } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { LiveIdeaToLaunchExecutionRunnerReport } from '../live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-types.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';

export type FounderLaunchDecision =
  | 'LAUNCH'
  | 'WAIT'
  | 'FIX_BLOCKERS'
  | 'RUN_MORE_PROOF'
  | 'REJECT_LAUNCH';

export const FOUNDER_LAUNCH_DECISIONS: readonly FounderLaunchDecision[] = [
  'LAUNCH',
  'WAIT',
  'FIX_BLOCKERS',
  'RUN_MORE_PROOF',
  'REJECT_LAUNCH',
] as const;

export interface ProofChainSignal {
  readOnly: true;
  signalId: string;
  sourceAuthority: string;
  label: string;
  present: boolean;
  strength: 'STRONG' | 'MODERATE' | 'WEAK' | 'ABSENT';
  detail: string;
}

export interface ProofChainSignalAnalysis {
  readOnly: true;
  signals: ProofChainSignal[];
  proofChainScore: number;
  executionState: LiveIdeaToLaunchExecutionRunnerReport['executionState'] | 'UNKNOWN';
  executionVerdict: LiveIdeaToLaunchExecutionRunnerReport['executionVerdict'] | 'UNKNOWN';
  runtimeProven: boolean;
  previewProven: boolean;
  launchReadinessProven: boolean;
  buildMaterializationProven: boolean;
  validationProven: boolean;
  criticalBlockerCount: number;
  missingEvidence: string[];
}

export interface LaunchRiskSignalAnalysis {
  readOnly: true;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskSignals: string[];
  runtimeConfidenceScore: number;
  launchReadinessScore: number;
}

export interface BlockerPriorityEntry {
  readOnly: true;
  blockerId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceAuthority: string;
  message: string;
  recommendedFix: string;
  priorityRank: number;
}

export interface BlockerPriorityAnalysis {
  readOnly: true;
  blockers: BlockerPriorityEntry[];
  criticalCount: number;
  highCount: number;
  actionableBlockers: BlockerPriorityEntry[];
}

export interface FounderDecisionVerdict {
  readOnly: true;
  founderLaunchDecision: FounderLaunchDecision;
  decisionConfidence: number;
  canLaunchNow: boolean;
  reason: string;
  blockingIssues: string[];
  recommendedNextActions: string[];
  decisionSummary: string;
}

export interface FounderLaunchDecisionInputSnapshot {
  readOnly: true;
  liveExecutionRunner: LiveIdeaToLaunchExecutionRunnerReport | null;
  launchReadinessProof: LaunchReadinessProofReport | null;
  runtimeActivationProof: RuntimeActivationProofReport | null;
  previewExperienceProof: PreviewExperienceProofReport | null;
  buildMaterialization: ConnectedBuildExecutionReport | null;
  verificationExecutionProof: VerificationExecutionProofReport | null;
  founderTestLaunchReadiness: FounderTestLaunchReadinessReport | null;
  founderTestRealitySweep: FounderTestRealitySweepReport | null;
  launchCouncil: LaunchCouncilAssessment | null;
  requirementsToPlanContract: RequirementsToPlanContractReport | null;
  autonomousBuildExecutionProof: AutonomousBuildExecutionProofReport | null;
  founderTestAssessment: FounderTestAssessment | null;
  projectVaultProjectCount: number;
}

export interface FounderLaunchDecisionReport {
  readOnly: true;
  advisoryOnly: true;
  decisionId: string;
  generatedAt: string;
  founderLaunchDecision: FounderLaunchDecision;
  decisionConfidence: number;
  founderDecisionConfidence: number;
  canLaunchNow: boolean;
  reason: string;
  blockingIssues: string[];
  recommendedNextActions: string[];
  proofChainScore: number;
  launchReadinessScore: number;
  runtimeConfidenceScore: number;
  riskScore: number;
  proofSignals: ProofChainSignalAnalysis;
  riskSignals: LaunchRiskSignalAnalysis;
  blockers: BlockerPriorityAnalysis;
  verdict: FounderDecisionVerdict;
  missingEvidence: string[];
  decisionSummary: string;
  inputSnapshot: FounderLaunchDecisionInputSnapshot;
  cacheKey: string;
}

export interface FounderLaunchDecisionAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_LAUNCH_DECISION_COMPLETE' | 'FOUNDER_LAUNCH_DECISION_FAILED';
  report: FounderLaunchDecisionReport;
}

export interface AssessFounderLaunchDecisionInput {
  rootDir?: string;
  rawPrompt?: string;
  liveExecutionRunner?: LiveIdeaToLaunchExecutionRunnerReport | null;
  launchReadinessProof?: LaunchReadinessProofReport | null;
  runtimeActivationProof?: RuntimeActivationProofReport | null;
  previewExperienceProof?: PreviewExperienceProofReport | null;
  buildMaterialization?: ConnectedBuildExecutionReport | null;
  verificationExecutionProof?: VerificationExecutionProofReport | null;
  founderTestLaunchReadiness?: FounderTestLaunchReadinessReport | null;
  founderTestRealitySweep?: FounderTestRealitySweepReport | null;
  launchCouncil?: LaunchCouncilAssessment | null;
  requirementsToPlanContract?: RequirementsToPlanContractReport | null;
  autonomousBuildExecutionProof?: AutonomousBuildExecutionProofReport | null;
  founderTestAssessment?: FounderTestAssessment | null;
  observedBuildEvidence?: import('../connected-build-execution/connected-build-execution-types.js').ObservedFileEvidence;
  runtimeSessionEvidence?: import('../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js').RuntimeSessionEvidence;
  previewSessionEvidence?: import('../connected-preview-experience-proof/connected-preview-experience-proof-types.js').PreviewSessionEvidence;
  verificationEvidenceFixture?: import('../connected-verification-execution-proof/connected-verification-execution-proof-types.js').VerificationEvidenceFixture;
  launchReadinessFixture?: import('../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js').LaunchReadinessFixture;
  /** Force source-code-only signal for validator — must not produce LAUNCH. */
  sourceCodeOnlyFixture?: boolean;
  skipRealitySweep?: boolean;
  skipHistoryRecording?: boolean;
}

export interface FounderLaunchDecisionHistoryEntry {
  timestamp: string;
  decisionId: string;
  founderLaunchDecision: FounderLaunchDecision;
  canLaunchNow: boolean;
  decisionConfidence: number;
}

export interface FounderLaunchDecisionHistorySummary {
  totalDecisions: number;
  launchDecisions: number;
  rejectDecisions: number;
  runMoreProofDecisions: number;
}

export interface FounderLaunchDecisionArtifacts {
  founderLaunchDecisionAssessment: FounderLaunchDecisionAssessment;
  founderLaunchDecisionReportMarkdown: string;
}
