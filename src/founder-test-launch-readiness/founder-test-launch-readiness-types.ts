/**
 * Founder Test Launch Readiness — unified one-button founder test report models.
 * Orchestration only — consumes existing authority outputs; no new scoring engines.
 */

import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderAcceptanceResultBundle } from '../founder-acceptance-validation/founder-acceptance-orchestrator/index.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { AssessFounderExecutionProofInput } from '../founder-execution-proof/founder-execution-proof-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { RuntimeFounderExecutionProofHydration } from '../founder-test-integration/runtime-founder-execution-proof-hydration.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import type { LaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';

export type FounderTestPanelState = 'READY' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export type LaunchReadinessVerdict =
  | 'LAUNCH_READY'
  | 'LAUNCH_READY_WITH_WARNINGS'
  | 'NOT_LAUNCH_READY'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type LaunchReadinessConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type FounderTestLaunchSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FounderTestLaunchBlocker {
  readOnly: true;
  sourceAuthority: string;
  severity: FounderTestLaunchSeverity;
  explanation: string;
  recommendedAction: string;
}

export interface FounderTestLaunchWarning {
  readOnly: true;
  sourceAuthority: string;
  explanation: string;
  recommendation: string;
}

export interface FounderTestLaunchRecommendedAction {
  readOnly: true;
  action: string;
  sourceAuthority: string;
  founderImpact: number;
  launchImpact: number;
  riskReduction: number;
  priorityScore: number;
}

export interface FounderTestAuthoritySummary {
  readOnly: true;
  authorityId: string;
  displayName: string;
  score: number;
  available: boolean;
  blockers: string[];
  warnings: string[];
  recommendations: string[];
}

export interface FounderTestLaunchReadinessInputSnapshot {
  readOnly: true;
  founderTestAssessment: FounderTestAssessment;
  founderAcceptanceAssessment: FounderAcceptanceAssessment;
  founderAcceptanceOrchestrator: FounderAcceptanceResultBundle;
  launchCouncilAssessment: LaunchCouncilAssessment;
  authoritySummaries: FounderTestAuthoritySummary[];
  authorityCoverage: number;
  participatingAuthorityCount: number;
  availableAuthorityCount: number;
}

export interface FounderTestLaunchReadinessReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  runId: string;
  generatedAt: string;
  panelState: FounderTestPanelState;
  founderReadinessScore: number;
  founderAcceptanceState: FounderAcceptanceAssessment['acceptanceState'];
  launchReadinessVerdict: LaunchReadinessVerdict;
  confidenceLevel: LaunchReadinessConfidence;
  executionProofSummary: string;
  /** Founder Execution Proof (25.31) — distinct from Execution Proof Evolution (24E). */
  founderExecutionProofSummary: string;
  /** Phase 25.36 — runtime proof input hydration status. */
  runtimeProofHydrationSummary: string;
  runtimeProofHydration: RuntimeFounderExecutionProofHydration;
  founderSimulationSummary: string;
  requirementRealitySummary: string;
  verificationRealitySummary: string;
  livePreviewSummary: string;
  mobileRuntimeSummary: string;
  launchCouncilSummary: string;
  orchestratorVerdict: string;
  orchestratorScore: number;
  topBlockers: FounderTestLaunchBlocker[];
  topWarnings: FounderTestLaunchWarning[];
  topRecommendedActions: FounderTestLaunchRecommendedAction[];
  topMissingCapabilities: string[];
  chatStressSimulation: ChatStressSimulationReport | null;
  chatStressSummary: string | null;
  chatBlocksLaunchReadiness: boolean;
  productReadinessSimulation: ProductReadinessReport | null;
  productReadinessSummary: string | null;
  productReadinessScore: number | null;
  autonomousBuildExecutionProof: AutonomousBuildExecutionProofReport | null;
  autonomousBuildExecutionProofSummary: string | null;
  executionChainConnected: boolean;
  executionChainBlocksLaunch: boolean;
  firstBrokenExecutionStage: AutonomousBuildExecutionProofReport['firstBrokenStage'];
  connectedBuildExecution: ConnectedBuildExecutionReport | null;
  connectedBuildExecutionSummary: string | null;
  connectedRuntimeActivationProof: RuntimeActivationProofReport | null;
  connectedRuntimeActivationProofSummary: string | null;
  connectedPreviewExperienceProof: PreviewExperienceProofReport | null;
  connectedPreviewExperienceProofSummary: string | null;
  connectedVerificationExecutionProof: VerificationExecutionProofReport | null;
  connectedVerificationExecutionProofSummary: string | null;
  connectedLaunchReadinessProof: LaunchReadinessProofReport | null;
  connectedLaunchReadinessProofSummary: string | null;
  inputSnapshot: FounderTestLaunchReadinessInputSnapshot;
  cacheKey: string;
}

export interface FounderTestLaunchReadinessAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_TEST_COMPLETE' | 'FOUNDER_TEST_FAILED';
  report: FounderTestLaunchReadinessReport;
}

export interface RunFounderTestLaunchReadinessInput {
  rootDir?: string;
  projectId?: string;
  workspaceId?: string;
  governanceBlocked?: boolean;
  /** Inject for bounded validator fixtures — skips live authority execution when set. */
  founderTestAssessment?: FounderTestAssessment;
  /** Same proof source as validator — wired into assessFounderTestIntegration. */
  founderExecutionProofInput?: AssessFounderExecutionProofInput;
  /** Hydration metadata from buildRuntimeFounderExecutionProofInputAsync (25.36). */
  runtimeProofHydration?: RuntimeFounderExecutionProofHydration;
  /** Phase 26.4 — inject or skip chat stress simulation. */
  chatStressSimulation?: ChatStressSimulationReport | null;
  skipChatStressSimulation?: boolean;
  skipProductReadinessSimulation?: boolean;
  productReadinessSimulation?: ProductReadinessReport | null;
  skipAutonomousBuildExecutionProof?: boolean;
  autonomousBuildExecutionProof?: AutonomousBuildExecutionProofReport | null;
  skipConnectedBuildExecution?: boolean;
  connectedBuildExecution?: ConnectedBuildExecutionReport | null;
  skipConnectedRuntimeActivationProof?: boolean;
  connectedRuntimeActivationProof?: RuntimeActivationProofReport | null;
  skipConnectedPreviewExperienceProof?: boolean;
  connectedPreviewExperienceProof?: PreviewExperienceProofReport | null;
  skipConnectedVerificationExecutionProof?: boolean;
  connectedVerificationExecutionProof?: VerificationExecutionProofReport | null;
  skipConnectedLaunchReadinessProof?: boolean;
  connectedLaunchReadinessProof?: LaunchReadinessProofReport | null;
  /** Skip bounded history write — used for internal chain stubs. */
  skipHistoryRecording?: boolean;
  chatStressMaxScenarios?: number;
  /** Read-only runtime trace hook — observability only; does not affect scoring. */
  onBuildTrace?: LaunchReadinessBuildTraceCallback;
}

export type LaunchReadinessBuildTracePhase = 'RUNNING' | 'PASSED' | 'FAILED';

export interface LaunchReadinessBuildTraceEvent {
  operationId: string;
  operationLabel: string;
  phase: LaunchReadinessBuildTracePhase;
  errorMessage?: string;
}

export type LaunchReadinessBuildTraceCallback = (event: LaunchReadinessBuildTraceEvent) => void;

export interface FounderTestLaunchReadinessHistoryEntry {
  timestamp: string;
  runId: string;
  score: number;
  verdict: LaunchReadinessVerdict;
  blockerCount: number;
  warningCount: number;
}

export interface FounderTestLaunchReadinessHistorySummary {
  totalRuns: number;
  launchReadyRuns: number;
  launchReadyWithWarningsRuns: number;
  notLaunchReadyRuns: number;
  blockedRuns: number;
  insufficientEvidenceRuns: number;
}

export interface FounderTestLaunchReadinessArtifacts {
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment;
  founderTestLaunchReadinessReportMarkdown: string;
}
