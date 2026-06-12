/**
 * World 2 Controlled Execution Runtime — core models.
 * Execution authorization only — no real execution, no live workspace mutation.
 */

import type { ExecutionPlannerAssessment } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { SandboxExecutionAssessment } from '../autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-types.js';
import type { AutonomousRepairLoopAssessment } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { AssessAutonomousBuilderExecutionSandboxInput } from '../autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-types.js';

export type World2ExecutionState =
  | 'NOT_READY'
  | 'READY_FOR_WORLD2'
  | 'READY_WITH_RESTRICTIONS'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type World2TerminationDecision = 'CONTINUE' | 'PAUSE' | 'STOP' | 'ESCALATE';

export interface World2ResourceLimits {
  maxRuntimeMs: number;
  maxAttempts: number;
  maxValidations: number;
  maxRepairs: number;
  maxSandboxFailures: number;
}

export interface World2ExecutionContract {
  readOnly: true;
  contractId: string;
  workspaceId: string;
  executionPlanId: string;
  allowedActions: string[];
  forbiddenActions: string[];
  resourceLimits: World2ResourceLimits;
  rollbackRequirements: string[];
  verificationRequirements: string[];
  acceptanceRequirements: string[];
  terminationConditions: string[];
}

export interface World2TerminationAssessment {
  readOnly: true;
  decision: World2TerminationDecision;
  reasons: string[];
  attemptBudgetRemaining: number;
  proofFailureDetected: boolean;
  acceptanceFailureDetected: boolean;
  regressionDetected: boolean;
  loopRiskDetected: boolean;
}

export interface World2InputSnapshot {
  sandboxAssessment: SandboxExecutionAssessment;
  executionPlannerAssessment: ExecutionPlannerAssessment;
  repairLoopAssessment: AutonomousRepairLoopAssessment;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  plan: ExecutionPlan | null;
  missingAuthorities: string[];
}

export interface World2RuntimeAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  runtimeId: string;
  workspaceId: string;
  executionPlanId: string | null;
  executionState: World2ExecutionState;
  sandboxEligibilityState: SandboxExecutionAssessment['eligibilityState'];
  riskLevel: ExecutionPlanRiskLevel | null;
  inputSnapshot: World2InputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  executionContract: World2ExecutionContract | null;
  terminationAssessment: World2TerminationAssessment;
  cacheKey: string;
}

export interface World2RuntimeReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2RuntimeAssessment;
  passToken: string;
}

export interface AssessWorld2ControlledExecutionRuntimeInput extends AssessAutonomousBuilderExecutionSandboxInput {
  sandboxAssessment?: SandboxExecutionAssessment;
}

export interface World2RuntimeHistorySummary {
  totalAssessments: number;
  readyExecutions: number;
  restrictedExecutions: number;
  blockedExecutions: number;
  insufficientEvidenceExecutions: number;
  notReadyExecutions: number;
  terminationEvents: number;
  escalationEvents: number;
}
