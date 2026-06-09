/**
 * DevPulse V2 Phase 14.5 — Auto-Fix Runtime Foundation types.
 * Fix planning and proposals only — no fix application or file modification.
 */

import type { CodeGenerationPlan } from '../code-generation-runtime/code-generation-runtime-types.js';
import type { BuildTaskPlan } from '../build-task-runtime/build-task-runtime-types.js';
import type { ExecutionPacket } from '../execution-runtime/execution-runtime-types.js';
import type { TestingPlan } from '../testing-runtime/testing-runtime-types.js';
import type { FailureRecord } from '../failure-visibility-engine/failure-visibility-types.js';

export const AUTO_FIX_RUNTIME_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_AUTO_FIX_RUNTIME_FOUNDATION_V1_PASS';
export const AUTO_FIX_RUNTIME_OWNER_MODULE = 'devpulse_v2_auto_fix_runtime';

export type AutoFixState =
  | 'DRAFT'
  | 'PROPOSED'
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'SIMULATION_ONLY'
  | 'READY_FOR_FUTURE_FIXING';

export type AutoFixConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type SimulatedFixStatus = 'SUCCESS' | 'FAIL' | 'SKIPPED' | 'NOT_APPLIED';

export interface AutoFixRequest {
  requestId: string;
  query: string;
  title: string;
  problemSummary: string;
  requestedOutcome: string;
  sourceSystem: string;
  planningOnly: true;
}

export interface FixProposal {
  proposalId: string;
  title: string;
  description: string;
  targetProblem: string;
  recommended: boolean;
  applied: false;
  simulationOnly: true;
}

export interface FixAlternative {
  alternativeId: string;
  title: string;
  description: string;
  tradeoff: string;
  rank: number;
  simulationOnly: true;
}

export interface FixRisk {
  riskId: string;
  summary: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceSystem: string;
  simulationOnly: true;
}

export interface FixRollbackPlan {
  rollbackId: string;
  steps: string[];
  prerequisites: string[];
  simulationOnly: true;
}

export interface FixVerificationPlan {
  verificationId: string;
  proofCriteria: string[];
  checks: string[];
  simulationOnly: true;
}

export interface SimulatedFixResult {
  resultId: string;
  proposalId: string;
  title: string;
  status: SimulatedFixStatus;
  summary: string;
  evidenceNote: string;
  applied: false;
  simulationOnly: true;
}

export interface AutoFixPlan {
  fixId: string;
  title: string;
  description: string;
  problemSummary: string;
  sourceSystem: string;
  state: AutoFixState;
  linkedFailureIds: string[];
  linkedTestingId: string;
  linkedGenerationId: string;
  linkedBuildTaskId: string;
  linkedExecutionId: string;
  failureRecords: FailureRecord[];
  testingPlan: TestingPlan;
  codeGenerationPlan: CodeGenerationPlan;
  buildTaskPlan: BuildTaskPlan;
  executionPacket: ExecutionPacket;
  fixProposals: FixProposal[];
  alternatives: FixAlternative[];
  rollbackPlan: FixRollbackPlan;
  verificationPlan: FixVerificationPlan;
  simulatedResults: SimulatedFixResult[];
  risks: FixRisk[];
  readiness: string;
  blocked: boolean;
  blockers: string[];
  confidence: AutoFixConfidence;
  planningOnly: true;
}

export interface AutoFixRuntimeDiagnostics {
  autoFixRuntimeActive: boolean;
  autoFixPlanCount: number;
  blockedFixCount: number;
  readyForFutureFixingCount: number;
  lastFixQuery: string | null;
  lastFixReadiness: string | null;
}

export interface AutoFixRuntimeResult {
  query: string;
  request: AutoFixRequest;
  plan: AutoFixPlan;
  responseText: string;
}

export const AUTO_FIX_QUESTION_SIGNALS = [
  'auto fix',
  'auto-fix',
  'recommended fix',
  'how would you fix',
  'how would we fix',
  'repair plan',
  'rollback plan',
  'alternative fixes',
  'alternative fix',
  'alternatives exist',
  'what alternatives',
  'fix proposal',
  'what fix is recommended',
  'what fix would',
  'what rollback',
  'what verification would prove the fix',
  'can auto-fix run',
  'can auto fix run',
  'blocking auto-fix',
  'blocking auto fix',
  'what is blocking auto-fix',
  'what risks exist',
  'fix risks',
] as const;

export const FORBIDDEN_AUTO_FIX_RUNTIME_DUPLICATES = [
  'auto_fix_brain',
  'repair_brain',
  'fix_brain',
  'execution_brain',
  'runtime_brain',
  'brain_v2',
  'apply_engine',
  'repair_execution_runtime',
  'fix_runtime',
  'fix_planning_runtime',
  'repair_runtime',
] as const;

export const AUTO_FIX_INPUT_SOURCES = [
  'execution_runtime',
  'build_task_runtime',
  'code_generation_runtime',
  'testing_runtime',
  'failure_visibility_engine',
  'learning_visibility_engine',
  'reasoning_visibility_engine',
  'action_visibility_engine',
  'unified_decision_layer',
  'dependency_intelligence',
  'workspace_intelligence',
  'project_understanding_engine',
  'progress_intelligence',
] as const;

export function isAutoFixRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (lower.includes('what should we build next') || lower.includes('build next')) {
    return false;
  }

  if (
    lower.includes('execution readiness') ||
    lower.includes('is execution allowed') ||
    lower.includes('can we execute')
  ) {
    return false;
  }

  if (
    (lower.includes('generate code') || lower.includes('code generation')) &&
    !lower.includes('fix') &&
    !lower.includes('repair')
  ) {
    return false;
  }

  if (
    (lower.includes('how would we test') || lower.includes('test plan')) &&
    !lower.includes('fix') &&
    !lower.includes('repair')
  ) {
    return false;
  }

  if (
    (lower.includes('plan the build') || lower.includes('build task')) &&
    !lower.includes('fix') &&
    !lower.includes('repair')
  ) {
    return false;
  }

  return AUTO_FIX_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateAutoFixBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('auto fix brain') ||
    lower.includes('auto_fix_brain') ||
    lower.includes('fix_brain') ||
    lower.includes('repair_brain') ||
    lower.includes('apply_engine') ||
    lower.includes('new auto fix runtime duplicate')
  );
}

export function isAutoFixPlanningAdvisoryQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    isAutoFixRuntimeFoundationQuestion(question) ||
    (lower.includes('how would you fix') && !lower.includes('execute'))
  );
}
