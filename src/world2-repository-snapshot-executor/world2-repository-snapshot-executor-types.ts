/**
 * World 2 Repository Snapshot Executor — core models.
 * Snapshot execution request modeling only — no repository copy or file reads.
 */

import type { World2DisposableWorkspaceCreatorAssessment } from '../world2-disposable-workspace-creator/world2-disposable-workspace-creator-types.js';
import type { World2DisposableWorkspaceInstantiatorAssessment } from '../world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import type {
  AssessWorld2RepositorySnapshotInput,
  World2RepositorySnapshotAssessment,
  World2SnapshotManifestEntry,
} from '../world2-repository-snapshot/world2-repository-snapshot-types.js';

export type World2SnapshotExecutionMode =
  | 'DRY_RUN'
  | 'SIMULATED_SNAPSHOT'
  | 'REAL_SNAPSHOT_ELIGIBLE'
  | 'BLOCKED';

export type World2SnapshotExecutionState =
  | 'SNAPSHOT_EXECUTION_READY'
  | 'SNAPSHOT_EXECUTION_SIMULATED'
  | 'SNAPSHOT_EXECUTION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export type World2SnapshotExecutionOverride =
  | 'DRY_RUN'
  | 'SIMULATED_SNAPSHOT'
  | 'REAL_SNAPSHOT_ELIGIBLE';

export interface World2SnapshotExecutionSafetyCheck {
  readOnly: true;
  checkId: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface World2SnapshotExecutionBounds {
  readOnly: true;
  maxFiles: number;
  maxDirectories: number;
  maxEstimatedSize: string;
  maxAttempts: number;
  expiresAt: string;
}

export interface World2SnapshotExecutionRequest {
  readOnly: true;
  requestId: string;
  snapshotId: string;
  workspaceId: string;
  sourceProjectId: string;
  includedPaths: string[];
  excludedPaths: string[];
  manifestEntries: World2SnapshotManifestEntry[];
  executionBounds: World2SnapshotExecutionBounds;
  safetyChecks: World2SnapshotExecutionSafetyCheck[];
  mode: World2SnapshotExecutionMode;
  executionState: World2SnapshotExecutionState;
  eligibilityMode: World2SnapshotExecutionMode;
  repositoryCopyPerformed: false;
}

export interface World2SnapshotDryRunExecutionResult {
  readOnly: true;
  resultId: string;
  requestId: string;
  mode: World2SnapshotExecutionMode;
  simulatedFileCount: number;
  simulatedDirectoryCount: number;
  repositoryCopyPerformed: false;
  completedAt: string;
}

export interface World2SnapshotExecutorInputSnapshot {
  repositorySnapshotAssessment: World2RepositorySnapshotAssessment;
  instantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment;
  creatorAssessment: World2DisposableWorkspaceCreatorAssessment;
  missingAuthorities: string[];
}

export interface World2RepositorySnapshotExecutorAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  executorAssessmentId: string;
  workspaceId: string;
  executionState: World2SnapshotExecutionState;
  inputSnapshot: World2SnapshotExecutorInputSnapshot;
  executionRequest: World2SnapshotExecutionRequest | null;
  dryRunExecutionResult: World2SnapshotDryRunExecutionResult | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2RepositorySnapshotExecutorReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2RepositorySnapshotExecutorAssessment;
  passToken: string;
}

export interface AssessWorld2RepositorySnapshotExecutorInput
  extends Omit<AssessWorld2RepositorySnapshotInput, 'executionModeOverride'> {
  repositorySnapshotAssessment?: World2RepositorySnapshotAssessment;
  executionModeOverride?: World2SnapshotExecutionOverride;
}

export interface World2RepositorySnapshotExecutorHistorySummary {
  totalAssessments: number;
  readyExecutions: number;
  simulatedExecutions: number;
  blockedExecutions: number;
  insufficientEvidenceExecutions: number;
  notReadyExecutions: number;
}

export interface SnapshotExecutionModeContext {
  missingAuthorities: string[];
  snapshotState: World2RepositorySnapshotAssessment['snapshotState'];
  instantiatorResultState: World2DisposableWorkspaceInstantiatorAssessment['resultState'];
  creatorState: World2DisposableWorkspaceCreatorAssessment['creationState'];
  safetyChecksPassed: boolean;
  criticalSafetyFailures: number;
  hasSnapshotScope: boolean;
  secretsIncluded: boolean;
  livePathIncluded: boolean;
  productionPathIncluded: boolean;
  unboundedRootCopy: boolean;
}
