/**
 * Connected Verification Execution — public API.
 */

export {
  CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN,
  CONNECTED_VERIFICATION_EXECUTION_OWNER_MODULE,
  CONNECTED_VERIFICATION_EXECUTION_PHASE,
  CONNECTED_VERIFICATION_EXECUTION_REPORT_TITLE,
  CONNECTED_VERIFICATION_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION,
  MAX_CONNECTED_VERIFICATION_EXECUTION_HISTORY,
  MAX_VERIFICATION_WARNINGS,
  MAX_VERIFICATION_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
  MAX_VERIFICATION_ARTIFACTS,
  MAX_VERIFICATION_EVIDENCE,
  MAX_VERIFICATION_DIAGNOSTICS,
  MAX_VERIFICATION_RESULTS,
  VERIFICATION_PROBE_TIMEOUT_MS,
  VERIFICATION_EXECUTION_STATES,
  REQUIRED_BOUNDED_CHECKS,
  OPTIONAL_BOUNDED_CHECKS,
  VERIFICATION_PLAN,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  VERIFICATION_EXECUTION_SAFETY_GUARANTEES,
  isVerificationExecutionState,
} from './connected-verification-execution-registry.js';

export type {
  VerificationExecutionState,
  VerificationExecutionMode,
  VerificationCheckStatus,
  VerificationResultEntry,
  VerificationArtifactEntry,
  VerificationEvidenceEntry,
  VerificationDiagnosticEntry,
  VerificationExecutionEvidence,
  VerificationExecutionContract,
  VerificationExecutionQuestionAnswers,
  ConnectedVerificationExecutionInputSnapshot,
  ConnectedVerificationExecutionReport,
  ConnectedVerificationExecutionAssessment,
  AssessConnectedVerificationExecutionInput,
  ConnectedVerificationExecutionHistoryEntry,
  ConnectedVerificationExecutionHistorySummary,
  ConnectedVerificationExecutionArtifacts,
  ExecuteVerificationExecutionInput,
  ExecuteVerificationExecutionResult,
} from './connected-verification-execution-types.js';

export {
  resetConnectedVerificationExecutionHistoryForTests,
  recordConnectedVerificationExecutionAssessment,
  getConnectedVerificationExecutionHistorySize,
  getLatestConnectedVerificationExecutionHistoryEntry,
  getLatestConnectedVerificationExecutionAssessment,
  getConnectedVerificationExecutionHistory,
  countVerificationExecutionState,
  buildConnectedVerificationExecutionHistorySummary,
} from './connected-verification-execution-history.js';

export {
  assessConnectedVerificationExecution,
  buildConnectedVerificationExecutionArtifacts,
  deriveVerificationExecutionQuestionAnswers,
  deriveVerificationScore,
  deriveVerificationExecutionState,
  deriveVerificationCoverage,
  resetConnectedVerificationExecutionCounterForTests,
  resetConnectedVerificationExecutionModuleForTests,
} from './connected-verification-execution-authority.js';

export {
  executeVerificationExecution,
  resetVerificationExecutionEngineForTests,
} from './verification-execution-engine.js';

export { buildConnectedVerificationExecutionReportMarkdown } from './connected-verification-execution-report-builder.js';
