/**
 * DevPulse V2 Phase 16.9 — Verification Orchestrator types.
 * Execution planning only — no verification execution, evidence, or auto-fix.
 */

export const VERIFICATION_ORCHESTRATOR_PASS_TOKEN = 'VERIFICATION_ORCHESTRATOR_V1_PASS';
export const VERIFICATION_ORCHESTRATOR_OWNER_MODULE = 'devpulse_v2_verification_orchestrator';

export type OrchestrationExecutionState =
  | 'REGISTERED'
  | 'READY'
  | 'WAITING'
  | 'BLOCKED'
  | 'SCHEDULED'
  | 'PLANNED';

export type OrchestrationState = 'REGISTERED' | 'READY' | 'WAITING' | 'BLOCKED' | 'PLANNED';

export const FORBIDDEN_VERIFICATION_ORCHESTRATOR_DUPLICATES = [
  'verification_evidence_engine',
  'verification_reporting_engine',
  'auto_fix_engine',
  'uvl_monolith',
  'runtime_brain',
] as const;

export const VERIFICATION_ORCHESTRATOR_QUESTION_SIGNALS = [
  'what should run first',
  'what verification is blocked',
  'what dependencies are missing',
  'what can run in parallel',
  'what is waiting',
  'what verification plan exists',
  'verification orchestrator',
  'verification plan',
  'execution order',
  'parallel verification',
  'blocked verification',
  'orchestration blocked',
  'why is orchestration blocked',
] as const;

export interface VerificationExecutionPlan {
  verificationPlanId: string;
  targetId: string;
  targetCategory: string;
  executionState: OrchestrationExecutionState;
  phase: number;
  ownerModule: string;
  upstreamDependencies: string[];
  downstreamDependencies: string[];
  prerequisites: string[];
  plannedOrder: number;
  registryOnly: true;
}

export interface ParallelGroup {
  groupId: string;
  targetIds: string[];
  parallelSafe: true;
}

export interface VerificationOrchestrationReport {
  orchestrationId: string;
  verificationPlanId: string;
  orchestrationState: OrchestrationState;
  verificationTargets: string[];
  executionOrder: string[];
  parallelGroups: ParallelGroup[];
  blockedTargets: string[];
  waitingTargets: string[];
  readyTargets: string[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
  planningOnly: true;
}

export interface VerificationOrchestratorDiagnostics {
  orchestrationActive: boolean;
  orchestrationId: string | null;
  verificationPlanCount: number;
  readyTargetCount: number;
  blockedTargetCount: number;
  waitingTargetCount: number;
  lastQuery: string | null;
  lastState: OrchestrationState | null;
}

export interface PrepareVerificationOrchestrationInput {
  query?: string;
  projectId?: string;
  workspaceId?: string;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface PrepareVerificationOrchestrationResult {
  orchestrationReport: VerificationOrchestrationReport;
  diagnostics: VerificationOrchestratorDiagnostics;
  executionPlan: VerificationExecutionPlan[];
  parallelGroups: ParallelGroup[];
  blockedTargets: string[];
  responseText: string;
}

export function isVerificationOrchestratorQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return VERIFICATION_ORCHESTRATOR_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isVerificationOrchestratorAdvisoryQuestion(question: string): boolean {
  return isVerificationOrchestratorQuestion(question);
}

export function isDuplicateVerificationOrchestratorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_VERIFICATION_ORCHESTRATOR_DUPLICATES.some((d) => lower.includes(d));
}
