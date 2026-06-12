/**
 * World 2 Change Set Authority — core models.
 * Change set modeling only — no file modification or workspace creation.
 */

import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type {
  AssessWorld2DisposableWorkspaceInput,
  World2DisposableWorkspaceAssessment,
} from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';

export type World2ChangeOperationType =
  | 'CREATE_FILE'
  | 'MODIFY_FILE'
  | 'DELETE_FILE'
  | 'MOVE_FILE'
  | 'CREATE_DIRECTORY'
  | 'DELETE_DIRECTORY'
  | 'NO_CHANGE';

export type World2ChangeImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type World2ChangeSetEligibilityState =
  | 'READY'
  | 'READY_WITH_WARNINGS'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface World2ChangeOperation {
  readOnly: true;
  operationId: string;
  operationType: World2ChangeOperationType;
  targetPath: string;
  reason: string;
  allowed: boolean;
  requiresVerification: boolean;
  requiresRollback: boolean;
  riskLevel: ExecutionPlanRiskLevel;
  blockReason: string | null;
}

export interface World2ChangeSet {
  readOnly: true;
  changeSetId: string;
  workspaceId: string;
  sourcePlanId: string;
  operations: World2ChangeOperation[];
  riskLevel: ExecutionPlanRiskLevel;
  estimatedImpact: World2ChangeImpactLevel;
  verificationRequirements: string[];
  rollbackRequirements: string[];
}

export interface World2ChangeSetInputSnapshot {
  disposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  engineAssessment: World2ExecutionEngineAssessment;
  plan: ExecutionPlan | null;
  missingAuthorities: string[];
}

export interface World2ChangeSetAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  assessmentId: string;
  eligibilityState: World2ChangeSetEligibilityState;
  inputSnapshot: World2ChangeSetInputSnapshot;
  changeSet: World2ChangeSet | null;
  blockedOperations: World2ChangeOperation[];
  warningReasons: string[];
  blockingReasons: string[];
  cacheKey: string;
}

export interface World2ChangeSetReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2ChangeSetAssessment;
  passToken: string;
}

export interface AssessWorld2ChangeSetAuthorityInput extends AssessWorld2DisposableWorkspaceInput {
  disposableWorkspaceAssessment?: World2DisposableWorkspaceAssessment;
}

export interface World2ChangeSetHistorySummary {
  totalAssessments: number;
  changeSetsGenerated: number;
  blockedOperationsCount: number;
  warningChangeSets: number;
  criticalChangeSets: number;
}

export interface ChangeOperationSafetyInput {
  operationType: World2ChangeOperationType;
  targetPath: string;
  forbiddenPaths?: readonly string[];
  deleteCountInSet?: number;
}

export interface ChangeOperationSafetyResult {
  allowed: boolean;
  blockReason: string | null;
}

export interface ChangeSetImpactInput {
  operations: World2ChangeOperation[];
  planRiskLevel: ExecutionPlanRiskLevel;
  rollbackComplexity: number;
}
