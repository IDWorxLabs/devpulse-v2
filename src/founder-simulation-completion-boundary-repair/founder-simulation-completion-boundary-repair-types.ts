/**
 * Phase 26.96 — Founder Simulation Completion Boundary Repair types (V1).
 */

export type FounderSimulationPipelineFailureClass =
  | 'SIMULATION_NOT_STARTED'
  | 'SIMULATION_RESULT_MISSING'
  | 'COMPLETION_DETECTION_MISSING'
  | 'COMPLETION_EVENT_NOT_EMITTED'
  | 'COMPLETION_EVENT_DROPPED'
  | 'STAGE_TRANSITION_FAILED'
  | 'NEXT_STAGE_NOT_ELIGIBLE'
  | 'RUNTIME_MONITOR_STOPPED_EARLY'
  | 'DIAGNOSTIC_RESULT_NOT_STORED'
  | 'UNKNOWN_FOUNDER_SIMULATION_FAILURE';

export type FounderSimulationCompletionEventId =
  | 'FOUNDER_SIMULATION_COMPLETE'
  | 'FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS';

export interface FounderSimulationStageTrace {
  readOnly: true;
  simulationStarted: boolean;
  resultProduced: boolean;
  completionDetected: boolean;
  completionEventEmitted: boolean;
  completionEventId: FounderSimulationCompletionEventId | null;
  nextStageEligible: boolean;
  runtimeMonitorActive: boolean;
  diagnosticStored: boolean;
  failureClass: FounderSimulationPipelineFailureClass | null;
  detail: string;
}

export interface FounderSimulationCompletionBoundaryReport {
  readOnly: true;
  repairId: string;
  generatedAt: string;
  coreQuestion: string;
  trace: FounderSimulationStageTrace;
  elapsedMs: number;
  degraded: boolean;
  budgetExceeded: boolean;
  completionMessage: string;
  stageStatus: 'PASSED' | 'FAILED' | 'SKIPPED';
  crossSystemOrchestrationEligible: boolean;
  passToken: string | null;
}

export interface FounderSimulationCompletionBoundaryAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_COMPLETE';
  report: FounderSimulationCompletionBoundaryReport;
  cacheKey: string;
}

export interface ExecuteFounderSimulationStageInput<T> {
  rootDir: string;
  execute: () => T;
  onSubstep?: (operationId: string, message: string) => void;
  skipHistoryRecording?: boolean;
}

export interface FounderSimulationStageExecutionOutcome<T> {
  readOnly: true;
  result: T | null;
  degraded: boolean;
  budgetExceeded: boolean;
  errorMessage: string | null;
  completionEventId: FounderSimulationCompletionEventId;
  completionMessage: string;
  stageStatus: 'PASSED' | 'FAILED' | 'SKIPPED';
  crossSystemOrchestrationEligible: boolean;
  diagnosticMarkdown: string | null;
  elapsedMs: number;
}

export interface AssessFounderSimulationCompletionBoundaryInput {
  rootDir?: string;
  outcome?: FounderSimulationStageExecutionOutcome<unknown> | null;
  skipHistoryRecording?: boolean;
}
