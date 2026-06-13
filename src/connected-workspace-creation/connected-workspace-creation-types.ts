/**
 * Connected Workspace Creation — core models.
 * First World 2 phase with real disposable workspace directory creation.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import type { World2DisposableWorkspaceCreatorAssessment } from '../world2-disposable-workspace-creator/world2-disposable-workspace-creator-types.js';
import type { World2DisposableWorkspaceInstantiatorAssessment } from '../world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import type { World2InstantiationGovernanceAssessment } from '../world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-types.js';
import type { World2WorkspaceMaterializationAssessment } from '../world2-workspace-materialization/world2-workspace-materialization-types.js';
import type { WorkspacePopulationAssessment } from '../world2-workspace-population/world2-workspace-population-types.js';

export type WorkspaceCreationState =
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_CREATED_WITH_WARNINGS'
  | 'WORKSPACE_CREATION_FAILED'
  | 'WORKSPACE_CREATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type WorkspaceCreationMode = 'REAL_CREATION' | 'DRY_RUN' | 'BLOCKED';

export interface WorkspaceCreationArtifact {
  readOnly: true;
  path: string;
  category: string;
  sourceAuthority: string;
}

export interface WorkspaceCreationEvidenceEntry {
  readOnly: true;
  evidenceId: string;
  evidenceType: string;
  summary: string;
  source: string;
  inspectedAt: string;
}

export interface WorkspaceCreationFilesystemEvidence {
  readOnly: true;
  workspaceExists: boolean;
  workspaceRootExists: boolean;
  directoryCount: number;
  artifactCount: number;
  creationDurationMs: number;
  creationSuccessful: boolean;
  inspectedAt: string;
  inspectionSource: 'real-filesystem-inspection';
}

export interface WorkspaceCreationContract {
  readOnly: true;
  workspaceId: string;
  workspaceRoot: string;
  logicalRoot: string;
  creationTimestamp: string;
  creationMode: WorkspaceCreationMode;
  createdDirectories: string[];
  createdArtifacts: WorkspaceCreationArtifact[];
  creationWarnings: string[];
  creationEvidence: WorkspaceCreationEvidenceEntry[];
  filesystemEvidence: WorkspaceCreationFilesystemEvidence;
  realFileMutationPerformed: boolean;
  world1Protected: true;
  disposableOnly: true;
}

export interface WorkspaceCreationQuestionAnswers {
  workspaceCreated: boolean;
  workspaceExists: boolean;
  isDisposable: boolean;
  isIsolated: boolean;
  world1Protected: boolean;
  governanceSatisfied: boolean;
  creationAuditable: boolean;
  rollbackAvailable: boolean;
  founderInspectable: boolean;
  workspaceCreationProven: boolean;
}

export interface ConnectedWorkspaceCreationInputSnapshot {
  readOnly: true;
  disposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  populationAssessment: WorkspacePopulationAssessment;
  materializationAssessment: World2WorkspaceMaterializationAssessment;
  instantiationGovernanceAssessment: World2InstantiationGovernanceAssessment;
  creatorAssessment: World2DisposableWorkspaceCreatorAssessment;
  instantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment;
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment | null;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  missingAuthorities: string[];
}

export interface ConnectedWorkspaceCreationReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  creationId: string;
  generatedAt: string;
  workspaceCreationScore: number;
  workspaceState: WorkspaceCreationState;
  creationContract: WorkspaceCreationContract | null;
  blockingStages: string[];
  warningStages: string[];
  recommendedNextActions: string[];
  questionAnswers: WorkspaceCreationQuestionAnswers;
  inputSnapshot: ConnectedWorkspaceCreationInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedWorkspaceCreationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'WORKSPACE_CREATION_COMPLETE' | 'WORKSPACE_CREATION_FAILED';
  report: ConnectedWorkspaceCreationReport;
}

export interface AssessConnectedWorkspaceCreationInput {
  rootDir?: string;
  instantiatorAssessment?: World2DisposableWorkspaceInstantiatorAssessment;
  connectedBuildExecutionAssessment?: ConnectedBuildExecutionAssessment;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment | null;
  executionProofAssessment?: import('../execution-proof-evolution/execution-proof-types.js').ExecutionProofAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
  /** When true, perform real directory creation (bounded — max 1 workspace). */
  performRealCreation?: boolean;
}

export interface ConnectedWorkspaceCreationHistoryEntry {
  timestamp: string;
  creationId: string;
  workspaceCreationScore: number;
  workspaceState: WorkspaceCreationState;
  workspaceId: string;
  realFileMutationPerformed: boolean;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedWorkspaceCreationHistorySummary {
  totalAssessments: number;
  createdWorkspaces: number;
  createdWithWarningsWorkspaces: number;
  failedCreations: number;
  blockedCreations: number;
  insufficientEvidenceCreations: number;
}

export interface ConnectedWorkspaceCreationArtifacts {
  connectedWorkspaceCreationAssessment: ConnectedWorkspaceCreationAssessment;
  connectedWorkspaceCreationReportMarkdown: string;
}

export interface ExecuteWorkspaceCreationInput {
  projectRootDir: string;
  workspaceId: string;
  logicalRoot: string;
  directoriesToCreate: string[];
  artifactsToCreate: WorkspaceCreationArtifact[];
  creationMode: WorkspaceCreationMode;
}

export interface ExecuteWorkspaceCreationResult {
  success: boolean;
  workspaceRoot: string;
  logicalRoot: string;
  createdDirectories: string[];
  createdArtifacts: WorkspaceCreationArtifact[];
  creationWarnings: string[];
  creationEvidence: WorkspaceCreationEvidenceEntry[];
  filesystemEvidence: WorkspaceCreationFilesystemEvidence;
  realFileMutationPerformed: boolean;
  blockingReasons: string[];
}
