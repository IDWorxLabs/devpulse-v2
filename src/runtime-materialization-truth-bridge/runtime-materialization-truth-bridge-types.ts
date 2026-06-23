/**
 * Runtime Materialization Truth Bridge — core models (Phase 26.76).
 */

import type { BuildMaterializationTruthBridgeAssessment } from '../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js';
import type { GeneratedWorkspaceDependencyMaterializationAssessment } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import type {
  DependencyInstallExecutionMode,
  GeneratedWorkspaceDependencyInstallationExecutorAssessment,
} from '../generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-types.js';
import type { GeneratedRuntimeCrashDiagnosisAssessment } from '../generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.js';
import type { FounderFlowRuntimeProofAssessment } from '../founder-flow-runtime-proof/founder-flow-runtime-proof-types.js';
import type { RuntimeRouteReachabilityProofAssessment } from '../runtime-route-reachability-proof/runtime-route-reachability-proof-types.js';
import type { RuntimeUiRenderProofAssessment } from '../runtime-ui-render-proof/runtime-ui-render-proof-types.js';
import type { RuntimeStartupProofRepairAssessment } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { StageProofLevel } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { RuntimeProofAnalysis } from './runtime-proof-analyzer.js';

export type ApplicationTruthVerdict =
  | 'APPLICATION_PROVEN'
  | 'APPLICATION_PARTIAL'
  | 'APPLICATION_NOT_PROVEN';

export type ApplicationTruthRootCause =
  | 'APPLICATION_PROVEN'
  | 'RUNTIME_EVIDENCE_MISSING'
  | 'RUNTIME_START_FAILURE'
  | 'ROUTE_FAILURE'
  | 'UI_RENDER_FAILURE'
  | 'FOUNDER_FLOW_FAILURE'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'UNKNOWN';

export type ApplicationTruthContradictionKind =
  | 'RUNTIME_TRUTH_CONTRADICTION'
  | 'APPLICATION_MISREPORTED_FAILED'
  | 'REPORTING_STALE_VS_RUNTIME'
  | 'NONE';

export type RuntimeEvidencePriority =
  | 'LIVE_RUNTIME_EVIDENCE'
  | 'STARTUP_EVIDENCE'
  | 'ROUTE_EVIDENCE'
  | 'UI_EVIDENCE'
  | 'FOUNDER_FLOW_EVIDENCE'
  | 'CACHED_PROOF_SNAPSHOT';

export interface RuntimeStartupEvidence {
  readOnly: true;
  serverStartSucceeded: boolean;
  serverStartFailed: boolean;
  processStarted: boolean;
  portBound: boolean;
  portReachable: boolean;
  healthResponded: boolean;
  fatalStartupError: boolean;
  bootComplete: boolean;
  runtimeProofLevel: string;
  firstBrokenRuntimeLink: string | null;
  startupFailureClass: string | null;
  attemptedCommand: string | null;
  applicationBootsFromProbe: boolean;
  dependencyState: string | null;
  dependenciesReady: boolean;
  dependencyInstallCommand: string | null;
  dependencyMissingModules: string | null;
  dependencyInstallExecuted: boolean;
  dependencyInstallSucceeded: boolean | null;
  preciseCrashClass: string | null;
  crashFailingFile: string | null;
  crashRawErrorExcerpt: string | null;
}

export interface RuntimeRouteEvidence {
  readOnly: true;
  knownRoutesChecked: number;
  routesReachable: number;
  routeFailures: number;
  has404Failures: boolean;
  has500Failures: boolean;
  primaryUrlReachable: boolean;
  previewUrl: string | null;
  routesReachableProof: boolean;
  routeProofAuthoritative: boolean;
  routeFailureClass: string | null;
  rootRouteReachable: boolean;
  uiRenderProvenFromRoutes: boolean;
  baseUrl: string | null;
}

