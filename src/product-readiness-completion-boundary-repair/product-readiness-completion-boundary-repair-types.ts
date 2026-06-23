/**
 * Phase 26.90 — Product Readiness Completion Boundary Repair types (V1).
 */

import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { ChatStressCompletionSnapshot } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';

export type ProductReadinessCompletionFailureClass =
  | 'SETTLEMENT_NOT_COMPLETE'
  | 'COMPLETION_DETECTION_MISSING'
  | 'COMPLETION_EVENT_NOT_EMITTED'
  | 'COMPLETION_EVENT_DROPPED'
  | 'STATE_MACHINE_STALLED'
  | 'STAGE_ADVANCEMENT_FAILED'
  | 'PROPAGATION_FAILURE'
  | 'UNKNOWN_COMPLETION_FAILURE'
  | 'NONE';

export interface ChatStressSettlementAudit {
  readOnly: true;
  settlementComplete: boolean;
  startedCount: number;
  settledCount: number;
  pendingCount: number;
  totalScenarios: number;
  rule1Satisfied: boolean;
  completionBoundaryReached: boolean;
  reason: string | null;
}

export interface ProductReadinessCompletionDetection {
  readOnly: true;
  productReadinessComplete: boolean;
  completionCheckEmitted: boolean;
  productReadinessCompletePropagated: boolean;
  productReadinessCompleteEventEmitted: boolean;
  failureClass: ProductReadinessCompletionFailureClass;
  reason: string | null;
}

export interface StageTransitionAnalysis {
  readOnly: true;
  intakeValidationRunning: boolean;
  intakeValidationComplete: boolean;
  planningGateEligible: boolean;
  missingCompletionBoundary: string | null;
  stageAdvancementBlocked: boolean;
  failureClass: ProductReadinessCompletionFailureClass;
  reason: string | null;
}

export interface CompletionBoundaryRepairPlan {
  readOnly: true;
  repairRequired: boolean;
  actions: readonly string[];
  failureClass: ProductReadinessCompletionFailureClass;
  emitProductReadinessComplete: boolean;
  forceCompletionTail: boolean;
  recordPropagationBoundaries: boolean;
  reason: string | null;
}

export interface ProductReadinessCompletionBoundaryRepairReport {
  readOnly: true;
  repairId: string;
  generatedAt: string;
  settlementAudit: ChatStressSettlementAudit;
  completionDetection: ProductReadinessCompletionDetection;
  stageTransition: StageTransitionAnalysis;
  repairPlan: CompletionBoundaryRepairPlan;
  repairApplied: boolean;
  passToken: string | null;
}

export interface ProductReadinessCompletionBoundaryRepairAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: ProductReadinessCompletionBoundaryRepairReport;
}

export interface AssessProductReadinessCompletionBoundaryRepairInput {
  rootDir?: string;
  runtimeSnapshot?: Pick<
    FounderTestRuntimeSnapshot,
    'state' | 'stages' | 'traceEvents' | 'missingCompletionBoundary' | 'stage2CompletionGap'
  > | null;
  chatStressSnapshot?: ChatStressCompletionSnapshot;
  nowMs?: number;
}

export interface ApplyProductReadinessCompletionBoundaryRepairInput {
  rootDir?: string;
  onSimulationTrace?: (event: {
    operationId: string;
    operationLabel: string;
    phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED';
  }) => void;
  onRuntimeTrace?: (event: {
    operationId: string;
    operationLabel: string;
    stageId: string;
    status: 'PASSED' | 'RUNNING';
  }) => void;
  nowMs?: number;
}
