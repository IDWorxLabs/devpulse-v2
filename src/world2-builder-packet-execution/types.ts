/**
 * DevPulse V2 Phase 15.2 — World 2 Builder Packet Execution types.
 * Preparation only — no file writes, no apply, no shell commands.
 */

export const WORLD2_BUILDER_PACKET_EXECUTION_PASS_TOKEN = 'WORLD2_BUILDER_PACKET_EXECUTION_V1_PASS';
export const WORLD2_BUILDER_PACKET_EXECUTION_OWNER_MODULE = 'devpulse_v2_world2_builder_packet_execution';

export type BuilderPacketRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BuilderPacketStepType =
  | 'READ_CONTEXT'
  | 'PLAN_CHANGE'
  | 'GENERATE_CODE_PROPOSAL'
  | 'CREATE_FILE_PROPOSAL'
  | 'MODIFY_FILE_PROPOSAL'
  | 'DELETE_FILE_PROPOSAL'
  | 'RUN_TEST_PROPOSAL'
  | 'ROLLBACK_PROPOSAL'
  | 'REPORT_RESULT';

export type BuilderPacketExecutionState = 'BLOCKED' | 'WAITING_APPROVAL' | 'READY_FOR_CONTROLLED_APPLY';

export const ALLOWED_PHASE_15_2_STEP_TYPES: readonly BuilderPacketStepType[] = [
  'READ_CONTEXT',
  'PLAN_CHANGE',
  'GENERATE_CODE_PROPOSAL',
  'CREATE_FILE_PROPOSAL',
  'MODIFY_FILE_PROPOSAL',
  'RUN_TEST_PROPOSAL',
  'REPORT_RESULT',
] as const;

export const BLOCKED_PHASE_15_2_STEP_TYPES: readonly BuilderPacketStepType[] = [
  'DELETE_FILE_PROPOSAL',
  'ROLLBACK_PROPOSAL',
] as const;

export const VALID_ACTIVATION_STATES = [
  'EXECUTION_READY',
  'AWAITING_APPROVAL',
  'WAITING_APPROVAL',
  'READY_FOR_FUTURE_ACTIVATION',
] as const;

export const FORBIDDEN_BUILDER_PACKET_DUPLICATES = [
  'world2_executor',
  'world2_runtime_executor',
  'builder_packet_runtime_authority',
  'world2_apply_engine',
  'world2_runtime_brain',
  'execution_brain',
] as const;

export const BUILDER_PACKET_QUESTION_SIGNALS = [
  'builder packet execute',
  'can this builder packet execute',
  'prepare builder packet execution',
  'why is this builder packet blocked',
  'what approvals are needed before world 2 builds',
  'show world 2 execution packet',
  'builder packet execution',
  'world 2 execution packet',
  'packet readiness',
  'builder packet approval',
  'world 2 build preparation',
] as const;

export interface BuilderPacketRawStep {
  stepId?: string;
  title: string;
  description: string;
  targetArea: string;
  stepType: BuilderPacketStepType;
}

export interface BuilderPacket {
  builderPacketId: string;
  projectId: string;
  workspaceId: string;
  sourcePlanId: string;
  executionIntent: string;
  targetWorld: 'WORLD_2' | 'WORLD_1';
  steps: BuilderPacketRawStep[];
}

export interface BuilderPacketExecutionStep {
  stepId: string;
  title: string;
  description: string;
  targetArea: string;
  stepType: BuilderPacketStepType;
  riskLevel: BuilderPacketRiskLevel;
  requiresApproval: boolean;
  allowedInThisPhase: boolean;
  blockedReason: string | null;
}

export interface BuilderPacketExecutionPacket {
  builderPacketId: string;
  projectId: string;
  workspaceId: string;
  sourcePlanId: string;
  executionIntent: string;
  steps: BuilderPacketExecutionStep[];
  riskLevel: BuilderPacketRiskLevel;
  requiredApprovals: string[];
  blockedReasons: string[];
  warnings: string[];
  executionAllowed: false;
  simulationOnly: true;
  createdAt: number;
}

export interface BuilderPacketExecutionReport {
  reportId: string;
  state: BuilderPacketExecutionState;
  valid: boolean;
  summary: string;
  packet: BuilderPacketExecutionPacket | null;
  taskGovernorRequirementRecorded: boolean;
  founderApprovalRequirementRecorded: boolean;
  preparationOnly: true;
}

export interface BuilderPacketExecutionDiagnostics {
  builderPacketExecutionActive: boolean;
  executionPacketCount: number;
  blockedPacketCount: number;
  readyForControlledApplyCount: number;
  lastQuery: string | null;
  lastState: BuilderPacketExecutionState | null;
}

export interface PrepareBuilderPacketExecutionInput {
  query?: string;
  builderPacket: BuilderPacket | null;
  activationExists: boolean;
  activationState: string | null;
  activationId: string | null;
  world2Isolated: boolean;
  world1Protected: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
}

export interface PrepareBuilderPacketExecutionResult {
  executionPacket: BuilderPacketExecutionPacket | null;
  executionReport: BuilderPacketExecutionReport;
  diagnostics: BuilderPacketExecutionDiagnostics;
  responseText: string;
}

export function isWorld2BuilderPacketExecutionQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (
    lower.includes('runtime verification') &&
    !lower.includes('builder packet') &&
    !lower.includes('execution packet')
  ) {
    return false;
  }

  if (
    (lower.includes('activate world 2') || lower.includes('world 2 activation')) &&
    !lower.includes('builder packet') &&
    !lower.includes('execution packet')
  ) {
    return false;
  }

  return BUILDER_PACKET_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isWorld2BuilderPacketExecutionAdvisoryQuestion(question: string): boolean {
  return isWorld2BuilderPacketExecutionQuestion(question);
}

export function isDuplicateBuilderPacketExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('world2_executor') ||
    lower.includes('world2 executor') ||
    lower.includes('world2_apply_engine') ||
    lower.includes('builder_packet_runtime_authority')
  );
}
