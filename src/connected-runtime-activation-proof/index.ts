/**
 * Connected Runtime Activation Proof — public API (Phase 26.9).
 */

export {
  CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_OWNER_MODULE,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_PHASE,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_REPORT_TITLE,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_CACHE_KEY_PREFIX,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_CORE_QUESTION,
  MAX_RUNTIME_ACTIVATION_PROOF_HISTORY,
  RUNTIME_SCRIPT_CANDIDATES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './connected-runtime-activation-proof-registry.js';

export type {
  RuntimeProofLevel,
  RuntimeActivationState,
  RuntimeProcessState,
  RuntimePortState,
  RuntimeHealthState,
  RuntimeCommandAssessment,
  RuntimeProcessAssessment,
  RuntimePortAssessment,
  RuntimeHealthAssessment,
  RuntimeLogAssessment,
  RuntimeManifestAssessment,
  RuntimeLinkageAnalysis,
  RuntimeActivationFounderQuestions,
  RuntimeActivationProofReport,
  RuntimeActivationProofAssessment,
  RuntimeSessionEvidence,
  AssessConnectedRuntimeActivationProofInput,
  RuntimeActivationProofHistoryEntry,
  RuntimeActivationProofHistorySummary,
  RuntimeActivationProofArtifacts,
} from './connected-runtime-activation-proof-types.js';

export {
  resetRuntimeActivationProofHistoryForTests,
  recordRuntimeActivationProofAssessment,
  getRuntimeActivationProofHistorySize,
  buildRuntimeActivationProofHistorySummary,
} from './connected-runtime-activation-proof-history.js';

export {
  assessConnectedRuntimeActivationProof,
  buildRuntimeActivationProofArtifacts,
  resetRuntimeActivationProofCounterForTests,
  resetConnectedRuntimeActivationProofModuleForTests,
} from './connected-runtime-activation-proof-authority.js';

export {
  buildRuntimeActivationProofReportMarkdown,
  formatRuntimeActivationProofSummary,
} from './connected-runtime-activation-proof-report-builder.js';

export { resolveRuntimeCommand } from './runtime-command-resolver.js';
export { analyzeRuntimeProcess, isProcessObserved } from './runtime-process-analyzer.js';
export { analyzeRuntimePort, isPortReachable } from './runtime-port-analyzer.js';
export { analyzeRuntimeHealth, isHealthAcceptable } from './runtime-health-analyzer.js';
export { analyzeRuntimeLogs } from './runtime-log-analyzer.js';
export { analyzeRuntimeManifest } from './runtime-manifest-analyzer.js';
export { analyzeRuntimeLinkage } from './runtime-linkage-analyzer.js';