export interface RuntimeUiEvidence {
  readOnly: true;
  pageLoaded: boolean;
  renderSucceeded: boolean;
  blankPageDetected: boolean;
  fatalRenderError: boolean;
  hydrationFailure: boolean;
  applicationRendered: boolean;
  interactiveElementsFound: number;
  uiRendersProof: boolean;
  uiProofAuthoritative: boolean;
  uiFailureClass: string | null;
  jsonOnlyRuntime: boolean;
  htmlWithRootMount: boolean;
  htmlWithScriptBundle: boolean;
}

export interface RuntimeFounderFlowEvidence {
  readOnly: true;
  founderTestLaunchObserved: boolean;
  projectCreationObserved: boolean;
  buildInitiationObserved: boolean;
  buildCompletionObserved: boolean;
  reportGenerationObserved: boolean;
  resultRetrievalObserved: boolean;
  finalReportDelivered: boolean;
  buildMaterializationProven: boolean;
  founderFlowProven: boolean;
  founderFlowProofAuthoritative: boolean;
  founderFlowFailureClass: string | null;
  finalResultDelivered: boolean;
  reportGeneratedNotDelivered: boolean;
  interactiveElementsDetected: number;
}

export interface RuntimeTruthContradiction {
  readOnly: true;
  kind: ApplicationTruthContradictionKind;
  detail: string;
  founderTestClaim: string;
  runtimeEvidence: string;
  lostEvidenceAuthority: string | null;
}

export interface RuntimeMaterializationTruthEvidenceSnapshot {
  readOnly: true;
  filesExistOnDisk: boolean;
  runtimeProofLevel: string;
  previewProofLevel: string | null;
  founderRuntimeProofLevel: StageProofLevel;
  founderPreviewProofLevel: StageProofLevel;
  executionChainRuntimeProven: boolean;
  executionChainPreviewProven: boolean;
  truthMatrixApplicationVerdict: ConsistencyVerdict | null;
}

export interface RuntimeMaterializationTruthEvidence {
  readOnly: true;
  rootDir: string;
  runtimeActivationProof: RuntimeActivationProofReport | null;
  previewExperienceProof: PreviewExperienceProofReport | null;
  buildMaterializationTruthBridge: BuildMaterializationTruthBridgeAssessment | null;
  startupProofRepair: RuntimeStartupProofRepairAssessment | null;
  dependencyMaterialization: GeneratedWorkspaceDependencyMaterializationAssessment | null;
  dependencyInstallationExecutor: GeneratedWorkspaceDependencyInstallationExecutorAssessment | null;
  crashDiagnosis: GeneratedRuntimeCrashDiagnosisAssessment | null;
  routeReachabilityProof: RuntimeRouteReachabilityProofAssessment | null;
  uiRenderProof: RuntimeUiRenderProofAssessment | null;
  founderFlowRuntimeProof: FounderFlowRuntimeProofAssessment | null;
  startup: RuntimeStartupEvidence;
  routes: RuntimeRouteEvidence;
  ui: RuntimeUiEvidence;
  founderFlow: RuntimeFounderFlowEvidence;
  proofAnalysis: RuntimeProofAnalysis;
  snapshot: RuntimeMaterializationTruthEvidenceSnapshot;
  evidencePriorityApplied: readonly RuntimeEvidencePriority[];
}

export interface RuntimeMaterializationFounderAnswers {
  readOnly: true;
  didApplicationStart: boolean;
  didApplicationBecomeReachable: boolean;
  didRoutesWork: boolean;
  didUiRender: boolean;
  didFounderCriticalWorkflowsComplete: boolean;
  didReportingReflectRuntimeReality: boolean;
  trueRootCause: ApplicationTruthRootCause;
  isBuildProblem: boolean;
  isRuntimeProblem: boolean;
  isReportingProblem: boolean;
  isEvidencePropagationProblem: boolean;
  recommendedFix: string;
  recommendedNextActions: string[];
}

