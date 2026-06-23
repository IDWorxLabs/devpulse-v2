/**
 * Phase 26.97 — Founder Simulation Payload Guard (V1).
 */

export type {
  ApplyFounderSimulationPayloadGuardInput,
  FounderSimulationPayloadFailureClass,
  FounderSimulationPayloadFieldRepair,
  FounderSimulationPayloadGuardAssessment,
  FounderSimulationPayloadGuardMetadata,
  FounderSimulationPayloadGuardReport,
  GuardedFounderSimulationExecutionResult,
} from './founder-simulation-payload-guard-types.js';

export {
  FOUNDER_SIMULATION_PAYLOAD_GUARD_CORE_QUESTION,
  FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS,
  FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS,
  FOUNDER_SIMULATION_PAYLOAD_GUARD_RULES,
  FOUNDER_SIMULATION_UNIFIED_SUMMARY_ARRAY_FIELDS,
  FOUNDER_SIMULATION_V4_ARRAY_FIELDS,
  INTEGRATION_TARGETS,
} from './founder-simulation-payload-guard-registry.js';

export {
  isGovernanceLengthCrashOriginalError,
  isLaunchVerdictGovernanceGuardedDiagnosticPath,
  mergeGovernanceSourceNormalizationIntoRaw,
  resolveGuardedDiagnosticOriginalError,
} from './founder-simulation-guarded-diagnostic-source-patch.js';

export {
  applyFounderSimulationPayloadGuard,
  guardFounderSimulationHandlerResult,
  resetFounderSimulationPayloadGuardCounterForTests,
  resetFounderSimulationPayloadGuardModuleForTests,
} from './founder-simulation-payload-guard-authority.js';

export {
  normalizeFounderSimulationExecutionResult,
  toHandlerResultShape,
  deepDefaultPayloadArrays,
  defaultAuthorityArrayFields,
} from './founder-simulation-payload-normalizer.js';

export { auditFounderSimulationPayloadShape, repairsFromRisks } from './founder-simulation-payload-shape-auditor.js';
export { detectUndefinedLengthRisks, hasReportBuilderUnguardedLengthAccess } from './undefined-length-access-detector.js';
export { buildGuardedDiagnosticMarkdown, planFounderSimulationPayloadRepairs } from './founder-simulation-payload-repair-planner.js';

export {
  buildFounderSimulationPayloadGuardReportMarkdown,
  buildFounderSimulationPayloadGuardValidationMarkdown,
} from './founder-simulation-payload-guard-report-builder.js';

export {
  getFounderSimulationPayloadGuardHistory,
  getFounderSimulationPayloadGuardHistorySize,
  recordFounderSimulationPayloadGuardReport,
  resetFounderSimulationPayloadGuardHistoryForTests,
} from './founder-simulation-payload-guard-history.js';
