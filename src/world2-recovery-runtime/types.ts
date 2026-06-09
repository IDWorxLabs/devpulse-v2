/**
 * DevPulse V2 Phase 15.5 — World 2 Recovery Runtime types.
 * Recovery plans only — no restore, apply, rollback, or file operations.
 */

import type { ControlledApplyPlan } from '../world2-controlled-apply-runtime/types.js';
import type { RollbackPlan } from '../world2-rollback-runtime/types.js';

export const WORLD2_RECOVERY_RUNTIME_PASS_TOKEN = 'WORLD2_RECOVERY_RUNTIME_V1_PASS';
export const WORLD2_RECOVERY_RUNTIME_OWNER_MODULE = 'devpulse_v2_world2_recovery_runtime';

export const REPEATED_FAILURE_LIMIT = 3;

export type RecoveryRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecoveryState =
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'READY_FOR_FUTURE_RECOVERY'
  | 'ESCALATION_REQUIRED'
  | 'REJECTED';
export type EscalationLevel =
  | 'NONE'
  | 'TASK_GOVERNOR'
  | 'FOUNDER'
  | 'CONSTITUTION'
  | 'SELF_EVOLUTION_REVIEW'
  | 'MULTI_GATE';

export type FailureCategory =
  | 'APPLY_FAILED'
  | 'VERIFY_FAILED'
  | 'ROLLBACK_FAILED'
  | 'WORKSPACE_ISOLATION_FAILED'
  | 'TASK_GOVERNOR_BLOCKED'
  | 'FOUNDER_APPROVAL_MISSING'
  | 'CONSTITUTION_BLOCKED'
  | 'RUNTIME_VERIFICATION_FAILED'
  | 'UNKNOWN_RUNTIME_FAILURE'
  | 'REPEATED_FAILURE_LIMIT_REACHED';

export type RecoveryStrategy =
  | 'STOP_AND_REPORT_PROPOSAL'
  | 'REQUEST_FOUNDER_REVIEW_PROPOSAL'
  | 'RETRY_AFTER_APPROVAL_PROPOSAL'
  | 'REPLAN_EXECUTION_PACKET_PROPOSAL'
  | 'REBUILD_APPLY_PLAN_PROPOSAL'
  | 'REBUILD_ROLLBACK_PLAN_PROPOSAL'
  | 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL'
  | 'MARK_UNSAFE_AND_ABORT_PROPOSAL'
  | 'CREATE_DIAGNOSTIC_REPORT_PROPOSAL'
  | 'STOP_AND_REPORT'
  | 'REQUEST_FOUNDER_REVIEW'
  | 'RETRY_AFTER_APPROVAL'
  | 'REPLAN_EXECUTION_PACKET'
  | 'REBUILD_APPLY_PLAN'
  | 'REBUILD_ROLLBACK_PLAN'
  | 'ESCALATE_TO_SELF_EVOLUTION'
  | 'MARK_UNSAFE_AND_ABORT'
  | 'CREATE_DIAGNOSTIC_REPORT'
  | 'EXECUTE_COMMAND'
  | 'WRITE_FILE'
  | 'DELETE_FILE'
  | 'APPLY_PATCH'
  | 'RUN_TEST'
  | 'GIT_RESET'
  | 'GIT_CHECKOUT';

export const ALLOWED_RECOVERY_STRATEGIES: readonly RecoveryStrategy[] = [
  'STOP_AND_REPORT_PROPOSAL',
  'REQUEST_FOUNDER_REVIEW_PROPOSAL',
  'RETRY_AFTER_APPROVAL_PROPOSAL',
  'REPLAN_EXECUTION_PACKET_PROPOSAL',
  'REBUILD_APPLY_PLAN_PROPOSAL',
  'REBUILD_ROLLBACK_PLAN_PROPOSAL',
  'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL',
  'MARK_UNSAFE_AND_ABORT_PROPOSAL',
  'CREATE_DIAGNOSTIC_REPORT_PROPOSAL',
] as const;

export const BLOCKED_RECOVERY_STRATEGIES: readonly RecoveryStrategy[] = [
  'STOP_AND_REPORT',
  'REQUEST_FOUNDER_REVIEW',
  'RETRY_AFTER_APPROVAL',
  'REPLAN_EXECUTION_PACKET',
  'REBUILD_APPLY_PLAN',
  'REBUILD_ROLLBACK_PLAN',
  'ESCALATE_TO_SELF_EVOLUTION',
  'MARK_UNSAFE_AND_ABORT',
  'CREATE_DIAGNOSTIC_REPORT',
  'EXECUTE_COMMAND',
  'WRITE_FILE',
  'DELETE_FILE',
  'APPLY_PATCH',
  'RUN_TEST',
  'GIT_RESET',
  'GIT_CHECKOUT',
] as const;

