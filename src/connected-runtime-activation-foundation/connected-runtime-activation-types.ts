/**
 * Connected Runtime Activation Foundation — core models.
 * Build Output → Runtime Activation bridge only — no runtime launch or execution.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ExecutionPackageRuntimeReport } from '../execution-runtime/types.js';
import type { ExecutionVerificationReport } from '../execution-verification/types.js';
import type { World2DisposableWorkspaceCreatorAssessment } from '../world2-disposable-workspace-creator/world2-disposable-workspace-creator-types.js';
import type { World2DisposableWorkspaceInstantiatorAssessment } from '../world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import type { World2DryRunExecutionVerificationAssessment } from '../world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-types.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';
import type { World2RepositorySnapshotMaterializerAssessment } from '../world2-repository-snapshot-materializer/world2-repository-snapshot-materializer-types.js';

export type RuntimeState =
  | 'RUNTIME_READY'
  | 'RUNTIME_READY_WITH_WARNINGS'
  | 'RUNTIME_NOT_READY'
  | 'RUNTIME_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface RuntimeActivationEntry {
  readOnly: true;
  entryId: string;
  label: string;
  sourceAuthority: string;
  detail: string;
}

export interface RuntimeActivationArtifactEntry {
  readOnly: true;
  name: string;
  path: string | null;
  category: string;
  sourceAuthority: string;
}

export interface RuntimeActivationCandidate {
  readOnly: true;
  candidateId: string;
  workspaceId: string;
  buildOutputManifestId: string;
  candidateType: string;
  startupPath: string | null;
  modeledOnly: true;
  realRuntimeLaunchPerformed: false;
}

export interface RuntimeActivationContract {
  readOnly: true;
  contractId: string;
  workspaceId: string;
  runtimeType: string;
  startupRequirements: RuntimeActivationEntry[];
  startupArtifacts: RuntimeActivationArtifactEntry[];
  runtimeDependencies: RuntimeActivationEntry[];
  activationSteps: RuntimeActivationEntry[];
  verificationRequirements: RuntimeActivationEntry[];
  rollbackRequirements: RuntimeActivationEntry[];
  proofArtifacts: RuntimeActivationArtifactEntry[];
  realRuntimeLaunchPerformed: false;
}

export interface RuntimeActivationQuestionAnswers {
  buildOutputExists: boolean;
  runtimeCandidateExists: boolean;
  startupPathExists: boolean;
  runtimeDependenciesKnown: boolean;
  runtimeActivationDescribable: boolean;
  runtimeActivationReproducible: boolean;
  runtimeActivationVerifiable: boolean;
  founderInspectable: boolean;
  runtimeActivationTraceable: boolean;
  runtimeReadinessProven: boolean;
}

export interface ConnectedRuntimeActivationInputSnapshot {
  readOnly: true;
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  dryRunVerifierAssessment: World2DryRunExecutionVerificationAssessment;
  executionEngineAssessment: World2ExecutionEngineAssessment;
  disposableWorkspaceCreatorAssessment: World2DisposableWorkspaceCreatorAssessment;
  disposableWorkspaceInstantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment;
  repositorySnapshotMaterializerAssessment: World2RepositorySnapshotMaterializerAssessment;
  executionPackageRuntimeReport: ExecutionPackageRuntimeReport;
  executionVerificationReport: ExecutionVerificationReport;
  missingAuthorities: string[];
}

export interface ConnectedRuntimeActivationReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  activationId: string;
  generatedAt: string;
  runtimeReadinessScore: number;
  runtimeState: RuntimeState;
  activationCompleteness: number;
  dependencyCompleteness: number;
  proofCompleteness: number;
  missingRuntimeComponents: string[];
  runtimeActivationPath: string[];
  recommendedNextActions: string[];
  questionAnswers: RuntimeActivationQuestionAnswers;
  runtimeActivationCandidate: RuntimeActivationCandidate;
  runtimeActivationContract: RuntimeActivationContract;
  inputSnapshot: ConnectedRuntimeActivationInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedRuntimeActivationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_ACTIVATION_COMPLETE' | 'RUNTIME_ACTIVATION_FAILED';
  report: ConnectedRuntimeActivationReport;
}

export interface AssessConnectedRuntimeActivationInput {
  rootDir?: string;
  connectedBuildExecutionAssessment?: ConnectedBuildExecutionAssessment;
  dryRunVerifierAssessment?: World2DryRunExecutionVerificationAssessment;
}

export interface ConnectedRuntimeActivationHistoryEntry {
  timestamp: string;
  activationId: string;
  runtimeReadinessScore: number;
  runtimeState: RuntimeState;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedRuntimeActivationHistorySummary {
  totalAssessments: number;
  readyRuntimes: number;
  readyWithWarningsRuntimes: number;
  notReadyRuntimes: number;
  blockedRuntimes: number;
  insufficientEvidenceRuntimes: number;
}

export interface ConnectedRuntimeActivationArtifacts {
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  connectedRuntimeActivationReportMarkdown: string;
}
