/**
 * DevPulse V2 Phase 15.1 — World 2 Execution Activation Foundation types.
 * Activation planning only — no real execution, no World 1 modification.
 */

import type { RuntimeVerificationReport } from '../runtime-verification-layer/runtime-verification-types.js';

export const WORLD2_EXECUTION_ACTIVATION_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_WORLD2_EXECUTION_ACTIVATION_FOUNDATION_V1_PASS';
export const WORLD2_EXECUTION_ACTIVATION_OWNER_MODULE = 'devpulse_v2_world2_execution_activation';

export type World2ActivationState =
  | 'DRAFT'
  | 'CHECKING_ISOLATION'
  | 'CHECKING_GOVERNANCE'
  | 'CHECKING_RUNTIME_CHAIN'
  | 'BLOCKED'
  | 'WAITING_APPROVAL'
  | 'SIMULATION_ONLY'
  | 'READY_FOR_FUTURE_ACTIVATION'
  | 'ACTIVATED_SIMULATION_ONLY'
  | 'EXECUTION_READY'
  | 'AWAITING_APPROVAL';

export type World2ActivationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface World2ActivationRequest {
  requestId: string;
  query: string;
  title: string;
  goal: string;
  requestedOutcome: string;
  sourceSystem: string;
  activationOnly: true;
}

export interface World2WorkspaceIsolationReport {
  reportId: string;
  world1Protected: boolean;
  world2Isolated: boolean;
  targetProjectId: string;
  targetWorkspaceId: string;
  workspaceOwner: string;
  noSharedMutableState: boolean;
  noWorld1ModificationPath: boolean;
  noCloudExecution: boolean;
  noDeploymentPath: boolean;
  checks: string[];
  simulationOnly: true;
}

export interface World2GovernanceGate {
  gateId: string;
  name: string;
  required: boolean;
  satisfied: boolean;
  summary: string;
  simulationOnly: true;
}

export interface World2GovernanceGateReport {
  reportId: string;
  gates: World2GovernanceGate[];
  allRequiredSatisfied: boolean;
  approvalRequired: boolean;
  simulationOnly: true;
}

export interface World2RuntimeChainLink {
  linkId: string;
  executionRuntimeId: string;
  buildTaskRuntimeId: string;
  codeGenerationRuntimeId: string;
  testingRuntimeId: string;
  autoFixRuntimeId: string;
  verificationLayerId: string;
  executionAllowed: false;
  generationProposalOnly: true;
  testingSimulationOnly: true;
  autoFixSimulationOnly: true;
  simulationOnly: true;
}

export interface World2ActivationReadinessReport {
  reportId: string;
  readiness: string;
  canActivateNow: false;
  blocked: boolean;
  blockers: string[];
  approvalRequired: boolean;
  simulationOnly: true;
}

export interface World2ActivationPlan {
  activationId: string;
  title: string;
  description: string;
  targetProjectId: string;
  targetWorkspaceId: string;
  world: 'WORLD_2';
  activationState: World2ActivationState;
  runtimeChain: World2RuntimeChainLink;
  verificationReport: RuntimeVerificationReport;
  governanceGates: World2GovernanceGateReport;
  isolationReport: World2WorkspaceIsolationReport;
  readinessReport: World2ActivationReadinessReport;
  readiness: string;
  blocked: boolean;
  blockers: string[];
  approvalRequired: boolean;
  confidence: World2ActivationConfidence;
  activationOnly: true;
}

export interface World2ExecutionActivationDiagnostics {
  world2ExecutionActivationActive: boolean;
  activationPlanCount: number;
  blockedActivationCount: number;
  readyForFutureActivationCount: number;
  lastActivationQuery: string | null;
  lastActivationReadiness: string | null;
  isolationStatus: string | null;
  governanceGateStatus: string | null;
}

export interface World2ExecutionActivationResult {
  query: string;
  request: World2ActivationRequest;
  plan: World2ActivationPlan;
  responseText: string;
}

export const WORLD2_ACTIVATION_QUESTION_SIGNALS = [
  'world 2 execution',
  'activate world 2',
  'world2 execution',
  'world 2 activation',
  'world2 activation',
  'can world 2 build',
  'can world 2 execution',
  'world 2 runtime',
  'world 2 workspace',
  'world 2 isolated execution',
  'world2 isolated',
  'world 1 protected',
  'is world 2 isolated',
  'gates are required for world 2',
  'blocks world 2 activation',
  'what blocks world 2',
  'what approval is required',
  'what runtime chain would world 2',
] as const;

export const FORBIDDEN_WORLD2_ACTIVATION_DUPLICATES = [
  'world2_brain',
  'world2_runtime_brain',
  'execution_brain',
  'runtime_brain',
  'brain_v2',
  'world1_modification_runtime',
  'ungoverned_execution_runtime',
  'world2_execution_runtime',
  'world2_activation_runtime',
  'world2_execution_authority',
] as const;

export const WORLD2_ACTIVATION_INPUT_SOURCES = [
  'execution_runtime',
  'build_task_runtime',
  'code_generation_runtime',
  'testing_runtime',
  'auto_fix_runtime',
  'runtime_verification_layer',
  'workspace_intelligence',
  'dependency_intelligence',
  'operator_feed',
  'action_visibility_engine',
  'reasoning_visibility_engine',
  'failure_visibility_engine',
  'progress_intelligence',
  'unified_decision_layer',
] as const;

export function isWorld2ExecutionActivationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (lower.includes('what should we build next') && !lower.includes('world 2') && !lower.includes('world2')) {
    return false;
  }

  if (
    lower.includes('runtime verification') &&
    !lower.includes('world 2') &&
    !lower.includes('world2')
  ) {
    return false;
  }

  if (
    (lower.includes('how would you fix') || lower.includes('auto fix')) &&
    !lower.includes('world 2') &&
    !lower.includes('world2')
  ) {
    return false;
  }

  return WORLD2_ACTIVATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateWorld2BrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('world2 brain') ||
    lower.includes('world2_brain') ||
    lower.includes('world2_runtime_brain') ||
    lower.includes('ungoverned_execution_runtime') ||
    lower.includes('new world2 execution activation duplicate')
  );
}

export function isWorld2ExecutionActivationAdvisoryQuestion(question: string): boolean {
  return isWorld2ExecutionActivationQuestion(question);
}
