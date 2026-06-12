/**
 * World 2 Disposable Workspace Creator — core models.
 * Creation request modeling only — no real workspace or file creation.
 */

import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import type {
  AssessWorld2InstantiationGovernanceInput,
  World2InstantiationGovernanceAssessment,
} from '../world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-types.js';
import type { World2WorkspaceMaterializationAssessment } from '../world2-workspace-materialization/world2-workspace-materialization-types.js';
import type { WorkspacePopulationAssessment } from '../world2-workspace-population/world2-workspace-population-types.js';

export type World2CreationState =
  | 'CREATION_READY'
  | 'CREATION_READY_WITH_RESTRICTIONS'
  | 'CREATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export interface World2CreationBounds {
  readOnly: true;
  maxDirectories: number;
  maxFiles: number;
  maxArtifacts: number;
  maxEstimatedSize: string;
  maxCreationAttempts: number;
  expirationTtlMs: number;
  expirationTimestamp: string;
}

export interface World2DisposalPolicy {
  readOnly: true;
  disposalRequired: boolean;
  disposalTrigger: string;
  disposalMethod: string;
  disposalSuccessCriteria: string;
}

export interface World2CreationSafetyAudit {
  readOnly: true;
  passed: boolean;
  instantiationApproved: boolean;
  disposableWorkspaceOnly: boolean;
  noLiveWorkspacePath: boolean;
  noProductionPath: boolean;
  rollbackAssetsPresent: boolean;
  validationAssetsPresent: boolean;
  disposalPolicyPresent: boolean;
  expirationPolicyPresent: boolean;
  failures: string[];
  warnings: string[];
}

export interface World2DisposableWorkspaceCreationPlan {
  readOnly: true;
  creationPlanId: string;
  workspaceId: string;
  blueprintId: string | null;
  sourceProjectId: string;
  plannedRoot: string;
  plannedDirectories: string[];
  plannedFiles: string[];
  plannedArtifacts: string[];
  validationAssets: string[];
  rollbackAssets: string[];
  disposalPolicy: World2DisposalPolicy;
  creationBounds: World2CreationBounds;
  safetyAudit: World2CreationSafetyAudit;
}

export interface World2CreatorInputSnapshot {
  instantiationGovernanceAssessment: World2InstantiationGovernanceAssessment;
  materializationAssessment: World2WorkspaceMaterializationAssessment;
  disposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  populationAssessment: WorkspacePopulationAssessment;
  missingAuthorities: string[];
}

export interface World2DisposableWorkspaceCreatorAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  creatorAssessmentId: string;
  workspaceId: string;
  creationState: World2CreationState;
  inputSnapshot: World2CreatorInputSnapshot;
  creationPlan: World2DisposableWorkspaceCreationPlan | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2DisposableWorkspaceCreatorReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2DisposableWorkspaceCreatorAssessment;
  passToken: string;
}

export interface AssessWorld2DisposableWorkspaceCreatorInput extends AssessWorld2InstantiationGovernanceInput {
  instantiationGovernanceAssessment?: World2InstantiationGovernanceAssessment;
}

export interface World2DisposableWorkspaceCreatorHistorySummary {
  totalAssessments: number;
  creationReadyPlans: number;
  restrictedCreationPlans: number;
  blockedCreationPlans: number;
  insufficientEvidencePlans: number;
  notReadyPlans: number;
}

export interface CreationStateContext {
  missingAuthorities: string[];
  instantiationState: World2InstantiationGovernanceAssessment['approvalState'];
  materializationState: World2WorkspaceMaterializationAssessment['materializationState'];
  disposableWorkspaceState: World2DisposableWorkspaceAssessment['workspaceState'];
  safetyAuditPassed: boolean;
  criticalSafetyFailures: number;
  hasGovernanceApproval: boolean;
  hasBlueprint: boolean;
}