export const FORBIDDEN_RECOVERY_DUPLICATES = [
  'world2_executor',
  'world2_runtime_executor',
  'world2_apply_engine',
  'world2_write_engine',
  'world2_autonomous_modifier',
  'world2_recovery_apply_engine',
  'world2_self_healing_executor',
  'runtime_brain',
  'recovery_apply_engine',
  'rollback_apply_engine',
  'world2_recovery_engine',
  'world2_auto_repair_engine',
] as const;

export const RECOVERY_QUESTION_SIGNALS = [
  'what happens if apply fails',
  'what happens if verification fails',
  'what happens if rollback fails',
  'show recovery plan',
  'why is recovery blocked',
  'what recovery strategy is required',
  'should this escalate to self-evolution',
  'what happens after 3 failed attempts',
  'recovery runtime',
  'world 2 recovery',
  'recovery plan',
  'failure recovery',
  'recovery strategy',
  'self evolution escalation',
  'three failure rule',
] as const;

export interface FailureContext {
  failureId: string;
  failurePath: string;
  failureCount: number;
  summary: string;
  sourceSystem: string;
}

export interface RecoveryStep {
  stepId: string;
  title: string;
  targetArea: string;
  recoveryAction: RecoveryStrategy;
  riskLevel: RecoveryRiskLevel;
  escalationLevel: EscalationLevel;
  recoveryState: RecoveryState;
  blockedReason: string | null;
}

export interface RecoveryPlan {
  recoveryPlanId: string;
  rollbackPlanId: string;
  applyPlanId: string;
  executionPacketId: string;
  projectId: string;
  workspaceId: string;
  failureContext: FailureContext;
  failureCategory: FailureCategory;
  recoveryStrategy: RecoveryStrategy;
  escalationLevel: EscalationLevel;
  recoverySteps: RecoveryStep[];
  riskLevel: RecoveryRiskLevel;
  approvalRequirements: string[];
  blockedReasons: string[];
  warnings: string[];
  recoveryAllowed: false;
  simulationOnly: true;
  createdAt: number;
}

export interface RecoveryReport {
  reportId: string;
  state: RecoveryState;
  valid: boolean;
  summary: string;
  plan: RecoveryPlan | null;
  gatesEvaluated: number;
  gatesPassed: number;
  preparationOnly: true;
}

export interface RecoveryDiagnostics {
  recoveryRuntimeActive: boolean;
  recoveryPlanCount: number;
  blockedRecoveryCount: number;
  readyForFutureRecoveryCount: number;
  escalationRequiredCount: number;
  lastQuery: string | null;
  lastState: RecoveryState | null;
}

export interface PrepareRecoveryPlanInput {
  query?: string;
  rollbackPlan: RollbackPlan | null;
  applyPlan: ControlledApplyPlan | null;
  failureContext: FailureContext | null;
  executionPacketLinked: boolean;
  world2Isolated: boolean;
  world1Protected: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  runtimeVerificationPassed: boolean;
  duplicateAuthorityDetected: boolean;
  targetWorld: 'WORLD_1' | 'WORLD_2';
  directRecoveryAttempt: boolean;
  repeatedFailureLimitReached: boolean;
  previousRecoveryStrategies: RecoveryStrategy[];
}

export interface PrepareRecoveryPlanResult {
  recoveryPlan: RecoveryPlan | null;
  recoveryReport: RecoveryReport;
  diagnostics: RecoveryDiagnostics;
  responseText: string;
}

export function isWorld2RecoveryQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (
    (lower.includes('rollback plan') || lower.includes('rollback safety')) &&
    !lower.includes('recovery') &&
    !lower.includes('fails') &&
    !lower.includes('failed')
  ) {
    return false;
  }

  if (
    (lower.includes('can this apply') || lower.includes('apply plan')) &&
    !lower.includes('recovery') &&
    !lower.includes('fails') &&
    !lower.includes('failed')
  ) {
    return false;
  }

  return RECOVERY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isWorld2RecoveryAdvisoryQuestion(question: string): boolean {
  return isWorld2RecoveryQuestion(question);
}

export function isDuplicateRecoveryExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('recovery_apply_engine') ||
    lower.includes('world2_recovery_apply_engine') ||
    lower.includes('world2_self_healing_executor') ||
    lower.includes('world2_auto_repair_engine')
  );
}
