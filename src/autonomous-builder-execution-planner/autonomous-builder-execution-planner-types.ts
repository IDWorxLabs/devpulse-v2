/**
 * Autonomous Builder Execution Planner — core models.
 * Planning only — transforms repair decisions into structured executable plans.
 */

import type { AutonomousRepairLoopAssessment } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { RepairLoopAction, RepairLoopFinding } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';

export type ExecutionPlanType =
  | 'FIX_PLAN'
  | 'REFACTOR_PLAN'
  | 'VALIDATION_PLAN'
  | 'RETEST_PLAN'
  | 'ROLLBACK_PLAN'
  | 'ESCALATION_PLAN';

export type ExecutionPlanRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ExecutionPlanComplexity =
  | 'TRIVIAL'
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE'
  | 'VERY_LARGE';

export interface ExecutionPlanStep {
  stepId: string;
  order: number;
  title: string;
  description: string;
  readOnly: true;
}

export interface ExecutionVerificationPlan {
  validationStrategy: string;
  executionProofStrategy: string;
  founderTestStrategy: string;
  acceptanceStrategy: string;
}

export interface ExecutionRollbackPlan {
  rollbackTrigger: string;
  rollbackMethod: string;
  rollbackSuccessCriteria: string;
}

export interface ExecutionPlan {
  readOnly: true;
  planId: string;
  planType: ExecutionPlanType;
  planSource: 'repair';
  reason: string;
  targetFinding: RepairLoopFinding | null;
  repairDecision: RepairLoopAction;
  steps: ExecutionPlanStep[];
  expectedOutcome: string;
  verificationPlan: ExecutionVerificationPlan;
  rollbackPlan: ExecutionRollbackPlan;
  riskLevel: ExecutionPlanRiskLevel;
  estimatedComplexity: ExecutionPlanComplexity;
  successCriteria: string[];
}

export interface ExecutionPlannerInputSnapshot {
  repairLoopAssessment: AutonomousRepairLoopAssessment;
  founderTestAssessment: FounderTestAssessment | null;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
}

export interface ExecutionPlannerAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  inputSnapshot: ExecutionPlannerInputSnapshot;
  plan: ExecutionPlan | null;
  planExecutable: boolean;
  nonExecutableReason: string | null;
  cacheKey: string;
}

export interface ExecutionPlannerReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: ExecutionPlannerAssessment;
  passToken: string;
}

export interface BuildExecutionPlanInput {
  repairLoopAssessment?: AutonomousRepairLoopAssessment;
  founderTestAssessment?: FounderTestAssessment;
  executionProofAssessment?: ExecutionProofAssessment;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment;
  rootDir?: string;
}

export interface ExecutionPlannerHistorySummary {
  totalPlansGenerated: number;
  fixPlans: number;
  rollbackPlans: number;
  escalationPlans: number;
  validationPlans: number;
  retestPlans: number;
  refactorPlans: number;
  nonExecutablePlans: number;
}
