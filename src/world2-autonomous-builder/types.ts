/** DevPulse V2 World 2 Autonomous Builder Foundation — types. */

import type { ExecutionStage, StageType } from '../world2-execution-planner/types.js';
import type {
  ConfidenceLevel,
  LikelihoodLevel,
  RollbackForecast,
  SimulatedRisk,
  VerificationForecast,
} from '../world2-simulation-runtime/types.js';

export type BuilderState =
  | 'BUILDER_REQUEST_RECEIVED'
  | 'OWNERSHIP_VALIDATED'
  | 'SIMULATION_VALIDATED'
  | 'GOVERNANCE_VALIDATED'
  | 'WORKSPACE_ISOLATION_VALIDATED'
  | 'ACTIONS_PREPARED'
  | 'RISKS_CONTROLLED'
  | 'APPROVALS_REQUIRED'
  | 'VERIFICATION_REQUIREMENTS_CREATED'
  | 'ROLLBACK_REQUIREMENTS_CREATED'
  | 'DRY_RUN_READY'
  | 'BLOCKED';

export type BuildReadiness =
  | 'NOT_READY'
  | 'NEEDS_APPROVAL'
  | 'READY_FOR_DRY_RUN'
  | 'READY_FOR_GATED_EXECUTION_FUTURE';

export type ActionType =
  | 'CREATE_FILE_PROPOSED'
  | 'MODIFY_FILE_PROPOSED'
  | 'DELETE_FILE_PROPOSED'
  | 'INSTALL_DEPENDENCY_PROPOSED'
  | 'RUN_COMMAND_PROPOSED'
  | 'CREATE_TEST_PROPOSED'
  | 'RUN_VERIFICATION_PROPOSED'
  | 'CREATE_ROLLBACK_POINT_PROPOSED'
  | 'UPDATE_PROJECT_MEMORY_PROPOSED'
  | 'UPDATE_WORKSPACE_STATE_PROPOSED';

export type GovernanceStatus = 'VALIDATED' | 'PENDING' | 'FAILED';

export type WorkspaceIsolationStatus = 'ISOLATED' | 'BOUNDARY_VIOLATION' | 'UNKNOWN';

export type ProtectionStatus = 'PROTECTED' | 'VIOLATION_DETECTED';

export interface BuilderInput {
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  approvedByFounder: boolean;
  simulationPassed: boolean;
  simulationConfidence: ConfidenceLevel;
  completionLikelihood: LikelihoodLevel;
  executionStages: ExecutionStage[];
  verificationForecasts: VerificationForecast[];
  rollbackForecasts: RollbackForecast[];
  riskForecasts: SimulatedRisk[];
  workspaceIsolationStatus: WorkspaceIsolationStatus;
  governanceStatus: GovernanceStatus;
}

export interface PreparedAction {
  actionId: string;
  actionType: ActionType;
  stageType: StageType;
  description: string;
  targetPath: string;
  requiresApproval: boolean;
  dryRunOnly: true;
  executed: false;
}

export interface BlockedAction {
  actionId: string;
  actionType: ActionType;
  stageType: StageType;
  description: string;
  blockReason: string;
}

export interface ApprovalRequirement {
  requirementId: string;
  actionType: ActionType;
  description: string;
  founderApprovalRequired: boolean;
  satisfied: boolean;
}

export interface VerificationRequirement {
  requirementId: string;
  pointId: string;
  stageType: StageType;
  description: string;
  forecastResult: VerificationForecast['forecastResult'];
  mustPassBeforeExecution: boolean;
}

export interface RollbackRequirement {
  requirementId: string;
  pointId: string;
  stageType: StageType;
  description: string;
  triggerLikelihood: LikelihoodLevel;
  checkpointRequired: boolean;
}

export interface RiskControl {
  controlId: string;
  sourceRiskId: string;
  controlDescription: string;
  likelihood: LikelihoodLevel;
  mitigationRequired: boolean;
}

export interface ProtectionCheck {
  checkId: string;
  checkType: string;
  status: ProtectionStatus;
  description: string;
}

