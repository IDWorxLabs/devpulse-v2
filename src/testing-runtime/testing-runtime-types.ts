/**
 * DevPulse V2 Phase 14.4 — Testing Runtime Foundation types.
 * Testing planning and simulated results only — no test execution.
 */

import type { CodeGenerationPlan } from '../code-generation-runtime/code-generation-runtime-types.js';
import type { BuildTaskPlan } from '../build-task-runtime/build-task-runtime-types.js';
import type { ExecutionPacket } from '../execution-runtime/execution-runtime-types.js';

export const TESTING_RUNTIME_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_TESTING_RUNTIME_FOUNDATION_V1_PASS';
export const TESTING_RUNTIME_OWNER_MODULE = 'devpulse_v2_testing_runtime';

export type TestingState =
  | 'DRAFT'
  | 'PLANNED'
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'SIMULATION_ONLY'
  | 'READY_FOR_FUTURE_TESTING';

export type TestingConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type SimulatedTestStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT_RUN';

export interface TestingRequest {
  requestId: string;
  query: string;
  title: string;
  goal: string;
  requestedOutcome: string;
  sourceSystem: string;
  planningOnly: true;
}

export interface TestingCase {
  caseId: string;
  title: string;
  description: string;
  passCriteria: string;
  failCriteria: string;
  linkedArtifact: string | null;
  simulationOnly: true;
}

export interface TestingEvidenceRequirement {
  evidenceId: string;
  requirement: string;
  sourceSystem: string;
  proofType: string;
  simulationOnly: true;
}

export interface TestingRisk {
  riskId: string;
  summary: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceSystem: string;
  simulationOnly: true;
}

export interface SimulatedTestResult {
  resultId: string;
  caseId: string;
  title: string;
  status: SimulatedTestStatus;
  summary: string;
  evidenceNote: string;
  executed: false;
  simulationOnly: true;
}

export interface TestingPlan {
  testingId: string;
  title: string;
  description: string;
  goal: string;
  sourceSystem: string;
  state: TestingState;
  linkedGenerationId: string;
  linkedBuildTaskId: string;
  linkedExecutionId: string;
  codeGenerationPlan: CodeGenerationPlan;
  buildTaskPlan: BuildTaskPlan;
  executionPacket: ExecutionPacket;
  testCases: TestingCase[];
  evidenceRequirements: TestingEvidenceRequirement[];
  simulatedResults: SimulatedTestResult[];
  risks: TestingRisk[];
  passCriteria: string[];
  failCriteria: string[];
  readiness: string;
  blocked: boolean;
  blockers: string[];
  confidence: TestingConfidence;
  rollbackConsiderations: string[];
  planningOnly: true;
}

export interface TestingRuntimeDiagnostics {
  testingRuntimeActive: boolean;
  testingPlanCount: number;
  blockedTestingCount: number;
  readyForFutureTestingCount: number;
  lastTestingQuery: string | null;
  lastTestingReadiness: string | null;
}

export interface TestingRuntimeResult {
  query: string;
  request: TestingRequest;
  plan: TestingPlan;
  responseText: string;
}

export const TESTING_QUESTION_SIGNALS = [
  'test plan',
  'testing runtime',
  'how would we test',
  'how would you test',
  'what tests are required',
  'what tests would',
  'pass fail criteria',
  'pass or fail',
  'test evidence',
  'validation evidence',
  'simulated test result',
  'simulated failures',
  'what would prove this works',
  'what evidence is required',
  'can testing run',
  'blocking testing',
  'what is blocking testing',
  'count as pass',
  'count as fail',
  'prove the generated code',
  'prove this works',
] as const;

export const FORBIDDEN_TESTING_RUNTIME_DUPLICATES = [
  'testing_brain',
  'test_brain',
  'validation_brain',
  'execution_brain',
  'runtime_brain',
  'brain_v2',
  'apply_engine',
  'auto_fix_runtime',
  'test_runtime',
  'test_planning_runtime',
  'validation_runtime',
] as const;

export const TESTING_INPUT_SOURCES = [
  'execution_runtime',
  'build_task_runtime',
  'code_generation_runtime',
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

export function isTestingRuntimeFoundationQuestion(question: string): boolean {
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
    !lower.includes('test') &&
    !lower.includes('prove')
  ) {
    return false;
  }

  if (
    (lower.includes('plan the build') || lower.includes('build task')) &&
    !lower.includes('test')
  ) {
    return false;
  }

  return TESTING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateTestingBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('testing brain') ||
    lower.includes('testing_brain') ||
    lower.includes('test_brain') ||
    lower.includes('validation_brain') ||
    lower.includes('auto_fix_runtime') ||
    lower.includes('new testing runtime duplicate')
  );
}

export function isTestingPlanningAdvisoryQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    isTestingRuntimeFoundationQuestion(question) ||
    (lower.includes('how would we test') && !lower.includes('execute'))
  );
}
