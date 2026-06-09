/**
 * DevPulse V2 Phase 14.3 — Code Generation Runtime Foundation types.
 * Proposal only — no real file writes or code application.
 */

import type { BuildTaskPlan } from '../build-task-runtime/build-task-runtime-types.js';
import type { ExecutionPacket } from '../execution-runtime/execution-runtime-types.js';

export const CODE_GENERATION_RUNTIME_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_CODE_GENERATION_RUNTIME_FOUNDATION_V1_PASS';
export const CODE_GENERATION_RUNTIME_OWNER_MODULE = 'devpulse_v2_code_generation_runtime';

export type CodeGenerationState =
  | 'DRAFT'
  | 'PROPOSED'
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'SIMULATION_ONLY'
  | 'READY_FOR_FUTURE_GENERATION';

export type CodeGenerationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type CodeGenerationStrategy =
  | 'INCREMENTAL_MODULE'
  | 'INTERFACE_FIRST'
  | 'TEST_FIRST_PROPOSAL'
  | 'ADAPTER_LAYER'
  | 'SIMULATION_STUB';

export interface CodeGenerationRequest {
  requestId: string;
  query: string;
  title: string;
  goal: string;
  requestedOutcome: string;
  sourceSystem: string;
  proposalOnly: true;
}

export interface CodeArtifactProposal {
  artifactId: string;
  name: string;
  description: string;
  language: string;
  inMemoryOnly: true;
  proposedContentSummary: string;
  proposalOnly: true;
}

export interface CodeChangeProposal {
  changeId: string;
  targetFile: string;
  changeType: 'CREATE' | 'MODIFY' | 'DELETE_PROPOSAL';
  description: string;
  rationale: string;
  applied: false;
  proposalOnly: true;
}

export interface CodeGenerationRisk {
  riskId: string;
  summary: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceSystem: string;
  proposalOnly: true;
}

export interface CodeGenerationValidationPlan {
  planId: string;
  checks: string[];
  proofCriteria: string[];
  rollbackConsiderations: string[];
  proposalOnly: true;
}

export interface CodeGenerationPlan {
  generationId: string;
  title: string;
  description: string;
  sourceSystem: string;
  requestedOutcome: string;
  state: CodeGenerationState;
  targetFiles: string[];
  artifactProposals: CodeArtifactProposal[];
  changeProposals: CodeChangeProposal[];
  strategy: CodeGenerationStrategy;
  risks: CodeGenerationRisk[];
  validationPlan: CodeGenerationValidationPlan;
  buildTaskId: string;
  buildTaskPlan: BuildTaskPlan;
  executionPacketId: string;
  executionPacket: ExecutionPacket;
  readiness: string;
  blocked: boolean;
  blockers: string[];
  confidence: CodeGenerationConfidence;
  rollbackConsiderations: string[];
  proposalOnly: true;
}

export interface CodeGenerationRuntimeDiagnostics {
  codeGenerationRuntimeActive: boolean;
  codeGenerationPlanCount: number;
  blockedGenerationCount: number;
  readyForFutureGenerationCount: number;
  lastCodeGenerationQuery: string | null;
  lastCodeGenerationReadiness: string | null;
}

export interface CodeGenerationRuntimeResult {
  query: string;
  request: CodeGenerationRequest;
  plan: CodeGenerationPlan;
  responseText: string;
}

export const CODE_GENERATION_QUESTION_SIGNALS = [
  'code generation',
  'generate code',
  'what code would be generated',
  'what files would change',
  'what changes are proposed',
  'code artifact',
  'generated code',
  'generation strategy',
  'blocking code generation',
  'code generation run',
  'prove the generated code',
  'proposed changes',
  'target files',
  'artifact proposal',
  'implementation proposal',
  'what files would be',
  'changes are proposed',
] as const;

export const FORBIDDEN_CODE_GENERATION_RUNTIME_DUPLICATES = [
  'code_generation_brain',
  'code_brain',
  'generator_brain',
  'execution_brain',
  'runtime_brain',
  'brain_v2',
  'apply_engine',
  'file_apply_runtime',
  'code_generator_runtime',
  'generation_runtime',
  'code_artifact_runtime',
] as const;

export const CODE_GENERATION_INPUT_SOURCES = [
  'execution_runtime',
  'build_task_runtime',
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

export function isCodeGenerationRuntimeFoundationQuestion(question: string): boolean {
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
    (lower.includes('plan the build') || lower.includes('build task')) &&
    !lower.includes('code') &&
    !lower.includes('generate')
  ) {
    return false;
  }

  return CODE_GENERATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateCodeGenerationBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('code generation brain') ||
    lower.includes('code_brain') ||
    lower.includes('generator_brain') ||
    lower.includes('file_apply_runtime') ||
    lower.includes('new code generation runtime duplicate')
  );
}

export function isCodeGenerationPlanningAdvisoryQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    isCodeGenerationRuntimeFoundationQuestion(question) ||
    (lower.includes('generate code') && lower.includes('feature'))
  );
}
