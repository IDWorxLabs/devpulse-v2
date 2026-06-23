/**
 * Phase 27.02 — Founder Simulation Degradation Root Cause Repair (V1).
 */

export {
  FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS,
  FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_PHASE,
  FOUNDER_SIMULATION_DEGRADATION_CORE_QUESTION,
  DEGRADATION_INVESTIGATION_RULES,
  STAGE_TO_AUTHORITY,
  OPERATION_TO_AUTHORITY,
  DEGRADATION_TRACE_PATTERNS,
  INTEGRATION_TARGETS,
} from './founder-simulation-degradation-root-cause-registry.js';

export type {
  DegradationRootCauseClass,
  DegradationSignalKind,
  FounderSimulationAuthorityProfile,
  FounderSimulationSubstepProfile,
  FounderSimulationDegradationSignal,
  FounderSimulationDegradationFinding,
  FounderSimulationDegradationRepairPlan,
  FounderSimulationDegradationRootCauseReport,
  FounderSimulationDegradationRootCauseAssessment,
  AssessFounderSimulationDegradationRootCauseInput,
} from './founder-simulation-degradation-root-cause-types.js';

export {
  assessFounderSimulationDegradationRootCause,
  applyFounderSimulationDegradationRootCauseSync,
  resetFounderSimulationDegradationRootCauseModuleForTests,
  resetFounderSimulationDegradationRootCauseCounterForTests,
} from './founder-simulation-degradation-root-cause-authority.js';

export {
  profileFounderSimulationStages,
  resolveTotalSimulationRuntimeMs,
} from './founder-simulation-stage-profiler.js';
export {
  profileAuthorityRuntimeFromTrace,
  mergeAuthorityProfiles,
} from './authority-runtime-profiler.js';
export { profileSubstepRuntime } from './substep-runtime-profiler.js';
export {
  detectSimulationDegradationSignals,
  isDegradedSimulation,
} from './simulation-degradation-detector.js';
export {
  classifyDegradationRootCauses,
  resolveWarningCompletionAuthority,
} from './degradation-root-cause-classifier.js';
export { planDegradationRepair } from './degradation-repair-planner.js';

export {
  buildFounderSimulationDegradationReportMarkdown,
  buildFounderSimulationDegradationRootCauseMarkdown,
  buildFounderSimulationDegradationRepairPlanMarkdown,
  buildFounderSimulationDegradationValidationMarkdown,
} from './founder-simulation-degradation-report-builder.js';

export {
  recordFounderSimulationDegradationReport,
  resetFounderSimulationDegradationHistoryForTests,
  getFounderSimulationDegradationHistorySize,
  getFounderSimulationDegradationHistory,
} from './founder-simulation-degradation-history.js';
