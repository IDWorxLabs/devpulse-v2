/**
 * DevPulse V2 Phase 14.1 — Execution Runtime Foundation types.
 * Readiness and governance only — no execution, file writes, or process spawning.
 */

export const EXECUTION_RUNTIME_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_EXECUTION_RUNTIME_FOUNDATION_V1_PASS';
export const EXECUTION_RUNTIME_OWNER_MODULE = 'devpulse_v2_execution_runtime';

export type ExecutionState =
  | 'NOT_READY'
  | 'READINESS_CHECK'
  | 'READY'
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'SIMULATION_ONLY'
  | 'COMPLETED';

export type ExecutionSafetyStatus = 'SAFE' | 'CAUTION' | 'BLOCKED' | 'FORBIDDEN';

export type ExecutionReadinessLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type ExecutionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ExecutionPlan {
  planId: string;
  title: string;
  description: string;
  sourceSystem: string;
  requestedAction: string;
  prerequisites: string[];
  requiredCapabilities: string[];
  approvalRequired: boolean;
  simulationOnly: true;
}

export interface ExecutionReadinessReport {
  executionAllowed: boolean;
  readinessLevel: ExecutionReadinessLevel;
  readinessScore: number;
  blockers: string[];
  missingDependencies: string[];
  requiredCapabilities: string[];
  approvalRequired: string[];
  safetyStatus: ExecutionSafetyStatus;
  basis: string;
  simulationOnly: true;
}

export interface ExecutionPacket {
  executionId: string;
  title: string;
  description: string;
  sourceSystem: string;
  requestedAction: string;
  state: ExecutionState;
  readiness: ExecutionReadinessReport;
  confidence: ExecutionConfidence;
  blockers: string[];
  safetyStatus: ExecutionSafetyStatus;
  plan: ExecutionPlan;
  simulationOnly: true;
}

export interface ExecutionRuntimeDiagnostics {
  executionRuntimeActive: boolean;
  executionPacketCount: number;
  readyCount: number;
  blockedCount: number;
  readinessScore: number;
  lastExecutionQuery: string | null;
}

export interface ExecutionRuntimeResult {
  query: string;
  packets: ExecutionPacket[];
  primaryPacket: ExecutionPacket;
  responseText: string;
}

export const EXECUTION_RUNTIME_QUESTION_SIGNALS = [
  'execution readiness',
  'is execution allowed',
  'can we execute',
  'execution blocked',
  'why is execution blocked',
  'execution blockers',
  'execution status',
  'execution allowed',
  'approval would be required',
  'capabilities must exist first',
  'missing for execution',
  'readiness evaluation',
  'execution foundation',
  'simulation only',
  'what dependencies are missing',
] as const;

export const FORBIDDEN_EXECUTION_RUNTIME_DUPLICATES = [
  'execution_brain',
  'runtime_brain',
  'brain_v2',
  'apply_engine',
  'world2_execution_runtime',
  'runtime_engine',
  'execution_engine',
  'apply_runtime',
  'task_runtime',
] as const;

export const EXECUTION_RUNTIME_INPUT_SOURCES = [
  'unified_decision_layer',
  'dependency_intelligence',
  'workspace_intelligence',
  'progress_intelligence',
  'failure_visibility_engine',
  'learning_visibility_engine',
  'action_visibility_engine',
  'reasoning_visibility_engine',
] as const;

export function isExecutionRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (!EXECUTION_RUNTIME_QUESTION_SIGNALS.some((s) => lower.includes(s))) {
    return false;
  }

  if (
    lower.includes('what capabilities are blocked') &&
    !lower.includes('execution') &&
    !lower.includes('execute')
  ) {
    return false;
  }

  if (
    (lower.includes('what dependencies are missing') || lower.includes('missing dependenc')) &&
    !lower.includes('execution') &&
    !lower.includes('execute') &&
    !lower.includes('readiness')
  ) {
    return false;
  }

  return true;
}

export function isDuplicateExecutionRuntimeBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('execution brain') ||
    lower.includes('runtime brain') ||
    lower.includes('new execution engine') ||
    lower.includes('create execution_brain') ||
    lower.includes('create runtime_brain') ||
    lower.includes('apply_engine') ||
    lower.includes('world2_execution_runtime')
  );
}

export function isExecutionReadinessAdvisoryQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    isExecutionRuntimeFoundationQuestion(question) ||
    (lower.includes('readiness') && (lower.includes('execution') || lower.includes('runtime')))
  );
}
