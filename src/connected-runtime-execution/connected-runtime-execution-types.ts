/**
 * Connected Runtime Execution — core models.
 * Real runtime activation inside disposable workspaces only.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/connected-workspace-creation-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { ExecutionPackageRuntimeReport } from '../execution-runtime/types.js';
import type { ExecutionVerificationReport } from '../execution-verification/types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { World2ControlledExecutionRuntimeAssessment } from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';

/** Real build output contract (Phase 25.27 Connected Build Execution). */
export interface ConnectedBuildExecutionContract {
  readOnly: true;
  workspaceId: string;
  workspaceRoot: string;
  buildTimestamp: string;
  buildArtifacts: string[];
  buildSuccessful: boolean;
  realBuildPerformed: boolean;
}

export type RuntimeExecutionState =
  | 'RUNTIME_ACTIVATED'
  | 'RUNTIME_ACTIVATED_WITH_WARNINGS'
  | 'RUNTIME_ACTIVATION_FAILED'
  | 'RUNTIME_ACTIVATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type RuntimeActivationMode = 'REAL_ACTIVATION' | 'DRY_RUN' | 'BLOCKED';

export interface RuntimeArtifactEntry {
  readOnly: true;
  path: string;
  category: string;
  sourceAuthority: string;
}

export interface RuntimeEvidenceEntry {
  readOnly: true;
  evidenceId: string;
  evidenceType: string;
  summary: string;
  source: string;
  inspectedAt: string;
}

export interface RuntimeDiagnosticEntry {
  readOnly: true;
  diagnosticId: string;
  label: string;
  value: string;
  source: string;
}

export interface RuntimeActivationEvidence {
  readOnly: true;
  runtimeStarted: boolean;
  startupSucceeded: boolean;
  startupDurationMs: number;
  processDetected: boolean;
  runtimeEndpointAvailable: boolean;
  startupArtifactsPresent: boolean;
  inspectedAt: string;
  inspectionSource: 'real-runtime-activation-inspection';
}

export interface RuntimeActivationContract {
  readOnly: true;
  runtimeId: string;
  workspaceId: string;
  runtimeType: string;
  startupDurationMs: number;
  runtimeArtifacts: RuntimeArtifactEntry[];
  runtimeEvidence: RuntimeEvidenceEntry[];
  runtimeWarnings: string[];
  runtimeDiagnostics: RuntimeDiagnosticEntry[];
  activationEvidence: RuntimeActivationEvidence;
  realRuntimeLaunchPerformed: boolean;
  world1Protected: true;
  disposableOnly: true;
}

export interface RuntimeExecutionQuestionAnswers {
  runtimeActivationAttempted: boolean;
  startupSucceeded: boolean;
  runtimeAlive: boolean;
  startupArtifactsDetected: boolean;
  activationIsolated: boolean;
  world1Protected: boolean;
  activationAuditable: boolean;
  founderInspectable: boolean;
  runtimeReadinessProven: boolean;
  runtimeActivationProven: boolean;
}

export interface ConnectedRuntimeExecutionInputSnapshot {
  readOnly: true;
  connectedWorkspaceCreationAssessment: ConnectedWorkspaceCreationAssessment | null;
  connectedBuildExecutionContract: ConnectedBuildExecutionContract | null;
  connectedBuildExecutionFoundationAssessment: ConnectedBuildExecutionAssessment | null;
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  executionPackageRuntimeReport: ExecutionPackageRuntimeReport;
  executionVerificationReport: ExecutionVerificationReport;
  world2RuntimeAssessment: World2ControlledExecutionRuntimeAssessment;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  missingAuthorities: string[];
}

export interface ConnectedRuntimeExecutionReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  executionId: string;
  generatedAt: string;
  runtimeScore: number;
  runtimeState: RuntimeExecutionState;
  startupDurationMs: number;
  activationContract: RuntimeActivationContract | null;
  blockingStages: string[];
  warningStages: string[];
  recommendedNextActions: string[];
  questionAnswers: RuntimeExecutionQuestionAnswers;
  inputSnapshot: ConnectedRuntimeExecutionInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedRuntimeExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_EXECUTION_COMPLETE' | 'RUNTIME_EXECUTION_FAILED';
  report: ConnectedRuntimeExecutionReport;
}

export interface AssessConnectedRuntimeExecutionInput {
  rootDir?: string;
  connectedWorkspaceCreationAssessment?: ConnectedWorkspaceCreationAssessment;
  connectedBuildExecutionContract?: ConnectedBuildExecutionContract;
  connectedBuildExecutionFoundationAssessment?: ConnectedBuildExecutionAssessment;
  connectedRuntimeActivationAssessment?: ConnectedRuntimeActivationAssessment;
  executionProofAssessment?: ExecutionProofAssessment | null;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
  performRealActivation?: boolean;
}

export interface ConnectedRuntimeExecutionHistoryEntry {
  timestamp: string;
  executionId: string;
  runtimeScore: number;
  runtimeState: RuntimeExecutionState;
  workspaceId: string;
  realRuntimeLaunchPerformed: boolean;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedRuntimeExecutionHistorySummary {
  totalAssessments: number;
  activatedRuntimes: number;
  activatedWithWarningsRuntimes: number;
  failedActivations: number;
  blockedActivations: number;
  insufficientEvidenceActivations: number;
}

export interface ConnectedRuntimeExecutionArtifacts {
  connectedRuntimeExecutionAssessment: ConnectedRuntimeExecutionAssessment;
  connectedRuntimeExecutionReportMarkdown: string;
}

export interface ExecuteRuntimeActivationInput {
  projectRootDir: string;
  workspaceId: string;
  workspaceRoot: string;
  runtimeType: string;
  buildArtifacts: string[];
  activationMode: RuntimeActivationMode;
}

export interface ExecuteRuntimeActivationResult {
  success: boolean;
  runtimeId: string;
  runtimeArtifacts: RuntimeArtifactEntry[];
  runtimeEvidence: RuntimeEvidenceEntry[];
  runtimeWarnings: string[];
  runtimeDiagnostics: RuntimeDiagnosticEntry[];
  activationEvidence: RuntimeActivationEvidence;
  realRuntimeLaunchPerformed: boolean;
  blockingReasons: string[];
}
