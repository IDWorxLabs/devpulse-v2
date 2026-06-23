export {
  RUNTIME_STARTUP_PROOF_REPAIR_PASS,
  RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS,
  RUNTIME_STARTUP_PROOF_REPAIR_OWNER_MODULE,
  RUNTIME_STARTUP_PROOF_REPAIR_PHASE,
  RUNTIME_STARTUP_PROOF_REPAIR_REPORT_TITLE,
  RUNTIME_STARTUP_FAILURE_CLASSIFICATION_REPORT_TITLE,
  RUNTIME_STARTUP_PROOF_REPAIR_CORE_QUESTION,
  RUNTIME_STARTUP_PROOF_REPAIR_CACHE_KEY_PREFIX,
  DEFAULT_STARTUP_PROBE_PORT,
  RUNTIME_STARTUP_PROBE_TIMEOUT_MS,
  FRAMEWORK_DEFAULT_PORTS,
  STARTUP_COMMAND_RESOLUTION_PRIORITY,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  ENTRYPOINT_MARKERS,
  SCRIPT_CANDIDATES,
} from './runtime-startup-proof-repair-registry.js';

export type {
  RuntimeAppType,
  StartupCommandEvidenceSource,
  StartupFailureClass,
  RuntimeEntrypointCandidate,
  ResolvedStartupCommand,
  RuntimeStartupProbeResult,
  RuntimeStartupProofRepairReport,
  RuntimeStartupProofRepairAssessment,
  AssessRuntimeStartupProofRepairInput,
  RuntimeStartupProofRepairHistoryEntry,
} from './runtime-startup-proof-repair-types.js';

export {
  discoverRuntimeEntrypoint,
  resolvePrimaryWorkspace,
} from './runtime-entrypoint-discovery.js';

export { resolveStartupCommand } from './runtime-start-command-resolver.js';
export { probeRuntimeStartup, reconcileStartupProbeVerdict, isSuccessfulHealthResponse } from './runtime-process-probe.js';
export {
  classifyStartupFailure,
  type StartupFailureClassification,
} from './runtime-startup-failure-classifier.js';

export {
  resetRuntimeStartupProofRepairHistoryForTests,
  recordRuntimeStartupProofRepairAssessment,
  getRuntimeStartupProofRepairHistorySize,
  getLatestRuntimeStartupProofRepairHistoryEntry,
  getRuntimeStartupProofRepairHistory,
} from './runtime-startup-proof-repair-history.js';

export {
  buildRuntimeStartupProofRepairReportMarkdown,
  buildRuntimeStartupFailureClassificationReportMarkdown,
} from './runtime-startup-proof-report-builder.js';

export {
  assessRuntimeStartupProofRepair,
  resetRuntimeStartupProofRepairCounterForTests,
  resetRuntimeStartupProofRepairModuleForTests,
} from './runtime-startup-proof-repair-authority.js';
