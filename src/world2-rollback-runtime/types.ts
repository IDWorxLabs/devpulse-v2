/**
 * DevPulse V2 Phase 15.4 — World 2 Rollback Runtime types.
 * Rollback plans only — no restore, no git, no file operations.
 */

import type { ControlledApplyPlan } from '../world2-controlled-apply-runtime/types.js';

export const WORLD2_ROLLBACK_RUNTIME_PASS_TOKEN = 'WORLD2_ROLLBACK_RUNTIME_V1_PASS';
export const WORLD2_ROLLBACK_RUNTIME_OWNER_MODULE = 'devpulse_v2_world2_rollback_runtime';

export type RollbackRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RollbackState = 'BLOCKED' | 'WAITING_APPROVAL' | 'READY_FOR_FUTURE_ROLLBACK' | 'REJECTED';
export type RollbackApprovalLevel = 'NONE' | 'TASK_GOVERNOR' | 'FOUNDER' | 'CONSTITUTION' | 'MULTI_GATE';

export type RollbackAction =
  | 'RESTORE_SNAPSHOT_PROPOSAL'
  | 'REVERT_FILE_PROPOSAL'
  | 'REVERT_DIRECTORY_PROPOSAL'
  | 'UNDO_PATCH_PROPOSAL'
  | 'RESET_TEST_STATE_PROPOSAL'
  | 'RESTORE_DEPENDENCY_STATE_PROPOSAL'
  | 'REPORT_ROLLBACK_RESULT'
  | 'RESTORE_SNAPSHOT'
  | 'REVERT_FILE'
  | 'REVERT_DIRECTORY'
  | 'UNDO_PATCH'
  | 'RESET_TEST_STATE'
  | 'RESTORE_DEPENDENCY_STATE'
  | 'GIT_RESET'
  | 'GIT_CHECKOUT'
  | 'DELETE_FILE'
  | 'EXECUTE_COMMAND';

export type SnapshotRequirement =
  | 'PRE_APPLY_WORKSPACE_SNAPSHOT'
  | 'PRE_APPLY_FILE_MANIFEST'
  | 'PRE_APPLY_DIFF_MANIFEST'
  | 'PRE_APPLY_DEPENDENCY_STATE'
  | 'PRE_APPLY_TEST_BASELINE'
  | 'PRE_APPLY_GIT_REFERENCE';

export const ALLOWED_ROLLBACK_ACTIONS: readonly RollbackAction[] = [
  'RESTORE_SNAPSHOT_PROPOSAL',
  'REVERT_FILE_PROPOSAL',
  'REVERT_DIRECTORY_PROPOSAL',
  'UNDO_PATCH_PROPOSAL',
  'RESET_TEST_STATE_PROPOSAL',
  'RESTORE_DEPENDENCY_STATE_PROPOSAL',
  'REPORT_ROLLBACK_RESULT',
] as const;

export const BLOCKED_ROLLBACK_ACTIONS: readonly RollbackAction[] = [
  'RESTORE_SNAPSHOT',
  'REVERT_FILE',
  'REVERT_DIRECTORY',
  'UNDO_PATCH',
  'RESET_TEST_STATE',
  'RESTORE_DEPENDENCY_STATE',
  'GIT_RESET',
  'GIT_CHECKOUT',
  'DELETE_FILE',
  'EXECUTE_COMMAND',
] as const;

export const FORBIDDEN_ROLLBACK_DUPLICATES = [
  'world2_executor',
  'world2_runtime_executor',
  'world2_apply_engine',
  'world2_write_engine',
  'world2_autonomous_modifier',
  'world2_recovery_engine',
  'runtime_brain',
  'rollback_apply_engine',
  'world2_rollback_apply_engine',
  'world2_git_restore_engine',
] as const;

export const ROLLBACK_QUESTION_SIGNALS = [
  'can world 2 roll back',
  'show rollback plan',
  'what rollback safety is required',
  'why is rollback blocked',
  'what snapshots are required before apply',
  'can this change be reversed',
  'rollback runtime',
  'world 2 rollback',
  'rollback plan',
  'rollback safety',
  'snapshot requirement',
  'change reversal',
] as const;

export interface RollbackStep {
  stepId: string;
  title: string;
  targetArea: string;
  sourceApplyStep: string;
  rollbackAction: RollbackAction;
  riskLevel: RollbackRiskLevel;
  approvalLevel: RollbackApprovalLevel;
  rollbackState: RollbackState;
  blockedReason: string | null;
}

export interface RollbackPlan {
  rollbackPlanId: string;
  applyPlanId: string;
  executionPacketId: string;
  projectId: string;
  workspaceId: string;
  snapshotRequirement: SnapshotRequirement[];
  rollbackSteps: RollbackStep[];
  riskLevel: RollbackRiskLevel;
  approvalRequirements: string[];
  blockedReasons: string[];
  warnings: string[];
  rollbackAllowed: false;
  simulationOnly: true;
  createdAt: number;
}

export interface RollbackReport {
  reportId: string;
  state: RollbackState;
  valid: boolean;
  summary: string;
  plan: RollbackPlan | null;
  gatesEvaluated: number;
  gatesPassed: number;
  preparationOnly: true;
}

export interface RollbackDiagnostics {
  rollbackRuntimeActive: boolean;
  rollbackPlanCount: number;
  blockedRollbackCount: number;
  readyForFutureRollbackCount: number;
  lastQuery: string | null;
  lastState: RollbackState | null;
}

export interface PrepareRollbackPlanInput {
  query?: string;
  applyPlan: ControlledApplyPlan | null;
  executionPacketLinked: boolean;
  world2Isolated: boolean;
  world1Protected: boolean;
  snapshotRequirementsIdentified: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  runtimeVerificationPassed: boolean;
  duplicateAuthorityDetected: boolean;
  targetWorld: 'WORLD_1' | 'WORLD_2';
  directRollbackAttempt: boolean;
}

export interface PrepareRollbackPlanResult {
  rollbackPlan: RollbackPlan | null;
  rollbackReport: RollbackReport;
  diagnostics: RollbackDiagnostics;
  responseText: string;
}

export function isWorld2RollbackQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (
    (lower.includes('can this apply') || lower.includes('apply plan')) &&
    !lower.includes('rollback') &&
    !lower.includes('reversed') &&
    !lower.includes('snapshot')
  ) {
    return false;
  }

  if (
    lower.includes('builder packet') &&
    !lower.includes('rollback') &&
    !lower.includes('reversed')
  ) {
    return false;
  }

  return ROLLBACK_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isWorld2RollbackAdvisoryQuestion(question: string): boolean {
  return isWorld2RollbackQuestion(question);
}

export function isDuplicateRollbackExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('rollback_apply_engine') ||
    lower.includes('world2_recovery_engine') ||
    lower.includes('world2_git_restore_engine') ||
    lower.includes('rollback_apply_engine')
  );
}