export interface RuntimeMaterializationTruthReconciliation {
  readOnly: true;
  operationId: 'RUNTIME_MATERIALIZATION_TRUTH';
  reconciliationId: string;
  generatedAt: string;
  preReconciliationApplicationVerdict: ApplicationTruthVerdict;
  postReconciliationApplicationVerdict: ApplicationTruthVerdict;
  rootCause: ApplicationTruthRootCause;
  proofAnalysisVerdict: string;
  contradictions: readonly RuntimeTruthContradiction[];
  contradictionCount: number;
  rulesApplied: readonly string[];
  truthMatrixVerdictUpdated: boolean;
  founderTestVerdictReconciled: boolean;
  authoritativeSource: RuntimeEvidencePriority;
  recommendedFix: string;
  founderAnswers: RuntimeMaterializationFounderAnswers;
  failureBoundary: string;
  startupFailureClass: string | null;
}

export interface RuntimeMaterializationTruthBridgeReport {
  readOnly: true;
  advisoryOnly: true;
  bridgeId: string;
  generatedAt: string;
  coreQuestion: string;
  evidence: RuntimeMaterializationTruthEvidence;
  reconciliation: RuntimeMaterializationTruthReconciliation;
  runtimeEvidenceSummary: string;
  founderTestVerdictSummary: string;
  truthMatrixVerdictSummary: string;
  finalApplicationTruth: ApplicationTruthVerdict;
  cacheKey: string;
}

export interface RuntimeMaterializationTruthBridgeAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_MATERIALIZATION_TRUTH_COMPLETE';
  report: RuntimeMaterializationTruthBridgeReport;
  cacheKey: string;
}

export interface AssessRuntimeMaterializationTruthBridgeInput {
  rootDir?: string;
  runtimeActivationProof?: RuntimeActivationProofReport | null;
  previewExperienceProof?: PreviewExperienceProofReport | null;
  buildMaterializationTruthBridge?: BuildMaterializationTruthBridgeAssessment | null;
  buildMaterializationReport?: import('../connected-build-execution/connected-build-execution-types.js').ConnectedBuildExecutionReport | null;
  skipRuntimeAssessment?: boolean;
  skipPreviewAssessment?: boolean;
  startupProofRepair?: RuntimeStartupProofRepairAssessment | null;
  skipStartupProofRepair?: boolean;
  dependencyMaterialization?: GeneratedWorkspaceDependencyMaterializationAssessment | null;
  skipDependencyMaterialization?: boolean;
  dependencyInstallationExecutor?: GeneratedWorkspaceDependencyInstallationExecutorAssessment | null;
  crashDiagnosis?: GeneratedRuntimeCrashDiagnosisAssessment | null;
  routeReachabilityProof?: RuntimeRouteReachabilityProofAssessment | null;
  skipRouteReachabilityProof?: boolean;
  uiRenderProof?: RuntimeUiRenderProofAssessment | null;
  skipUiRenderProof?: boolean;
  founderFlowRuntimeProof?: FounderFlowRuntimeProofAssessment | null;
  skipFounderFlowRuntimeProof?: boolean;
  dependencyInstallExecutionMode?: DependencyInstallExecutionMode | 'SKIP';
  workspacePath?: string | null;
  workspaceId?: string | null;
  skipHistoryRecording?: boolean;
}

export interface RuntimeMaterializationTruthBridgeHistoryEntry {
  readOnly: true;
  bridgeId: string;
  generatedAt: string;
  finalApplicationTruth: ApplicationTruthVerdict;
  rootCause: ApplicationTruthRootCause;
  failureBoundary: string;
  contradictionCount: number;
  cacheKey: string;
}

export type RuntimeApplicationClaimId =
  | 'APPLICATION_WORKS'
  | 'APPLICATION_RUNS'
  | 'APPLICATION_REACHABLE'
  | 'FOUNDER_CAN_USE_APPLICATION'
  | 'LIVE_PREVIEW_RUNS_APPLICATIONS';
