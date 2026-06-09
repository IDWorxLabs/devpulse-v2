/**
 * DevPulse V2 Phase 15.3 — World 2 Controlled Apply Runtime types.
 * Apply plans only — no file writes, no apply operations.
 */

import type { BuilderPacketExecutionPacket } from '../world2-builder-packet-execution/types.js';

export const WORLD2_CONTROLLED_APPLY_RUNTIME_PASS_TOKEN = 'WORLD2_CONTROLLED_APPLY_RUNTIME_V1_PASS';
export const WORLD2_CONTROLLED_APPLY_RUNTIME_OWNER_MODULE = 'devpulse_v2_world2_controlled_apply_runtime';

export type ControlledApplyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ControlledApplyState = 'BLOCKED' | 'WAITING_APPROVAL' | 'READY_FOR_FUTURE_APPLY' | 'REJECTED';
export type ControlledApplyApprovalLevel = 'NONE' | 'TASK_GOVERNOR' | 'FOUNDER' | 'CONSTITUTION' | 'MULTI_GATE';

export const FORBIDDEN_CONTROLLED_APPLY_DUPLICATES = [
  'world2_executor',
  'world2_runtime_executor',
  'world2_apply_engine',
  'world2_write_engine',
  'world2_autonomous_modifier',
  'runtime_brain',
  'builder_packet_runtime_authority',
] as const;

export const CONTROLLED_APPLY_QUESTION_SIGNALS = [
  'can this apply',
  'why is apply blocked',
  'what approvals are required',
  'show apply plan',
  'what would world 2 need before apply',
  'controlled apply',
  'apply plan',
  'world 2 apply',
  'apply readiness',
  'apply approval',
  'future apply',
] as const;

export interface ControlledApplyStep {
  stepId: string;
  title: string;
  sourceExecutionStep: string;
  targetArea: string;
  riskLevel: ControlledApplyRiskLevel;
  approvalLevel: ControlledApplyApprovalLevel;
  applyState: ControlledApplyState;
  blockedReason: string | null;
}

export interface ControlledApplyPlan {
  applyPlanId: string;
  executionPacketId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: ControlledApplyRiskLevel;
  approvalRequirements: string[];
  blockedReasons: string[];
  warnings: string[];
  applySteps: ControlledApplyStep[];
  simulationOnly: true;
  applyAllowed: false;
  createdAt: number;
}

export interface ControlledApplyReport {
  reportId: string;
  state: ControlledApplyState;
  valid: boolean;
  summary: string;
  plan: ControlledApplyPlan | null;
  gatesEvaluated: number;
  gatesPassed: number;
  preparationOnly: true;
}

export interface ControlledApplyDiagnostics {
  controlledApplyRuntimeActive: boolean;
  applyPlanCount: number;
  blockedApplyCount: number;
  readyForFutureApplyCount: number;
  lastQuery: string | null;
  lastState: ControlledApplyState | null;
}

export interface PrepareControlledApplyPlanInput {
  query?: string;
  executionPacket: BuilderPacketExecutionPacket | null;
  activationExists: boolean;
  activationState: string | null;
  activationId: string | null;
  builderPacketValid: boolean;
  world2Isolated: boolean;
  world1Protected: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  runtimeVerificationPassed: boolean;
  duplicateAuthorityDetected: boolean;
  targetWorld: 'WORLD_1' | 'WORLD_2';
}

export interface PrepareControlledApplyPlanResult {
  controlledApplyPlan: ControlledApplyPlan | null;
  controlledApplyReport: ControlledApplyReport;
  diagnostics: ControlledApplyDiagnostics;
  responseText: string;
}

export function isWorld2ControlledApplyQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (
    (lower.includes('builder packet') || lower.includes('execution packet')) &&
    !lower.includes('apply')
  ) {
    return false;
  }

  if (
    lower.includes('activate world 2') &&
    !lower.includes('apply') &&
    !lower.includes('before apply')
  ) {
    return false;
  }

  return CONTROLLED_APPLY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isWorld2ControlledApplyAdvisoryQuestion(question: string): boolean {
  return isWorld2ControlledApplyQuestion(question);
}

export function isDuplicateControlledApplyExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('world2_apply_engine') ||
    lower.includes('world2_write_engine') ||
    lower.includes('world2_autonomous_modifier') ||
    lower.includes('world2_executor')
  );
}
