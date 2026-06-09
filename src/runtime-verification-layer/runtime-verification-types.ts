/**
 * DevPulse V2 Phase 14.6 — Runtime Verification Layer Foundation types.
 * Verification reports only — no execution, no test runs, no file modification.
 */

import type { AutoFixPlan } from '../auto-fix-runtime/auto-fix-runtime-types.js';
import type { TestingPlan } from '../testing-runtime/testing-runtime-types.js';
import type { CodeGenerationPlan } from '../code-generation-runtime/code-generation-runtime-types.js';
import type { BuildTaskPlan } from '../build-task-runtime/build-task-runtime-types.js';
import type { ExecutionPacket } from '../execution-runtime/execution-runtime-types.js';

export const RUNTIME_VERIFICATION_LAYER_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_RUNTIME_VERIFICATION_LAYER_FOUNDATION_V1_PASS';
export const RUNTIME_VERIFICATION_LAYER_OWNER_MODULE = 'devpulse_v2_runtime_verification_layer';

export type VerificationState =
  | 'DRAFT'
  | 'ANALYZING'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'BLOCKED'
  | 'SIMULATION_ONLY'
  | 'READY_FOR_FUTURE_RUNTIME';

export type VerificationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RuntimeVerificationRequest {
  requestId: string;
  query: string;
  title: string;
  goal: string;
  requestedOutcome: string;
  sourceSystem: string;
  verificationOnly: true;
}

export interface VerificationEvidence {
  evidenceId: string;
  category: string;
  statement: string;
  sourceSystem: string;
  satisfied: boolean;
  verificationOnly: true;
}

export interface VerificationGap {
  gapId: string;
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceSystem: string;
  verificationOnly: true;
}

export interface VerificationTrustAssessment {
  assessmentId: string;
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  summary: string;
  verificationOnly: true;
}

export interface RuntimeVerificationReport {
  verificationId: string;
  title: string;
  description: string;
  sourceSystem: string;
  state: VerificationState;
  linkedExecutionId: string;
  linkedBuildTaskId: string;
  linkedGenerationId: string;
  linkedTestingId: string;
  linkedFixId: string;
  executionPacket: ExecutionPacket;
  buildTaskPlan: BuildTaskPlan;
  codeGenerationPlan: CodeGenerationPlan;
  testingPlan: TestingPlan;
  autoFixPlan: AutoFixPlan;
  evidence: VerificationEvidence[];
  gaps: VerificationGap[];
  trustAssessment: VerificationTrustAssessment;
  verificationScore: number;
  confidence: VerificationConfidence;
  blocked: boolean;
  blockers: string[];
  readiness: string;
  recommendedNextAction: string;
  verificationOnly: true;
}

export interface RuntimeVerificationDiagnostics {
  runtimeVerificationActive: boolean;
  verificationReportCount: number;
  verifiedCount: number;
  blockedVerificationCount: number;
  averageVerificationScore: number;
  lastVerificationQuery: string | null;
}

export interface RuntimeVerificationResult {
  query: string;
  request: RuntimeVerificationRequest;
  report: RuntimeVerificationReport;
  responseText: string;
}

export const VERIFICATION_QUESTION_SIGNALS = [
  'runtime verification',
  'verification report',
  'verification score',
  'verification evidence',
  'verification gaps',
  'trust assessment',
  'runtime chain verified',
  'is the runtime chain verified',
  'what verification exists',
  'what verification evidence',
  'what verification gaps',
  'how trustworthy is the runtime',
  'how trustworthy is the runtime chain',
  'what prevents verification',
  'what should be verified next',
  'verification requirements',
  'chain satisfy verification',
  'build plan valid',
  'generation plan valid',
  'testing plan valid',
  'auto-fix plan valid',
] as const;

export const FORBIDDEN_RUNTIME_VERIFICATION_DUPLICATES = [
  'verification_brain',
  'verification_runtime_v2',
  'runtime_brain',
  'execution_brain',
  'brain_v2',
  'apply_engine',
  'verification_runtime',
  'verification_layer',
  'runtime_validator',
] as const;

export const VERIFICATION_INPUT_SOURCES = [
  'execution_runtime',
  'build_task_runtime',
  'code_generation_runtime',
  'testing_runtime',
  'auto_fix_runtime',
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

export function isRuntimeVerificationLayerQuestion(question: string): boolean {
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
    !lower.includes('verification') &&
    !lower.includes('valid')
  ) {
    return false;
  }

  if (
    (lower.includes('how would we test') || lower.includes('test plan')) &&
    !lower.includes('verification') &&
    !lower.includes('valid')
  ) {
    return false;
  }

  if (
    (lower.includes('how would you fix') || lower.includes('auto fix')) &&
    !lower.includes('verification') &&
    !lower.includes('valid')
  ) {
    return false;
  }

  if (
    (lower.includes('plan the build') || lower.includes('build task')) &&
    !lower.includes('verification') &&
    !lower.includes('valid')
  ) {
    return false;
  }

  return VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateVerificationBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('verification brain') ||
    lower.includes('verification_brain') ||
    lower.includes('verification_runtime_v2') ||
    lower.includes('runtime_brain') ||
    lower.includes('new runtime verification duplicate')
  );
}

export function isRuntimeVerificationAdvisoryQuestion(question: string): boolean {
  return isRuntimeVerificationLayerQuestion(question);
}
