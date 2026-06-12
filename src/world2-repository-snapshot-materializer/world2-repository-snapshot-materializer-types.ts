/**
 * World 2 Repository Snapshot Materializer — core models.
 * Materialization operation modeling only — no repository copy or live file reads.
 */

import type { World2DisposableWorkspaceInstantiatorAssessment } from '../world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import type {
  AssessWorld2RepositorySnapshotExecutorInput,
  World2RepositorySnapshotExecutorAssessment,
  World2SnapshotExecutionMode,
} from '../world2-repository-snapshot-executor/world2-repository-snapshot-executor-types.js';
import type {
  World2RepositorySnapshotAssessment,
  World2SnapshotManifestEntry,
  World2SnapshotState,
} from '../world2-repository-snapshot/world2-repository-snapshot-types.js';

export type World2SnapshotMaterializationMode =
  | 'DRY_RUN'
  | 'SIMULATED_MATERIALIZATION'
  | 'REAL_MATERIALIZATION_ELIGIBLE'
  | 'BLOCKED';

export type World2SnapshotMaterializationState =
  | 'MATERIALIZATION_READY'
  | 'MATERIALIZATION_SIMULATED'
  | 'MATERIALIZATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export type World2SnapshotMaterializationOverride =
  | 'DRY_RUN'
  | 'SIMULATED_MATERIALIZATION'
  | 'REAL_MATERIALIZATION_ELIGIBLE';

export interface World2SnapshotMaterializationSafetyCheck {
  readOnly: true;
  checkId: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface World2SnapshotMaterializationOperation {
  readOnly: true;
  operationId: string;
  requestId: string;
  snapshotId: string;
  workspaceId: string;
  sourceProjectId: string;
  targetWorkspaceRoot: string;
  manifestEntries: World2SnapshotManifestEntry[];
  includedPaths: string[];
  excludedPaths: string[];
  plannedWrites: string[];
  plannedSkips: string[];
  safetyChecks: World2SnapshotMaterializationSafetyCheck[];
  postconditions: string[];
  mode: World2SnapshotMaterializationMode;
  materializationState: World2SnapshotMaterializationState;
  eligibilityMode: World2SnapshotMaterializationMode;
  repositoryCopyPerformed: false;
  liveFileReadPerformed: false;
}

export interface World2SnapshotDryRunMaterializationResult {
  readOnly: true;
  resultId: string;
  operationId: string;
  mode: World2SnapshotMaterializationMode;
  simulatedWriteCount: number;
  simulatedSkipCount: number;
  repositoryCopyPerformed: false;
  liveFileReadPerformed: false;
  completedAt: string;
}

export interface World2SnapshotMaterializerInputSnapshot {
  snapshotExecutorAssessment: World2RepositorySnapshotExecutorAssessment;
  repositorySnapshotAssessment: World2RepositorySnapshotAssessment;
  instantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment;
  missingAuthorities: string[];
}

export interface World2RepositorySnapshotMaterializerAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  materializerAssessmentId: string;
  workspaceId: string;
  materializationState: World2SnapshotMaterializationState;
  inputSnapshot: World2SnapshotMaterializerInputSnapshot;
  materializationOperation: World2SnapshotMaterializationOperation | null;
  dryRunMaterializationResult: World2SnapshotDryRunMaterializationResult | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2RepositorySnapshotMaterializerReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2RepositorySnapshotMaterializerAssessment;
  passToken: string;
}

export interface AssessWorld2RepositorySnapshotMaterializerInput extends AssessWorld2RepositorySnapshotExecutorInput {
  snapshotExecutorAssessment?: World2RepositorySnapshotExecutorAssessment;
  materializationModeOverride?: World2SnapshotMaterializationOverride;
}

export interface World2RepositorySnapshotMaterializerHistorySummary {
  totalAssessments: number;
  readyMaterializations: number;
  simulatedMaterializations: number;
  blockedMaterializations: number;
  insufficientEvidenceMaterializations: number;
  notReadyMaterializations: number;
}

export interface SnapshotMaterializationModeContext {
  missingAuthorities: string[];
  executorState: World2RepositorySnapshotExecutorAssessment['executionState'];
  executorMode: World2SnapshotExecutionMode | null;
  executorEligibilityMode: World2SnapshotExecutionMode | null;
  snapshotState: World2SnapshotState;
  instantiatorResultState: World2DisposableWorkspaceInstantiatorAssessment['resultState'];
  safetyChecksPassed: boolean;
  criticalSafetyFailures: number;
  hasExecutionRequest: boolean;
  targetRootDisposableOnly: boolean;
  secretsIncluded: boolean;
  livePathIncluded: boolean;
  productionPathIncluded: boolean;
  unboundedRootCopy: boolean;
  repositoryCopyPerformed: boolean;
  liveFileReadPerformed: boolean;
}
