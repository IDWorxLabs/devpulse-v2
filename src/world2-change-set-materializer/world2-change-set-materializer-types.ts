/**
 * World 2 Change Set Materializer — core models.
 * Change materialization operation modeling only — no real file mutations.
 */

import type { World2ChangeOperation, World2ChangeSetAssessment } from '../world2-change-set-authority/world2-change-set-types.js';
import type { World2DisposableWorkspaceInstantiatorAssessment } from '../world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import type {
  AssessWorld2RepositorySnapshotMaterializerInput,
  World2RepositorySnapshotMaterializerAssessment,
} from '../world2-repository-snapshot-materializer/world2-repository-snapshot-materializer-types.js';
import type { World2WorkspaceMaterializationAssessment } from '../world2-workspace-materialization/world2-workspace-materialization-types.js';

export type World2ChangeMaterializationMode =
  | 'DRY_RUN'
  | 'SIMULATED_CHANGE_MATERIALIZATION'
  | 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE'
  | 'BLOCKED';

export type World2ChangeMaterializationState =
  | 'CHANGE_MATERIALIZATION_READY'
  | 'CHANGE_MATERIALIZATION_SIMULATED'
  | 'CHANGE_MATERIALIZATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export type World2ChangeMaterializationOverride =
  | 'DRY_RUN'
  | 'SIMULATED_CHANGE_MATERIALIZATION'
  | 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE';

export interface World2ChangeMaterializationSafetyCheck {
  readOnly: true;
  checkId: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface World2ChangeRollbackMapEntry {
  readOnly: true;
  operationId: string;
  targetPath: string;
  rollbackAction: string;
}

export interface World2ChangeMaterializationOperation {
  readOnly: true;
  operationId: string;
  changeSetId: string;
  workspaceId: string;
  targetWorkspaceRoot: string;
  plannedFileCreates: string[];
  plannedFileModifies: string[];
  plannedFileDeletes: string[];
  plannedDirectoryCreates: string[];
  plannedDirectoryDeletes: string[];
  plannedMoves: string[];
  skippedOperations: string[];
  rollbackMap: World2ChangeRollbackMapEntry[];
  safetyChecks: World2ChangeMaterializationSafetyCheck[];
  postconditions: string[];
  mode: World2ChangeMaterializationMode;
  materializationState: World2ChangeMaterializationState;
  eligibilityMode: World2ChangeMaterializationMode;
  realFileMutationPerformed: false;
}

export interface World2ChangeDryRunMaterializationResult {
  readOnly: true;
  resultId: string;
  operationId: string;
  mode: World2ChangeMaterializationMode;
  simulatedCreateCount: number;
  simulatedModifyCount: number;
  simulatedDeleteCount: number;
  simulatedMoveCount: number;
  realFileMutationPerformed: false;
  completedAt: string;
}

export interface World2ChangeSetMaterializerInputSnapshot {
  changeSetAssessment: World2ChangeSetAssessment;
  materializationAssessment: World2WorkspaceMaterializationAssessment;
  snapshotMaterializerAssessment: World2RepositorySnapshotMaterializerAssessment;
  instantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment;
  missingAuthorities: string[];
}

export interface World2ChangeSetMaterializerAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  materializerAssessmentId: string;
  workspaceId: string;
  materializationState: World2ChangeMaterializationState;
  inputSnapshot: World2ChangeSetMaterializerInputSnapshot;
  materializationOperation: World2ChangeMaterializationOperation | null;
  dryRunMaterializationResult: World2ChangeDryRunMaterializationResult | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2ChangeSetMaterializerReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2ChangeSetMaterializerAssessment;
  passToken: string;
}

export interface AssessWorld2ChangeSetMaterializerInput extends AssessWorld2RepositorySnapshotMaterializerInput {
  snapshotMaterializerAssessment?: World2RepositorySnapshotMaterializerAssessment;
  materializationModeOverride?: World2ChangeMaterializationOverride;
}

export interface World2ChangeSetMaterializerHistorySummary {
  totalAssessments: number;
  readyMaterializations: number;
  simulatedMaterializations: number;
  blockedMaterializations: number;
  insufficientEvidenceMaterializations: number;
  notReadyMaterializations: number;
}

export interface ChangeMaterializationModeContext {
  missingAuthorities: string[];
  changeSetState: World2ChangeSetAssessment['eligibilityState'];
  materializationState: World2WorkspaceMaterializationAssessment['materializationState'];
  snapshotMaterializerState: World2RepositorySnapshotMaterializerAssessment['materializationState'];
  instantiatorResultState: World2DisposableWorkspaceInstantiatorAssessment['resultState'];
  safetyChecksPassed: boolean;
  criticalSafetyFailures: number;
  hasChangeSet: boolean;
  targetRootDisposableOnly: boolean;
  livePathDetected: boolean;
  productionPathDetected: boolean;
  unboundedDelete: boolean;
  rollbackMapComplete: boolean;
  verificationComplete: boolean;
}

export interface World2PlannedChangeOperations {
  plannedFileCreates: string[];
  plannedFileModifies: string[];
  plannedFileDeletes: string[];
  plannedDirectoryCreates: string[];
  plannedDirectoryDeletes: string[];
  plannedMoves: string[];
  skippedOperations: string[];
}
