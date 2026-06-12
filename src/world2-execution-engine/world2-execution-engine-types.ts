/**
 * World 2 Execution Engine — core models.
 * Step modeling, queue, and audit only — no live workspace mutation.
 */

import type { ExecutionPlan } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { SandboxExecutionAssessment } from '../autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-types.js';
import type {
  AssessWorld2ControlledExecutionRuntimeInput,
  World2ExecutionContract,
  World2RuntimeAssessment,
} from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';

export type World2ExecutionMode =
  | 'DRY_RUN'
  | 'SIMULATED_EXECUTION'
  | 'SANDBOX_EXECUTION_ELIGIBLE'
  | 'BLOCKED';

export type World2ExecutionStepStatus =
  | 'QUEUED'
  | 'READY'
  | 'SIMULATED'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'COMPLETED_DRY_RUN';

export type World2ExecutionStepActionType =
  | 'PLAN_STEP'
  | 'VALIDATION_STEP'
  | 'ROLLBACK_CHECK'
  | 'VERIFICATION_STEP'
  | 'ACCEPTANCE_CHECK';

export type World2EngineFinalState =
  | 'SANDBOX_EXECUTION_ELIGIBLE'
  | 'SIMULATED_EXECUTION'
  | 'DRY_RUN_COMPLETE'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface World2ExecutionStep {
  readOnly: true;
  stepId: string;
  planId: string;
  actionType: World2ExecutionStepActionType;
  description: string;
  allowedScope: string[];
  forbiddenScope: string[];
  expectedResult: string;
  validationRequired: boolean;
  rollbackRequired: boolean;
  status: World2ExecutionStepStatus;
}

export interface World2ExecutionAuditEntry {
  readOnly: true;
  auditId: string;
  engineRunId: string;
  stepId: string;
  sourcePlanId: string;
  sourceContractId: string | null;
  whyAllowed: string;
  forbiddenScope: string[];
  requiredValidation: string[];
  recordedAt: string;
}

export interface World2ExecutionQueueSnapshot {
  readOnly: true;
  queuedStepCount: number;
  simulatedStepCount: number;
  maxQueuedSteps: number;
  maxSimulatedSteps: number;
  maxRunDurationMs: number;
  recursiveRunBlocked: true;
}

export interface World2EngineInputSnapshot {
  runtimeAssessment: World2RuntimeAssessment;
  sandboxAssessment: SandboxExecutionAssessment;
  plan: ExecutionPlan | null;
  executionContract: World2ExecutionContract | null;
  missingAuthorities: string[];
}

export interface World2ExecutionEngineAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  engineRunId: string;
  workspaceId: string | null;
  executionMode: World2ExecutionMode;
  inputSnapshot: World2EngineInputSnapshot;
  steps: World2ExecutionStep[];
  blockers: string[];
  warnings: string[];
  auditTrail: World2ExecutionAuditEntry[];
  queueSnapshot: World2ExecutionQueueSnapshot;
  nextRequiredValidation: string[];
  finalState: World2EngineFinalState;
  cacheKey: string;
}

export interface World2ExecutionEngineReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2ExecutionEngineAssessment;
  passToken: string;
}

export interface AssessWorld2ExecutionEngineInput extends AssessWorld2ControlledExecutionRuntimeInput {
  runtimeAssessment?: World2RuntimeAssessment;
}

export interface World2ExecutionEngineHistorySummary {
  totalRuns: number;
  sandboxEligibleRuns: number;
  simulatedRuns: number;
  dryRunRuns: number;
  blockedRuns: number;
  insufficientEvidenceRuns: number;
}
