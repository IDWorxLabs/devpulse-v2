/**
 * DevPulse V2 Phase 15.6 — World 2 Completion Runtime types.
 * Completion plans only — no marking complete, no apply, rollback, or recovery.
 */

import type { BuilderPacketExecutionPacket } from '../world2-builder-packet-execution/types.js';
import type { ControlledApplyPlan } from '../world2-controlled-apply-runtime/types.js';
import type { RollbackPlan } from '../world2-rollback-runtime/types.js';
import type { RecoveryPlan } from '../world2-recovery-runtime/types.js';

export const WORLD2_COMPLETION_RUNTIME_PASS_TOKEN = 'WORLD2_COMPLETION_RUNTIME_V1_PASS';
export const WORLD2_COMPLETION_RUNTIME_OWNER_MODULE = 'devpulse_v2_world2_completion_runtime';

export type CompletionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CompletionState =
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'READY_FOR_FUTURE_COMPLETION'
  | 'VERIFICATION_REQUIRED'
  | 'REJECTED';

export type CompletionCriterion =
  | 'PROJECT_GOAL_SATISFIED'
  | 'FEATURES_IMPLEMENTED'
  | 'TESTS_PASS'
  | 'VERIFICATION_PASS'
  | 'NO_CRITICAL_FAILURES'
  | 'NO_OPEN_BLOCKERS'
  | 'ROLLBACK_DEFINED'
  | 'RECOVERY_DEFINED'
  | 'APPROVAL_REQUIREMENTS_SATISFIED'
  | 'WORLD1_PROTECTION_PRESERVED';

export type CompletionEvidenceType =
  | 'PROJECT_EVIDENCE'
  | 'FEATURE_EVIDENCE'
  | 'TEST_EVIDENCE'
  | 'VERIFICATION_EVIDENCE'
  | 'APPROVAL_EVIDENCE'
  | 'ROLLBACK_EVIDENCE'
  | 'RECOVERY_EVIDENCE'
  | 'RUNTIME_EVIDENCE';

export type VerificationRequirement =
  | 'RUNTIME_VERIFICATION'
  | 'TASK_GOVERNOR'
  | 'CONSTITUTION'
  | 'FOUNDER_APPROVAL'
  | 'ROLLBACK_PLAN_EXISTS'
  | 'RECOVERY_PLAN_EXISTS'
  | 'NO_CRITICAL_RISKS'
  | 'WORKSPACE_ISOLATION'
  | 'WORLD1_PROTECTION'
  | 'DUPLICATE_AUTHORITY_DETECTION';

export const FORBIDDEN_COMPLETION_DUPLICATES = [
  'world2_executor',
  'world2_runtime_executor',
  'world2_apply_engine',
  'world2_write_engine',
  'world2_completion_executor',
  'world2_autonomous_modifier',
  'runtime_brain',
  'completion_apply_engine',
  'completion_authority',
] as const;

export const COMPLETION_QUESTION_SIGNALS = [
  'what defines completion',
  'how do we know this project is done',
  'show completion plan',
  'what evidence is missing',
  'why is completion blocked',
  'what verification is still required',
  'completion runtime',
  'world 2 completion',
  'completion plan',
  'completion criteria',
  'completion evidence',
  'project done',
  'verification required',
  'what does success look like',
  'how do we know the project is complete',
  'what evidence proves completion',
  'what conditions block completion',
] as const;

export interface ProjectContext {
  projectId: string;
  projectName: string;
  goalSummary: string;
}

export interface CompletionEvidence {
  evidenceId: string;
  evidenceType: CompletionEvidenceType;
  summary: string;
  sourceSystem: string;
  satisfied: boolean;
}

export interface CompletionPlan {
  completionPlanId: string;
  projectId: string;
  executionPacketId: string;
  applyPlanId: string;
  rollbackPlanId: string;
  recoveryPlanId: string;
  completionCriteria: CompletionCriterion[];
  completionEvidence: CompletionEvidence[];
  verificationRequirements: VerificationRequirement[];
  riskLevel: CompletionRiskLevel;
  approvalRequirements: string[];
  blockedReasons: string[];
  warnings: string[];
  completionAllowed: false;
  simulationOnly: true;
  createdAt: number;
}

export interface CompletionReport {
  reportId: string;
  state: CompletionState;
  valid: boolean;
  summary: string;
  plan: CompletionPlan | null;
  gatesEvaluated: number;
  gatesPassed: number;
  preparationOnly: true;
}

export interface CompletionDiagnostics {
  completionRuntimeActive: boolean;
  completionPlanCount: number;
  blockedCompletionCount: number;
  readyForFutureCompletionCount: number;
  verificationRequiredCount: number;
  lastQuery: string | null;
  lastState: CompletionState | null;
}

export interface PrepareCompletionPlanInput {
  query?: string;
  recoveryPlan: RecoveryPlan | null;
  rollbackPlan: RollbackPlan | null;
  applyPlan: ControlledApplyPlan | null;
  executionPacket: BuilderPacketExecutionPacket | null;
  projectContext: ProjectContext | null;
  evidenceProvided: boolean;
  verificationRequirementsMet: boolean;
  world2Isolated: boolean;
  world1Protected: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  runtimeVerificationPassed: boolean;
  duplicateAuthorityDetected: boolean;
  targetWorld: 'WORLD_1' | 'WORLD_2';
  markCompleteAttempt: boolean;
  noCriticalFailures: boolean;
}

export interface PrepareCompletionPlanResult {
  completionPlan: CompletionPlan | null;
  completionReport: CompletionReport;
  diagnostics: CompletionDiagnostics;
  responseText: string;
}

export function isWorld2CompletionQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (
    (lower.includes('recovery plan') || lower.includes('recovery strategy')) &&
    !lower.includes('completion') &&
    !lower.includes('done') &&
    !lower.includes('complete')
  ) {
    return false;
  }

  if (
    (lower.includes('rollback plan') || lower.includes('rollback safety')) &&
    !lower.includes('completion') &&
    !lower.includes('done') &&
    !lower.includes('complete')
  ) {
    return false;
  }

  return COMPLETION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isWorld2CompletionAdvisoryQuestion(question: string): boolean {
  return isWorld2CompletionQuestion(question);
}

export function isDuplicateCompletionExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('completion_apply_engine') ||
    lower.includes('completion_authority') ||
    lower.includes('world2_completion_executor')
  );
}
