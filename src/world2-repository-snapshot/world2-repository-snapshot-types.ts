/**
 * World 2 Repository Snapshot — core models.
 * Snapshot eligibility and scope only — no repository copy or file reads.
 */

import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import type {
  AssessWorld2DisposableWorkspaceInstantiatorInput,
  World2DisposableWorkspaceInstantiatorAssessment,
} from '../world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import type { World2WorkspaceMaterializationAssessment } from '../world2-workspace-materialization/world2-workspace-materialization-types.js';
import type { WorkspacePopulationAssessment } from '../world2-workspace-population/world2-workspace-population-types.js';

export type World2SnapshotState =
  | 'SNAPSHOT_READY'
  | 'SNAPSHOT_READY_WITH_RESTRICTIONS'
  | 'SNAPSHOT_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export interface World2SnapshotBounds {
  readOnly: true;
  maxFiles: number;
  maxDirectories: number;
  maxEstimatedSize: string;
  maxSensitiveMatches: number;
  maxSnapshotAttempts: number;
}

export interface World2SnapshotSafetyCheck {
  readOnly: true;
  checkId: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface World2SnapshotManifestEntry {
  readOnly: true;
  path: string;
  kind: 'FILE' | 'DIRECTORY' | 'METADATA';
  included: boolean;
  reason: string;
}

export interface World2SnapshotManifest {
  readOnly: true;
  manifestId: string;
  workspaceId: string;
  sourceProjectId: string;
  entries: World2SnapshotManifestEntry[];
  exclusionCount: number;
  inclusionCount: number;
  repositoryCopyPerformed: false;
}

export interface World2RepositorySnapshotScope {
  readOnly: true;
  snapshotId: string;
  workspaceId: string;
  sourceProjectId: string;
  includedPaths: string[];
  excludedPaths: string[];
  requiredFiles: string[];
  requiredDirectories: string[];
  snapshotManifest: World2SnapshotManifest;
  snapshotBounds: World2SnapshotBounds;
  safetyChecks: World2SnapshotSafetyCheck[];
}

export interface World2RepositorySnapshotInputSnapshot {
  instantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment;
  materializationAssessment: World2WorkspaceMaterializationAssessment;
  populationAssessment: WorkspacePopulationAssessment;
  disposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  missingAuthorities: string[];
}

export interface World2RepositorySnapshotAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  snapshotAssessmentId: string;
  workspaceId: string;
  snapshotState: World2SnapshotState;
  inputSnapshot: World2RepositorySnapshotInputSnapshot;
  snapshotScope: World2RepositorySnapshotScope | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2RepositorySnapshotReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2RepositorySnapshotAssessment;
  passToken: string;
}

export interface AssessWorld2RepositorySnapshotInput extends AssessWorld2DisposableWorkspaceInstantiatorInput {
  instantiatorAssessment?: World2DisposableWorkspaceInstantiatorAssessment;
}

export interface World2RepositorySnapshotHistorySummary {
  totalAssessments: number;
  readySnapshots: number;
  restrictedSnapshots: number;
  blockedSnapshots: number;
  insufficientEvidenceSnapshots: number;
  notReadySnapshots: number;
}

export interface SnapshotStateContext {
  missingAuthorities: string[];
  instantiatorResultState: World2DisposableWorkspaceInstantiatorAssessment['resultState'];
  materializationState: World2WorkspaceMaterializationAssessment['materializationState'];
  populationState: WorkspacePopulationAssessment['readinessState'];
  disposableWorkspaceState: World2DisposableWorkspaceAssessment['workspaceState'];
  safetyChecksPassed: boolean;
  criticalSafetyFailures: number;
  hasInstantiationOperation: boolean;
  upstreamWarningStates: boolean;
  sensitivePathExcluded: boolean;
  exclusionsPresent: boolean;
  unboundedRootCopyDetected: boolean;
}
