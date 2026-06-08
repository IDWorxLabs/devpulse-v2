/** DevPulse V2 World 2 Execution Planner — types. */

export type PlanningState =
  | 'PLAN_REQUEST_RECEIVED'
  | 'PLAN_ANALYZED'
  | 'DEPENDENCIES_MAPPED'
  | 'RISKS_IDENTIFIED'
  | 'VERIFICATION_POINTS_CREATED'
  | 'ROLLBACK_POINTS_CREATED'
  | 'PLAN_GENERATED'
  | 'PLAN_READY';

export type StageType =
  | 'DISCOVERY'
  | 'ARCHITECTURE'
  | 'IMPLEMENTATION'
  | 'VERIFICATION'
  | 'STABILIZATION'
  | 'COMPLETION';

export type PlannerRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VerificationPointType =
  | 'phaseComplete'
  | 'dependencyValidated'
  | 'requirementsSatisfied'
  | 'governanceApproved';

export type RollbackPointType =
  | 'checkpointCreated'
  | 'checkpointRecommended'
  | 'checkpointRequired';

export type CompletionCriterionType =
  | 'requirementsMet'
  | 'verificationPassed'
  | 'governanceSatisfied'
  | 'workspaceReady';

export interface PlannerInput {
  projectGoal: string;
  projectVision: string;
  projectType: string;
  workspaceId: string;
  projectId: string;
  constraints: string[];
  requirements: string[];
}

export interface ExecutionStage {
  stageOrder: number;
  stageType: StageType;
  stageName: string;
  description: string;
  dependsOn: StageType[];
}

export interface RiskItem {
  riskId: string;
  riskLevel: PlannerRiskLevel;
  description: string;
  mitigation: string;
}

export interface VerificationPoint {
  pointId: string;
  pointType: VerificationPointType;
  stageType: StageType;
  description: string;
}

export interface RollbackPoint {
  pointId: string;
  pointType: RollbackPointType;
  stageType: StageType;
  description: string;
}

export interface CompletionCriterion {
  criterionId: string;
  criterionType: CompletionCriterionType;
  description: string;
}

export interface ExecutionPlan {
  planId: string;
  workspaceId: string;
  projectId: string;
  projectGoal: string;
  executionStages: ExecutionStage[];
  riskItems: RiskItem[];
  verificationPoints: VerificationPoint[];
  rollbackPoints: RollbackPoint[];
  completionCriteria: CompletionCriterion[];
  nextRecommendedStep: string;
  stateSequence: PlanningState[];
  createdAt: number;
  planningOnlyConfirmed: true;
  noExecutionOccurred: true;
  noFilesModified: true;
  noCodeGenerated: true;
}

export interface World2ExecutionPlannerState {
  plannerId: string;
  planCount: number;
  warnings: string[];
  errors: string[];
}

export interface World2PlannerReport {
  ownerModule: string;
  planId: string;
  workspaceId: string;
  projectId: string;
  stageCount: number;
  riskCount: number;
  verificationCount: number;
  rollbackCount: number;
  completionCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const WORLD2_EXECUTION_PLANNER_OWNER_MODULE = 'devpulse_v2_world2_execution_planner';
export const WORLD2_EXECUTION_PLANNER_PASS_TOKEN = 'DEVPULSE_V2_WORLD2_EXECUTION_PLANNER_V1_PASS';

export const STAGE_ORDER: readonly StageType[] = [
  'DISCOVERY',
  'ARCHITECTURE',
  'IMPLEMENTATION',
  'VERIFICATION',
  'STABILIZATION',
  'COMPLETION',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_workspace_foundation',
  'execution_authority',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'recovery_chains',
  'verification_gated_apply',
] as const;

export const DUPLICATE_PATTERNS = [
  'execution_planner',
  'planning_engine',
  'build_planner',
  'autonomous_planner',
  'project_planner',
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

export const PLANNING_STATE_SEQUENCE: readonly PlanningState[] = [
  'PLAN_REQUEST_RECEIVED',
  'PLAN_ANALYZED',
  'DEPENDENCIES_MAPPED',
  'RISKS_IDENTIFIED',
  'VERIFICATION_POINTS_CREATED',
  'ROLLBACK_POINTS_CREATED',
  'PLAN_GENERATED',
  'PLAN_READY',
] as const;
