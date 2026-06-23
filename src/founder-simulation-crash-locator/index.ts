/**
 * Phase 26.99 — Founder Simulation Crash Locator (V1).
 */

export {
  FOUNDER_SIMULATION_CRASH_LOCATOR_PASS,
  FOUNDER_SIMULATION_CRASH_LOCATOR_CORE_QUESTION,
  FOUNDER_SIMULATION_CRASH_LOCATOR_CACHE_KEY_PREFIX,
  UNDEFINED_LENGTH_ERROR_PATTERN,
  V5_REPORT_BUILDER_FILE_HINT,
  CONFIRMED_V5_CRASH_FIELD_PATHS,
  V5_LINE_TO_FIELD_PATH,
  FOUNDER_SIMULATION_CRASH_FAILURE_CLASSES,
  CRASH_LOCATOR_INTEGRATION_TARGETS,
  isUndefinedLengthCrashError,
} from './founder-simulation-crash-locator-registry.js';

export type {
  FounderSimulationCrashFailureClass,
  CrashFieldKind,
  UndefinedLengthStackFrame,
  FounderSimulationCrashContext,
  FounderSimulationCrashLocatorReport,
  FounderSimulationCrashLocatorAssessment,
  LocateFounderSimulationCrashInput,
  ApplyFounderSimulationCrashPatchInput,
} from './founder-simulation-crash-locator-types.js';

export {
  isUndefinedLengthCrashError as isUndefinedLengthError,
  extractErrorMessage,
  extractErrorStack,
  parseUndefinedLengthStack,
  findPrimaryCrashFrame,
  formatCrashLocation,
} from './undefined-length-stack-parser.js';

export {
  probeFieldPath,
  resolveLikelyFieldPaths,
  selectPrimaryCrashFieldPath,
} from './object-path-probe.js';

export { captureFounderSimulationCrashContext } from './founder-simulation-crash-context-capturer.js';
export { classifyFounderSimulationCrash } from './founder-simulation-crash-classifier.js';

export {
  recordFounderSimulationCrashLocatorReport,
  getFounderSimulationCrashLocatorHistory,
  getLatestFounderSimulationCrashLocatorReport,
  resetFounderSimulationCrashLocatorHistoryForTests,
} from './founder-simulation-crash-locator-history.js';

export {
  buildFounderSimulationCrashLocatorReportMarkdown,
  buildGuardedCrashDiagnosticSection,
  buildFounderSimulationCrashLocatorValidationMarkdown,
} from './founder-simulation-crash-locator-report-builder.js';

export {
  applyTargetedCrashFieldPatch,
  applyConfirmedV5LaunchVerdictGovernancePatches,
  locateFounderSimulationUndefinedLengthCrash,
  applyFounderSimulationCrashPatch,
  locateAndPatchFounderSimulationCrash,
  tryBuildV5ReportWithCrashLocator,
  resetFounderSimulationCrashLocatorCounterForTests,
  resetFounderSimulationCrashLocatorModuleForTests,
} from './founder-simulation-crash-locator-authority.js';