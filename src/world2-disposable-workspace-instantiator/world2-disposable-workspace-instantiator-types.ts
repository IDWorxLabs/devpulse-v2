/**
 * World 2 Disposable Workspace Instantiator — core models.
 * Controlled instantiation adapter only — no repository copy or change set application.
 */

import type {
  AssessWorld2DisposableWorkspaceCreatorInput,
  World2DisposableWorkspaceCreatorAssessment,
} from '../world2-disposable-workspace-creator/world2-disposable-workspace-creator-types.js';
import type { World2InstantiationGovernanceAssessment } from '../world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-types.js';
import type { World2WorkspaceMaterializationAssessment } from '../world2-workspace-materialization/world2-workspace-materialization-types.js';

export type World2InstantiationMode =
  | 'DRY_RUN'
  | 'SIMULATED_INSTANTIATION'
  | 'REAL_INSTANTIATION_ELIGIBLE'
  | 'BLOCKED';

export type World2InstantiationResultState =
  | 'INSTANTIATION_READY'
  | 'INSTANTIATION_SIMULATED'
  | 'INSTANTIATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export type World2InstantiationExecutionOverride =
  | 'DRY_RUN'
  | 'SIMULATED_INSTANTIATION'
  | 'REAL_INSTANTIATION';

export interface World2InstantiationSafetyCheck {
  readOnly: true;
  checkId: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface World2DisposableWorkspaceInstantiationOperation {
  readOnly: true;
  operationId: string;
  workspaceId: string;
  plannedRoot: string;
  directoriesToCreate: string[];
  filesToPrepare: string[];
  artifactsToPrepare: string[];
  validationAssetsToPrepare: string[];
  rollbackAssetsToPrepare: string[];
  safetyChecks: World2InstantiationSafetyCheck[];
  mode: World2InstantiationMode;
  resultState: World2InstantiationResultState;
  eligibilityMode: World2InstantiationMode;
  repositoryCopyPerformed: false;
  changeSetApplicationPerformed: false;
}

export interface World2InstantiatorInputSnapshot {
  creatorAssessment: World2DisposableWorkspaceCreatorAssessment;
  materializationAssessment: World2WorkspaceMaterializationAssessment;
  instantiationGovernanceAssessment: World2InstantiationGovernanceAssessment;
  missingAuthorities: string[];
}

export interface World2DisposableWorkspaceInstantiatorAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  instantiatorAssessmentId: string;
  workspaceId: string;
  resultState: World2InstantiationResultState;
  inputSnapshot: World2InstantiatorInputSnapshot;
  instantiationOperation: World2DisposableWorkspaceInstantiationOperation | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2DisposableWorkspaceInstantiatorReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2DisposableWorkspaceInstantiatorAssessment;
  passToken: string;
}

export interface AssessWorld2DisposableWorkspaceInstantiatorInput extends AssessWorld2DisposableWorkspaceCreatorInput {
  creatorAssessment?: World2DisposableWorkspaceCreatorAssessment;
  executionModeOverride?: World2InstantiationExecutionOverride;
}

export interface World2DisposableWorkspaceInstantiatorHistorySummary {
  totalAssessments: number;
  readyInstantiations: number;
  simulatedInstantiations: number;
  blockedInstantiations: number;
  insufficientEvidenceInstantiations: number;
  notReadyInstantiations: number;
}

export interface InstantiationModeContext {
  missingAuthorities: string[];
  creationState: World2DisposableWorkspaceCreatorAssessment['creationState'];
  materializationState: World2WorkspaceMaterializationAssessment['materializationState'];
  governanceState: World2InstantiationGovernanceAssessment['approvalState'];
  safetyChecksPassed: boolean;
  criticalSafetyFailures: number;
  hasCreationPlan: boolean;
  plannedRootIsLive: boolean;
  plannedRootIsProduction: boolean;
}
