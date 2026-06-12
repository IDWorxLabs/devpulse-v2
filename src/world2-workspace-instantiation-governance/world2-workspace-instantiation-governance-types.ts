/**
 * World 2 Workspace Instantiation Governance — core models.
 * Instantiation permission only — no workspace or file creation.
 */

import type { World2ChangeSetAssessment } from '../world2-change-set-authority/world2-change-set-types.js';
import type { World2RuntimeAssessment } from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';
import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import type {
  AssessWorld2WorkspaceMaterializationInput,
  World2WorkspaceMaterializationAssessment,
} from '../world2-workspace-materialization/world2-workspace-materialization-types.js';

export type World2InstantiationApprovalState =
  | 'APPROVED'
  | 'APPROVED_WITH_RESTRICTIONS'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export interface World2InstantiationExpirationPolicy {
  readOnly: true;
  maxApprovalDurationMs: number;
  maxInstantiationAttempts: number;
  expiresAfterAttempts: boolean;
  expiresAfterDuration: boolean;
}

export interface World2InstantiationGovernanceApproval {
  readOnly: true;
  approvalId: string;
  workspaceId: string;
  blueprintId: string | null;
  approvalState: World2InstantiationApprovalState;
  restrictions: string[];
  blockingReasons: string[];
  requiredPreconditions: string[];
  requiredPostconditions: string[];
  safetyGuarantees: string[];
  expirationPolicy: World2InstantiationExpirationPolicy;
}

export interface World2InstantiationInputSnapshot {
  materializationAssessment: World2WorkspaceMaterializationAssessment;
  disposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  changeSetAssessment: World2ChangeSetAssessment;
  runtimeAssessment: World2RuntimeAssessment;
  missingAuthorities: string[];
}

export interface World2InstantiationGovernanceAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  governanceId: string;
  workspaceId: string;
  approvalState: World2InstantiationApprovalState;
  inputSnapshot: World2InstantiationInputSnapshot;
  governanceApproval: World2InstantiationGovernanceApproval | null;
  warningReasons: string[];
  cacheKey: string;
}

export interface World2InstantiationGovernanceReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2InstantiationGovernanceAssessment;
  passToken: string;
}

export interface AssessWorld2InstantiationGovernanceInput extends AssessWorld2WorkspaceMaterializationInput {
  materializationAssessment?: World2WorkspaceMaterializationAssessment;
}

export interface World2InstantiationGovernanceHistorySummary {
  totalAssessments: number;
  approvedInstantiations: number;
  restrictedInstantiations: number;
  blockedInstantiations: number;
  insufficientEvidenceInstantiations: number;
  notReadyInstantiations: number;
}

export interface InstantiationApprovalContext {
  missingAuthorities: string[];
  materializationState: World2WorkspaceMaterializationAssessment['materializationState'];
  disposableWorkspaceState: World2DisposableWorkspaceAssessment['workspaceState'];
  changeSetState: World2ChangeSetAssessment['eligibilityState'];
  runtimeState: World2RuntimeAssessment['executionState'];
  forbiddenPathCount: number;
  validationAssetsPresent: boolean;
  rollbackAssetsPresent: boolean;
  disposalRequired: boolean;
  criticalRisk: boolean;
  hasBlueprint: boolean;
}
