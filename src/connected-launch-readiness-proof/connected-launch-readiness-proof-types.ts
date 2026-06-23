/**
 * Connected Launch Readiness Proof — launch evidence models.
 * Read-only — no score inflation or synthetic launch claims.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
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
  blockerTitle: string;
  blockerReason: string;
  severity: LaunchBlockerSeverity;
  sourceAuthority: string;
  /** @deprecated use blockerReason */
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
  launchExecutionConnected: boolean;
  verificationProven: boolean;
  launchCriteriaSatisfied: boolean;
  evidence: LaunchReadinessEvidence;
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
  repairToken: string | null;
}

/** Connected launch readiness evidence from execution chain (Phase 26.77). */
export interface LaunchReadinessEvidence {
  readOnly: true;
  requirementsProven: boolean;
  planProven: boolean;
  buildProven: boolean;
  runtimeProven: boolean;
  previewProven: boolean;
  verificationProven: boolean;
  launchCriteriaSatisfied: boolean;
  launchBlockers: LaunchBlockerEntry[];
  readinessScore: number;
  generatedAt: string;
  proofLevel: LaunchProofLevel;
  firstLaunchBlocker: LaunchBlockerEntry | null;
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
  /** Pre-resolved launch chain evidence — skips live resolver when injected (tests). */
  launchReadinessEvidence?: LaunchReadinessEvidence;
  /** Skip live verification gap activation when resolving chain (tests). */
  skipVerificationProofGapActivation?: boolean;
  /** Skip founder test re-assessment (tests / injected assessments). */
  skipFounderTestReassessment?: boolean;
  /** Pre-resolved build materialization for chain resolver (tests / injected). */
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
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

export type LaunchProofDependencyProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN' | 'NOT_ASSESSED';

export interface LaunchProofDependencyEntry {
  readOnly: true;
  dependencyId: string;
  dependencyName: string;
  status: string;
  source: string;
  proofLevel: LaunchProofDependencyProofLevel;
  blocksLaunch: boolean;
  reason: string;
}

export interface FirstLaunchBlockerResolution {
  readOnly: true;
  blockerId: string;
  blockerName: string;
  authority: string;
  proofSource: string;
  reason: string;
  severity: LaunchBlockerSeverity;
}

export interface LaunchNotProvenExplanation {
  readOnly: true;
  launchProven: false;
  launchProofLevel: LaunchProofLevel;
  conditions: string[];
  primaryBlocker: FirstLaunchBlockerResolution | null;
}

export const LAUNCH_PROOF_CONTRADICTION = 'LAUNCH_PROOF_CONTRADICTION' as const;

export interface LaunchProofContradiction {
  readOnly: true;
  kind: typeof LAUNCH_PROOF_CONTRADICTION;
  detail: string;
  conflictingSources: string[];
  conflictingValues: string[];
}

export interface LaunchProofDependencyGraph {
  readOnly: true;
  generatedAt: string;
  launchTruthGeneratedAt: string;
  launchProven: boolean;
  launchProofLevel: LaunchProofLevel;
  executionTruthSource: string;
  dependencies: LaunchProofDependencyEntry[];
  launchDependencyCount: number;
  launchBlockingDependencyCount: number;
  firstLaunchBlocker: FirstLaunchBlockerResolution | null;
  notProvenExplanation: LaunchNotProvenExplanation | null;
  contradictions: LaunchProofContradiction[];
  contradictionCount: number;
  launchReport: LaunchReadinessProofReport | null;
}

export interface BuildLaunchProofDependencyGraphInput {
  rootDir?: string;
  launchReport?: LaunchReadinessProofReport | null;
  skipLaunchProofAssessment?: boolean;
}
