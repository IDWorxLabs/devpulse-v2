/**
 * World 2 Dry-Run Execution Composer — core models.
 * Composed dry-run execution package modeling only — no real execution or file mutations.
 */

import type { World2ChangeMaterializationOperation } from '../world2-change-set-materializer/world2-change-set-materializer-types.js';
import type {
  AssessWorld2ChangeSetMaterializerInput,
  World2ChangeSetMaterializerAssessment,
} from '../world2-change-set-materializer/world2-change-set-materializer-types.js';
import type {
  AssessWorld2ControlledExecutionRuntimeInput,
  World2RuntimeAssessment,
} from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';
import type {
  AssessWorld2ExecutionEngineInput,
  World2ExecutionEngineAssessment,
} from '../world2-execution-engine/world2-execution-engine-types.js';
import type {
  World2RepositorySnapshotMaterializerAssessment,
  World2SnapshotMaterializationOperation,
} from '../world2-repository-snapshot-materializer/world2-repository-snapshot-materializer-types.js';

export type World2DryRunPackageState =
  | 'DRY_RUN_PACKAGE_READY'
  | 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS'
  | 'DRY_RUN_PACKAGE_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export interface World2DryRunOrderedStep {
  readOnly: true;
  stepId: string;
  order: number;
  label: string;
  description: string;
  sourceAuthority: string;
  dryRunOnly: true;
  realExecutionPerformed: false;
}

export interface World2DryRunValidationStep {
  readOnly: true;
  validationId: string;
  requirement: string;
  source: string;
  mandatory: boolean;
}

export interface World2DryRunRollbackStep {
  readOnly: true;
  rollbackId: string;
  targetScope: string;
  rollbackAction: string;
  source: string;
}

export interface World2DryRunExecutionAuditEntry {
  readOnly: true;
  auditId: string;
  packageId: string;
  stepId: string;
  event: string;
  detail: string;
  recordedAt: string;
}

export interface World2DryRunExecutionSafetyCheck {
  readOnly: true;
  checkId: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface World2DryRunExecutionPackage {
  readOnly: true;
  packageId: string;
  workspaceId: string;
  snapshotMaterializationOperation: World2SnapshotMaterializationOperation | null;
  changeMaterializationOperation: World2ChangeMaterializationOperation | null;
  orderedSteps: World2DryRunOrderedStep[];
  validationSteps: World2DryRunValidationStep[];
  rollbackSteps: World2DryRunRollbackStep[];
  auditTrail: World2DryRunExecutionAuditEntry[];
  safetyChecks: World2DryRunExecutionSafetyCheck[];
  finalReadinessState: World2DryRunPackageState;
  realExecutionPerformed: false;
}

export interface World2DryRunExecutionComposerInputSnapshot {
  snapshotMaterializerAssessment: World2RepositorySnapshotMaterializerAssessment;
  changeSetMaterializerAssessment: World2ChangeSetMaterializerAssessment;
  engineAssessment: World2ExecutionEngineAssessment;
  runtimeAssessment: World2RuntimeAssessment;
  missingAuthorities: string[];
}

export interface World2DryRunExecutionComposerAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  composerAssessmentId: string;
  workspaceId: string;
  packageState: World2DryRunPackageState;
  inputSnapshot: World2DryRunExecutionComposerInputSnapshot;
  executionPackage: World2DryRunExecutionPackage | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2DryRunExecutionComposerReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2DryRunExecutionComposerAssessment;
  passToken: string;
}

export interface AssessWorld2DryRunExecutionComposerInput
  extends AssessWorld2ChangeSetMaterializerInput,
    AssessWorld2ExecutionEngineInput,
    AssessWorld2ControlledExecutionRuntimeInput {
  changeSetMaterializerAssessment?: World2ChangeSetMaterializerAssessment;
  engineAssessment?: World2ExecutionEngineAssessment;
  runtimeAssessment?: World2RuntimeAssessment;
}

export interface World2DryRunExecutionComposerHistorySummary {
  totalAssessments: number;
  readyPackages: number;
  readyWithWarningsPackages: number;
  blockedPackages: number;
  insufficientEvidencePackages: number;
  notReadyPackages: number;
}

export interface DryRunPackageStateContext {
  missingAuthorities: string[];
  snapshotMaterializerState: World2RepositorySnapshotMaterializerAssessment['materializationState'];
  changeMaterializerState: World2ChangeSetMaterializerAssessment['materializationState'];
  runtimeState: World2RuntimeAssessment['executionState'];
  engineFinalState: World2ExecutionEngineAssessment['finalState'];
  safetyChecksPassed: boolean;
  criticalSafetyFailures: number;
  hasSnapshotOperation: boolean;
  hasChangeOperation: boolean;
  validationStepsExist: boolean;
  rollbackStepsExist: boolean;
  realExecutionDetected: boolean;
  forbiddenPathDetected: boolean;
  upstreamBlocked: boolean;
}