export interface BuilderConfirmation {
  dryRunFoundationOnly: true;
  noWorld1ChangesPerformed: true;
  noFilesModified: true;
  noCommandsExecuted: true;
  noCodeGenerated: true;
  noExecutionPerformed: true;
}

export interface BuilderResult {
  builderId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  buildReadiness: BuildReadiness;
  builderState: BuilderState;
  preparedActions: PreparedAction[];
  blockedActions: BlockedAction[];
  approvalRequirements: ApprovalRequirement[];
  verificationRequirements: VerificationRequirement[];
  rollbackRequirements: RollbackRequirement[];
  riskControls: RiskControl[];
  workspaceProtectionChecks: ProtectionCheck[];
  world1ProtectionChecks: ProtectionCheck[];
  recommendations: string[];
  confirmation: BuilderConfirmation;
  stateSequence: BuilderState[];
  createdAt: number;
}

export interface World2AutonomousBuilderState {
  foundationId: string;
  builderPacketCount: number;
  warnings: string[];
  errors: string[];
}

export interface World2BuilderReport {
  ownerModule: string;
  builderId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  buildReadiness: BuildReadiness;
  builderState: BuilderState;
  preparedActionCount: number;
  blockedActionCount: number;
  approvalRequirementCount: number;
  verificationRequirementCount: number;
  rollbackRequirementCount: number;
  riskControlCount: number;
  world1ProtectionStatus: string;
  workspaceIsolationStatus: string;
  recommendationCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE = 'devpulse_v2_world2_autonomous_builder';
export const WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN =
  'DEVPULSE_V2_WORLD2_AUTONOMOUS_BUILDER_FOUNDATION_V1_PASS';

export const BUILDER_STATE_SEQUENCE: readonly BuilderState[] = [
  'BUILDER_REQUEST_RECEIVED',
  'OWNERSHIP_VALIDATED',
  'SIMULATION_VALIDATED',
  'GOVERNANCE_VALIDATED',
  'WORKSPACE_ISOLATION_VALIDATED',
  'ACTIONS_PREPARED',
  'RISKS_CONTROLLED',
  'APPROVALS_REQUIRED',
  'VERIFICATION_REQUIREMENTS_CREATED',
  'ROLLBACK_REQUIREMENTS_CREATED',
  'DRY_RUN_READY',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_workspace_foundation',
  'world2_execution_planner',
  'world2_simulation_runtime',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'verification_gated_apply',
] as const;

export const DUPLICATE_PATTERNS = [
  'world2_autonomous_builder',
  'autonomous_builder',
  'builder_runtime',
  'build_executor',
  'workspace_builder',
  'world2_builder',
] as const;

export const WORLD1_PROTECTED_DOMAINS = [
  'law_enforcement',
  'foundation_enforcement',
  'execution_authority',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'recovery_chains',
  'verification_gated_apply',
] as const;

export const APPROVAL_REQUIRED_ACTION_TYPES: readonly ActionType[] = [
  'CREATE_FILE_PROPOSED',
  'MODIFY_FILE_PROPOSED',
  'DELETE_FILE_PROPOSED',
  'INSTALL_DEPENDENCY_PROPOSED',
  'RUN_COMMAND_PROPOSED',
  'UPDATE_PROJECT_MEMORY_PROPOSED',
  'UPDATE_WORKSPACE_STATE_PROPOSED',
] as const;

export const BUILD_READINESS_LEVELS: readonly BuildReadiness[] = [
  'NOT_READY',
  'NEEDS_APPROVAL',
  'READY_FOR_DRY_RUN',
  'READY_FOR_GATED_EXECUTION_FUTURE',
] as const;

export const ACTION_TYPES: readonly ActionType[] = [
  'CREATE_FILE_PROPOSED',
  'MODIFY_FILE_PROPOSED',
  'DELETE_FILE_PROPOSED',
  'INSTALL_DEPENDENCY_PROPOSED',
  'RUN_COMMAND_PROPOSED',
  'CREATE_TEST_PROPOSED',
  'RUN_VERIFICATION_PROPOSED',
  'CREATE_ROLLBACK_POINT_PROPOSED',
  'UPDATE_PROJECT_MEMORY_PROPOSED',
  'UPDATE_WORKSPACE_STATE_PROPOSED',
] as const;

