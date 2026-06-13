/**
 * Connected Launch Readiness Proof — launch evidence models.
 * Read-only — no score inflation or synthetic launch claims.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';

export type LaunchProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export type LaunchReadinessState = 'BLOCKED' | 'NOT_READY' | 'READY_WITH_WARNINGS' | 'READY';

export type LaunchBlockerSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type LaunchRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type LaunchAcceptanceState = 'REJECTED' | 'CONDITIONAL' | 'ACCEPTED';

export interface LaunchBlockerEntry {
  readOnly: true;
  blockerId: string;
  severity: LaunchBlockerSeverity;
  sourceAuthority: string;
  message: string;
  recommendedFix: string;
}

export interface LaunchBlockerAssessment {
  readOnly: true;
  blockers: LaunchBlockerEntry[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface LaunchRiskAssessment {
  readOnly: true;
  riskLevel: LaunchRiskLevel;
  riskFactors: string[];
  confidence: number;
}

export interface LaunchAcceptanceAssessment {
  readOnly: true;
  acceptanceState: LaunchAcceptanceState;
  acceptanceReasons: string[];
  confidence: number;
}

export interface LaunchReadinessAssessment {
  readOnly: true;
  readinessState: LaunchReadinessState;
  readinessScore: number;
  confidence: number;
}

export interface LaunchSimulationAssessment {
  readOnly: true;
  simulationCoverage: number;
  simulationScore: number;
  topFailures: string[];
  confidence: number;
}

export interface ClaimRealityViolation {
  readOnly: true;
  violationId: string;
  severity: LaunchBlockerSeverity;
  claim: string;
  reality: string;
  sourceAuthority: string;
}

export interface ClaimRealityAssessment {
  readOnly: true;
  violations: ClaimRealityViolation[];
  criticalViolations: number;
  score: number;
}

export interface LaunchManifestAssessment {
  readOnly: true;
  manifestExists: boolean;
  executionLinked: boolean;
  verificationLinked: boolean;
  launchLinked: boolean;
  traceabilityScore: number;
  launchAssessmentId: string | null;
  verificationRunId: string | null;
}

export interface LaunchLinkageAnalysis {
  readOnly: true;
  launchLinkageConnected: boolean;
  firstBrokenLaunchLink: string | null;
  missingLinks: string[];
  traceabilityScore: number;
  requirementsToPlan: boolean;
  planToBuild: boolean;
  buildToRuntime: boolean;
  runtimeToPreview: boolean;
  previewToVerify: boolean;
  verifyToLaunch: boolean;
}

export interface LaunchReadinessFounderQuestions {
  readOnly: true;
  areWeLaunchReady: boolean;
  whyNot: string[];
  whatBlocksLaunch: string[];
  whatRisksRemain: string[];
  whatMustBeFixedNext: string[];
  whatCanBeLaunchedNow: string[];
}

export interface LaunchReadinessProofReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  launchProofLevel: LaunchProofLevel;
  launchState: LaunchReadinessState;
  executionChainConnected: boolean;
  verificationProven: boolean;
  blockers: LaunchBlockerAssessment;
  risk: LaunchRiskAssessment;
  acceptance: LaunchAcceptanceAssessment;
  readiness: LaunchReadinessAssessment;
  simulation: LaunchSimulationAssessment;
  claimReality: ClaimRealityAssessment;
  manifest: LaunchManifestAssessment;
  linkage: LaunchLinkageAnalysis;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  founderQuestions: LaunchReadinessFounderQuestions;
  cacheKey: string;
}

export interface LaunchReadinessProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'LAUNCH_READINESS_PROOF_COMPLETE' | 'LAUNCH_READINESS_PROOF_FAILED';
  report: LaunchReadinessProofReport;
}

export interface LaunchReadinessFixture {
  forceAcceptanceState?: LaunchAcceptanceState;
  forceClaimViolations?: ClaimRealityViolation[];
  suppressBlockers?: boolean;
  forceReadinessState?: LaunchReadinessState;
}

export interface AssessConnectedLaunchReadinessProofInput {
  rootDir?: string;
  autonomousBuildExecutionProof?: AutonomousBuildExecutionProofReport | null;
  /** Core stage proofs when full execution proof report is not yet assembled. */
  coreStageProofs?: AutonomousBuildExecutionProofReport['stageProofs'];
  coreChainConnected?: boolean;
  coreFirstBrokenStage?: AutonomousBuildExecutionProofReport['firstBrokenStage'];
  verificationExecutionProof?: VerificationExecutionProofReport | null;
  productReadinessSimulation?: ProductReadinessReport | null;
  chatStressSimulation?: ChatStressSimulationReport | null;
  launchCouncilAssessment?: LaunchCouncilAssessment | null;
  founderTestAssessment?: FounderTestAssessment | null;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment | null;
  launchReadinessFixture?: LaunchReadinessFixture;
}

export interface LaunchReadinessProofHistoryEntry {
  timestamp: string;
  assessmentId: string;
  launchProofLevel: LaunchProofLevel;
  launchState: LaunchReadinessState;
  launchLinkageConnected: boolean;
}

export interface LaunchReadinessProofHistorySummary {
  totalAssessments: number;
  provenLaunches: number;
  partialLaunches: number;
  notProvenLaunches: number;
}

export interface LaunchReadinessProofArtifacts {
  launchReadinessProofAssessment: LaunchReadinessProofAssessment;
  launchReadinessProofReportMarkdown: string;
}
