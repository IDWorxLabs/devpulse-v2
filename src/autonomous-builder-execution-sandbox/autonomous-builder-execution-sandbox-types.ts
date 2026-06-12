/**
 * Autonomous Builder Execution Sandbox — core models.
 * Sandbox eligibility only — no execution, no live workspace mutation.
 */

import type { ExecutionPlannerAssessment } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { AutonomousRepairLoopAssessment } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { BuildExecutionPlanInput } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';

export type SandboxEligibilityState =
  | 'NOT_ELIGIBLE'
  | 'ELIGIBLE'
  | 'ELIGIBLE_WITH_WARNINGS'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface SandboxReadinessReview {
  rollbackReadinessPercent: number;
  verificationReadinessPercent: number;
  proofReadinessPercent: number;
  executionReadinessPercent: number;
  riskReadinessPercent: number;
}

export interface ExecutionContract {
  readOnly: true;
  contractId: string;
  planId: string;
  allowedActions: string[];
  forbiddenActions: string[];
  requiredValidation: string[];
  rollbackRequirements: string[];
  successRequirements: string[];
}

export interface SandboxInputSnapshot {
  executionPlannerAssessment: ExecutionPlannerAssessment;
  repairLoopAssessment: AutonomousRepairLoopAssessment;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  plan: ExecutionPlan | null;
  missingAuthorities: string[];
}

export interface SandboxExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  sandboxId: string;
  planId: string | null;
  eligibilityState: SandboxEligibilityState;
  riskLevel: ExecutionPlanRiskLevel | null;
  inputSnapshot: SandboxInputSnapshot;
  readinessReview: SandboxReadinessReview;
  blockingReasons: string[];
  warningReasons: string[];
  requiredPreconditions: string[];
  requiredValidation: string[];
  requiredProof: string[];
  requiredRollback: string[];
  executionContract: ExecutionContract | null;
  cacheKey: string;
}

export interface SandboxExecutionReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: SandboxExecutionAssessment;
  passToken: string;
}

export interface AssessAutonomousBuilderExecutionSandboxInput extends BuildExecutionPlanInput {
  executionPlannerAssessment?: ExecutionPlannerAssessment;
}

export interface SandboxExecutionHistorySummary {
  totalAssessments: number;
  eligiblePlans: number;
  warningPlans: number;
  blockedPlans: number;
  insufficientEvidencePlans: number;
  notEligiblePlans: number;
}
