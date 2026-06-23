/**
 * Phase 26.96 — Founder Simulation Completion Boundary Repair (V1).
 */

export type {
  AssessFounderSimulationCompletionBoundaryInput,
  ExecuteFounderSimulationStageInput,
  FounderSimulationCompletionBoundaryAssessment,
  FounderSimulationCompletionBoundaryReport,
  FounderSimulationCompletionEventId,
  FounderSimulationPipelineFailureClass,
  FounderSimulationStageExecutionOutcome,
  FounderSimulationStageTrace,
} from './founder-simulation-completion-boundary-repair-types.js';

export {
  FOUNDER_SIMULATION_COMPLETE,
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
  FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS,
  FOUNDER_SIMULATION_COMPLETION_RULES,
  FOUNDER_SIMULATION_HEARTBEAT_INTERVAL_MS,
  FOUNDER_SIMULATION_RUNNING,
  FOUNDER_SIMULATION_STAGE_BUDGET_MS,
  INTEGRATION_TARGETS,
  POST_FOUNDER_SIMULATION_STAGES,
} from './founder-simulation-completion-boundary-repair-registry.js';

export {
  assessFounderSimulationCompletionBoundary,
  executeFounderSimulationStageWithCompletionBoundary,
  resetFounderSimulationCompletionBoundaryRepairCounterForTests,
  resetFounderSimulationCompletionBoundaryRepairModuleForTests,
} from './founder-simulation-completion-boundary-repair-authority.js';

export {
  detectFounderSimulationCompletion,
  emitFounderSimulationCompletionOnce,
  getLastFounderSimulationCompletionEventId,
  hasFounderSimulationCompletionEventEmitted,
  resetFounderSimulationCompletionDetectionForTests,
} from './founder-simulation-completion-detector.js';

export {
  analyzeFounderSimulationTransition,
  isCrossSystemOrchestrationProofEligible,
  resolveNextStageAfterFounderSimulation,
} from './founder-simulation-transition-analyzer.js';

export { auditFounderSimulationStage } from './founder-simulation-stage-auditor.js';

export {
  buildFounderSimulationDiagnosticMarkdown,
  planFounderSimulationStageCompletion,
} from './founder-simulation-repair-planner.js';

export {
  buildFounderSimulationCompletionBoundaryReportMarkdown,
  buildFounderSimulationCompletionRepairReportMarkdown,
  buildFounderSimulationCompletionValidationMarkdown,
} from './founder-simulation-completion-report-builder.js';

export {
  getFounderSimulationCompletionHistory,
  getFounderSimulationCompletionHistorySize,
  recordFounderSimulationCompletionReport,
  resetFounderSimulationCompletionHistoryForTests,
} from './founder-simulation-completion-history.js';
