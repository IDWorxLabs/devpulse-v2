/**
 * World 2 Workspace Materialization — core models.
 * Virtual workspace blueprint only — no directory or file creation.
 */

import type { World2ChangeSetAssessment } from '../world2-change-set-authority/world2-change-set-types.js';
import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import type {
  AssessWorld2WorkspacePopulationInput,
  WorkspacePopulationAssessment,
} from '../world2-workspace-population/world2-workspace-population-types.js';

export type World2MaterializationState =
  | 'NOT_READY'
  | 'READY'
  | 'READY_WITH_WARNINGS'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type World2WorkspaceSizeEstimate = 'SMALL' | 'MEDIUM' | 'LARGE' | 'VERY_LARGE';

export interface World2BlueprintFileEntry {
  readOnly: true;
  path: string;
  purpose: string;
  source: string;
}

export interface World2BlueprintDirectoryEntry {
  readOnly: true;
  path: string;
  purpose: string;
}

export interface World2BlueprintArtifactEntry {
  readOnly: true;
  name: string;
  path: string | null;
  category: string;
}

export interface World2WorkspaceBlueprint {
  readOnly: true;
  blueprintId: string;
  workspaceId: string;
  directories: World2BlueprintDirectoryEntry[];
  files: World2BlueprintFileEntry[];
  artifacts: World2BlueprintArtifactEntry[];
  validationAssets: string[];
  rollbackAssets: string[];
  metadataAssets: string[];
  estimatedWorkspaceSize: World2WorkspaceSizeEstimate;
}

export interface World2MaterializationContract {
  readOnly: true;
  contractId: string;
  workspaceId: string;
  plannedDirectories: string[];
  plannedFiles: string[];
  plannedArtifacts: string[];
  plannedValidationAssets: string[];
  plannedRollbackAssets: string[];
  forbiddenPaths: string[];
}

export interface World2BlueprintValidationResult {
  readOnly: true;
  valid: boolean;
  requiredDirectoriesPresent: boolean;
  requiredFilesPresent: boolean;
  requiredValidationAssetsPresent: boolean;
  requiredRollbackAssetsPresent: boolean;
  forbiddenPathsDetected: string[];
  missingCriticalAssets: string[];
  warningGaps: string[];
}

export interface World2MaterializationInputSnapshot {
  populationAssessment: WorkspacePopulationAssessment;
  disposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  changeSetAssessment: World2ChangeSetAssessment;
  missingAuthorities: string[];
}

export interface World2WorkspaceMaterializationAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  materializationId: string;
  workspaceId: string;
  materializationState: World2MaterializationState;
  inputSnapshot: World2MaterializationInputSnapshot;
  blueprint: World2WorkspaceBlueprint | null;
  blueprintValidation: World2BlueprintValidationResult;
  materializationContract: World2MaterializationContract | null;
  sizeEstimate: World2WorkspaceSizeEstimate;
  forbiddenPathAnalysis: string[];
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2WorkspaceMaterializationReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2WorkspaceMaterializationAssessment;
  passToken: string;
}

export interface AssessWorld2WorkspaceMaterializationInput extends AssessWorld2WorkspacePopulationInput {
  populationAssessment?: WorkspacePopulationAssessment;
}

export interface World2WorkspaceMaterializationHistorySummary {
  totalAssessments: number;
  readyBlueprints: number;
  warningBlueprints: number;
  blockedBlueprints: number;
  insufficientEvidenceBlueprints: number;
  notReadyBlueprints: number;
}

export interface WorkspaceSizeAnalysisInput {
  directoryCount: number;
  fileCount: number;
  artifactCount: number;
}
