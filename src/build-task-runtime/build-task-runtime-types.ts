/**
 * DevPulse V2 Phase 14.2 — Build Task Runtime Foundation types.
 * Planning only — no execution, file writes, or code generation.
 */

import type { ExecutionPacket } from '../execution-runtime/execution-runtime-types.js';

export const BUILD_TASK_RUNTIME_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_BUILD_TASK_RUNTIME_FOUNDATION_V1_PASS';
export const BUILD_TASK_RUNTIME_OWNER_MODULE = 'devpulse_v2_build_task_runtime';

export type BuildTaskState =
  | 'DRAFT'
  | 'PLANNED'
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'SIMULATION_ONLY'
  | 'READY_FOR_FUTURE_EXECUTION';

export type BuildTaskConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface BuildTaskRequest {
  requestId: string;
  query: string;
  title: string;
  goal: string;
  requestedOutcome: string;
  sourceSystem: string;
  planningOnly: true;
}

export interface BuildTaskStep {
  stepId: string;
  order: number;
  title: string;
  description: string;
  dependencyRefs: string[];
  safetyGateRefs: string[];
  verificationRef: string | null;
  simulationOnly: true;
}

export interface BuildTaskDependency {
  dependencyId: string;
  name: string;
  sourceSystem: string;
  required: boolean;
  satisfied: boolean;
  reason: string;
  planningOnly: true;
}

export interface BuildTaskSafetyGate {
  gateId: string;
  name: string;
  description: string;
  required: boolean;
  passed: boolean;
  sourceSystem: string;
  planningOnly: true;
}

export interface BuildTaskVerificationPlan {
  planId: string;
  checks: string[];
  rollbackConsiderations: string[];
  proofCriteria: string[];
  simulationOnly: true;
}

export interface BuildTaskPlan {
  taskId: string;
  title: string;
  description: string;
  goal: string;
  sourceSystem: string;
  requestedOutcome: string;
  state: BuildTaskState;
  steps: BuildTaskStep[];
  dependencies: BuildTaskDependency[];
  safetyGates: BuildTaskSafetyGate[];
  verificationPlan: BuildTaskVerificationPlan;
  executionPacketId: string;
  executionPacket: ExecutionPacket;
  readiness: string;
  blocked: boolean;
  blockers: string[];
  confidence: BuildTaskConfidence;
  rollbackConsiderations: string[];
  planningOnly: true;
}

export interface BuildTaskRuntimeDiagnostics {
  buildTaskRuntimeActive: boolean;
  buildTaskCount: number;
  blockedTaskCount: number;
  readyForFutureExecutionCount: number;
  lastBuildTaskQuery: string | null;
  lastBuildTaskReadiness: string | null;
}

export interface BuildTaskRuntimeResult {
  query: string;
  request: BuildTaskRequest;
  plan: BuildTaskPlan;
  responseText: string;
}

export const BUILD_TASK_QUESTION_SIGNALS = [
  'build task',
  'task plan',
  'plan the build',
  'what steps would',
  'what steps does',
  'what steps will',
  'what steps are',
  'how would you build',
  'build sequence',
  'implementation plan',
  'plan this build',
  'build plan',
  'blocking this task',
  'build task execute',
  'dependencies would this build',
  'safety gates are required',
  'verification would prove',
  'what would you build',
  'what dependencies would this build',
  'what is blocking this task',
] as const;

export const FORBIDDEN_BUILD_TASK_RUNTIME_DUPLICATES = [
  'build_brain',
  'task_brain',
  'execution_brain',
  'runtime_brain',
  'brain_v2',
  'apply_engine',
  'code_generation_runtime',
  'task_runtime',
  'build_runtime',
  'task_planning_runtime',
] as const;

export const BUILD_TASK_INPUT_SOURCES = [
  'execution_runtime',
  'unified_decision_layer',
  'dependency_intelligence',
  'workspace_intelligence',
  'project_understanding_engine',
  'action_visibility_engine',
  'reasoning_visibility_engine',
  'failure_visibility_engine',
  'learning_visibility_engine',
  'progress_intelligence',
] as const;

export function isBuildTaskRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (
    lower.includes('what should we build next') ||
    lower.includes('build next') ||
    lower === 'what should we build'
  ) {
    return false;
  }

  if (
    lower.includes('execution readiness') ||
    lower.includes('is execution allowed') ||
    lower.includes('can we execute') ||
    (lower.includes('execution blocked') && !lower.includes('build task'))
  ) {
    return false;
  }

  return BUILD_TASK_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateBuildTaskBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('build brain') ||
    lower.includes('task brain') ||
    lower.includes('new build runtime') ||
    lower.includes('create build_brain') ||
    lower.includes('code_generation_runtime') ||
    lower.includes('task_planning_runtime')
  );
}

export function isBuildTaskPlanningAdvisoryQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    isBuildTaskRuntimeFoundationQuestion(question) ||
    (lower.includes('implementation plan') && !lower.includes('what should we build'))
  );
}
