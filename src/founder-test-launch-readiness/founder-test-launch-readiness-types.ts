/**
 * Founder Test Launch Readiness — unified one-button founder test report models.
 * Orchestration only — consumes existing authority outputs; no new scoring engines.
 */

import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderAcceptanceResultBundle } from '../founder-acceptance-validation/founder-acceptance-orchestrator/index.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';

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
}

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
